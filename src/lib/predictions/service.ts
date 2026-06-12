import type { SupabaseClient } from "@supabase/supabase-js";
import { MATCH_MAP } from "@/data/matches";
import { SEED_RESULTS } from "@/data/results";
import type { Database } from "@/lib/supabase/database.types";
import { toResultsMap } from "@/lib/bracket";
import { hasKickedOff } from "@/lib/time";
import type { MatchResult, Prediction } from "@/lib/types";
import {
  isRecord,
  numberField,
  stringField,
  validateGoal,
  type ImportIssue,
} from "@/lib/fifa/importers/validation";
import {
  scorePredictions,
  type PredictionScoreSummary,
  type ScoredPrediction,
} from "@/lib/predictions/scoring";

type DbClient = SupabaseClient<Database>;
type PredictionRow = Database["public"]["Tables"]["user_predictions"]["Row"];

export interface PredictionValidationResult {
  prediction?: Omit<Prediction, "updatedAt">;
  issues: ImportIssue[];
}

export interface UserPredictionScore {
  userId: string;
  summary: PredictionScoreSummary;
  items: ScoredPrediction[];
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  summary: PredictionScoreSummary;
}

function toPrediction(row: Pick<PredictionRow, "match_n" | "home_goals" | "away_goals" | "winner_team_id" | "updated_at">): Prediction {
  return {
    matchN: row.match_n,
    homeGoals: row.home_goals,
    awayGoals: row.away_goals,
    winner: row.winner_team_id ?? undefined,
    updatedAt: row.updated_at,
  };
}

function toResult(row: {
  match_n: number;
  home_goals: number;
  away_goals: number;
  winner_team_id: string | null;
  status: Database["public"]["Tables"]["match_results"]["Row"]["status"];
}): MatchResult {
  return {
    matchN: row.match_n,
    homeGoals: row.home_goals,
    awayGoals: row.away_goals,
    winner: row.winner_team_id ?? undefined,
    status: row.status === "live" || row.status === "halftime" ? row.status : "finished",
  };
}

export async function getOfficialResultsMap(supabase: DbClient) {
  const map = toResultsMap(SEED_RESULTS);
  const { data, error } = await supabase
    .from("match_results")
    .select("match_n, home_goals, away_goals, winner_team_id, status")
    .eq("official", true);

  if (error) throw new Error(error.message);
  for (const row of data ?? []) {
    map.set(row.match_n, toResult(row));
  }
  return map;
}

export function validatePredictionPayload(
  payload: unknown,
  forcedMatchN?: number
): PredictionValidationResult {
  const issues: ImportIssue[] = [];
  if (!isRecord(payload)) {
    return {
      issues: [{ index: -1, message: "Expected an object payload." }],
    };
  }

  const matchN =
    forcedMatchN ??
    numberField(payload, ["match_n", "matchN", "n"], -1, issues, "match_n");
  const homeGoals = validateGoal(
    numberField(payload, ["home_goals", "homeGoals"], -1, issues, "home_goals"),
    -1,
    issues,
    "home_goals"
  );
  const awayGoals = validateGoal(
    numberField(payload, ["away_goals", "awayGoals"], -1, issues, "away_goals"),
    -1,
    issues,
    "away_goals"
  );
  const winner = stringField(
    payload,
    ["winner_team_id", "winnerTeamId", "winner"],
    -1,
    issues,
    { field: "winner_team_id", required: false }
  );

  if (matchN === null || !Number.isInteger(matchN) || matchN < 1 || matchN > 104) {
    issues.push({ index: -1, field: "match_n", message: "Expected a match number from 1 to 104." });
    return { issues };
  }

  const match = MATCH_MAP[matchN];
  if (!match) {
    issues.push({ index: -1, field: "match_n", message: "Match does not exist." });
    return { issues };
  }

  if (homeGoals === null || awayGoals === null) return { issues };

  if (hasKickedOff(match.t)) {
    issues.push({ index: -1, field: "match_n", message: "Predictions are locked at kickoff." });
  }

  if (match.r !== "GS" && homeGoals === awayGoals && !winner) {
    issues.push({
      index: -1,
      field: "winner_team_id",
      message: "Knockout draw predictions require a winner.",
    });
  }

  if (issues.length) return { issues };

  return {
    prediction: {
      matchN,
      homeGoals,
      awayGoals,
      winner: winner ?? undefined,
    },
    issues: [],
  };
}

export async function listUserPredictions(supabase: DbClient, userId: string) {
  const { data, error } = await supabase
    .from("user_predictions")
    .select("match_n, home_goals, away_goals, winner_team_id, updated_at")
    .eq("user_id", userId)
    .order("match_n");
  if (error) throw new Error(error.message);
  return (data ?? []).map(toPrediction);
}

export async function saveUserPrediction(
  supabase: DbClient,
  userId: string,
  payload: unknown,
  forcedMatchN?: number
) {
  const validation = validatePredictionPayload(payload, forcedMatchN);
  if (!validation.prediction) return validation;

  const { prediction } = validation;
  const updatedAt = new Date().toISOString();
  const { error } = await supabase.from("user_predictions").upsert(
    {
      user_id: userId,
      match_n: prediction.matchN,
      home_goals: prediction.homeGoals,
      away_goals: prediction.awayGoals,
      winner_team_id: prediction.winner ?? null,
      updated_at: updatedAt,
    },
    { onConflict: "user_id,match_n" }
  );
  if (error) throw new Error(error.message);

  return {
    prediction: {
      ...prediction,
      updatedAt,
    },
    issues: [],
  };
}

export async function deleteUserPrediction(
  supabase: DbClient,
  userId: string,
  matchN: number
) {
  const { error } = await supabase
    .from("user_predictions")
    .delete()
    .eq("user_id", userId)
    .eq("match_n", matchN);
  if (error) throw new Error(error.message);
}

export async function getUserPredictionScore(
  supabase: DbClient,
  userId: string
): Promise<UserPredictionScore> {
  const [predictions, results] = await Promise.all([
    listUserPredictions(supabase, userId),
    getOfficialResultsMap(supabase),
  ]);
  const score = scorePredictions(predictions, results);
  return { userId, ...score };
}

export async function getPredictionLeaderboard(
  supabase: DbClient
): Promise<LeaderboardEntry[]> {
  const [predictionsResponse, profilesResponse, results] = await Promise.all([
    supabase
      .from("user_predictions")
      .select("user_id, match_n, home_goals, away_goals, winner_team_id, updated_at"),
    supabase.from("profiles").select("id, display_name"),
    getOfficialResultsMap(supabase),
  ]);

  if (predictionsResponse.error) throw new Error(predictionsResponse.error.message);
  if (profilesResponse.error) throw new Error(profilesResponse.error.message);

  const profiles = new Map(
    (profilesResponse.data ?? []).map((profile) => [
      profile.id,
      profile.display_name ?? "User",
    ])
  );

  const byUser = new Map<string, Prediction[]>();
  for (const row of predictionsResponse.data ?? []) {
    const predictions = byUser.get(row.user_id) ?? [];
    predictions.push(toPrediction(row));
    byUser.set(row.user_id, predictions);
  }

  const entries = [...byUser.entries()]
    .map(([userId, predictions]) => ({
      rank: 0,
      userId,
      displayName: profiles.get(userId) ?? "User",
      summary: scorePredictions(predictions, results).summary,
    }))
    .sort(
      (a, b) =>
        b.summary.points - a.summary.points ||
        b.summary.exact - a.summary.exact ||
        b.summary.outcome - a.summary.outcome ||
        b.summary.scored - a.summary.scored ||
        a.displayName.localeCompare(b.displayName)
    );

  let previousKey = "";
  let previousRank = 0;
  return entries.map((entry, index) => {
    const key = [
      entry.summary.points,
      entry.summary.exact,
      entry.summary.outcome,
      entry.summary.scored,
    ].join(":");
    const rank = key === previousKey ? previousRank : index + 1;
    previousKey = key;
    previousRank = rank;
    return { ...entry, rank };
  });
}
