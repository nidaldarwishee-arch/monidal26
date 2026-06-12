import type { SupabaseClient } from "@supabase/supabase-js";
import { MATCH_MAP } from "@/data/matches";
import type { Database } from "@/lib/supabase/database.types";
import { isFinalResultStatus } from "@/lib/types";
import {
  isRecord,
  numberField,
  rowsFromPayload,
  stringField,
  validateGoal,
  validateResultStatus,
  type ImportIssue,
  type ImportOutcome,
} from "@/lib/fifa/importers/validation";

type ResultInsert = Database["public"]["Tables"]["match_results"]["Insert"];
type ResultStatus = Database["public"]["Tables"]["match_results"]["Row"]["status"];

interface ResultImportOutcome extends ImportOutcome {
  statusUpdated: number;
}

function parseResults(
  payload: unknown,
  updatedBy: string
): { rows: ResultInsert[]; issues: ImportIssue[] } {
  const issues: ImportIssue[] = [];
  const sourceRows = rowsFromPayload(payload, "results");

  if (!sourceRows.length) {
    issues.push({ index: -1, message: "Payload must be an array or contain a results array." });
  }

  const rows = sourceRows.flatMap((item, index) => {
    if (!isRecord(item)) {
      issues.push({ index, message: "Expected an object." });
      return [];
    }

    const matchN = numberField(item, ["match_n", "matchN", "n"], index, issues, "match_n");
    const homeGoals = validateGoal(
      numberField(item, ["home_goals", "homeGoals"], index, issues, "home_goals"),
      index,
      issues,
      "home_goals"
    );
    const awayGoals = validateGoal(
      numberField(item, ["away_goals", "awayGoals"], index, issues, "away_goals"),
      index,
      issues,
      "away_goals"
    );
    const winnerTeamId = stringField(
      item,
      ["winner_team_id", "winnerTeamId", "winner"],
      index,
      issues,
      { field: "winner_team_id", required: false }
    );
    const status = validateResultStatus(
      stringField(item, ["status"], index, issues, { field: "status", required: false }),
      index,
      issues
    );
    const homeScore = optionalGoal(item, ["home_score", "homeScore"], index, issues, "home_score");
    const awayScore = optionalGoal(item, ["away_score", "awayScore"], index, issues, "away_score");
    const halftimeHomeScore = optionalGoal(
      item,
      ["halftime_home_score", "halftimeHomeScore"],
      index,
      issues,
      "halftime_home_score"
    );
    const halftimeAwayScore = optionalGoal(
      item,
      ["halftime_away_score", "halftimeAwayScore"],
      index,
      issues,
      "halftime_away_score"
    );
    const extraTimeHomeScore = optionalGoal(
      item,
      ["extra_time_home_score", "extraTimeHomeScore"],
      index,
      issues,
      "extra_time_home_score"
    );
    const extraTimeAwayScore = optionalGoal(
      item,
      ["extra_time_away_score", "extraTimeAwayScore"],
      index,
      issues,
      "extra_time_away_score"
    );
    const penaltyHomeScore = optionalGoal(
      item,
      ["penalty_home_score", "penaltyHomeScore"],
      index,
      issues,
      "penalty_home_score"
    );
    const penaltyAwayScore = optionalGoal(
      item,
      ["penalty_away_score", "penaltyAwayScore"],
      index,
      issues,
      "penalty_away_score"
    );
    const liveMinute = optionalMinute(item, ["live_minute", "liveMinute"], index, issues, "live_minute");
    const externalProvider = stringField(
      item,
      ["external_provider", "externalProvider"],
      index,
      issues,
      { field: "external_provider", required: false }
    );
    const externalMatchId = stringField(
      item,
      ["external_match_id", "externalMatchId"],
      index,
      issues,
      { field: "external_match_id", required: false }
    );

    if (matchN === null || !Number.isInteger(matchN) || matchN < 1 || matchN > 104) {
      issues.push({ index, field: "match_n", message: "Expected a match number from 1 to 104." });
      return [];
    }

    const match = MATCH_MAP[matchN];
    if (!match) {
      issues.push({ index, field: "match_n", message: "Match does not exist in the schedule." });
      return [];
    }

    if (homeGoals === null || awayGoals === null) return [];

    if (match.r !== "GS" && homeGoals === awayGoals && !winnerTeamId && isFinalResultStatus(status)) {
      issues.push({
        index,
        field: "winner_team_id",
        message: "Played knockout draws require a winner.",
      });
      return [];
    }

    return [
      {
        match_n: matchN,
        home_goals: homeGoals,
        away_goals: awayGoals,
        home_score: homeScore ?? homeGoals,
        away_score: awayScore ?? awayGoals,
        halftime_home_score: halftimeHomeScore ?? null,
        halftime_away_score: halftimeAwayScore ?? null,
        extra_time_home_score: extraTimeHomeScore ?? null,
        extra_time_away_score: extraTimeAwayScore ?? null,
        penalty_home_score: penaltyHomeScore ?? null,
        penalty_away_score: penaltyAwayScore ?? null,
        winner_team_id: winnerTeamId,
        status,
        official: true,
        updated_by: updatedBy,
        live_minute: liveMinute ?? null,
        external_provider: externalProvider,
        external_match_id: externalMatchId,
        last_synced_at: externalProvider || externalMatchId ? new Date().toISOString() : null,
        locked: isFinalResultStatus(status),
        updated_at: new Date().toISOString(),
      },
    ];
  });

  return { rows, issues };
}

function hasAnyKey(row: Record<string, unknown>, keys: string[]) {
  return keys.some((key) => row[key] !== undefined);
}

function optionalGoal(
  row: Record<string, unknown>,
  keys: string[],
  index: number,
  issues: ImportIssue[],
  field: string
) {
  if (!hasAnyKey(row, keys)) return undefined;
  return validateGoal(numberField(row, keys, index, issues, field), index, issues, field) ?? undefined;
}

function optionalMinute(
  row: Record<string, unknown>,
  keys: string[],
  index: number,
  issues: ImportIssue[],
  field: string
) {
  if (!hasAnyKey(row, keys)) return undefined;
  const minute = numberField(row, keys, index, issues, field);
  if (minute === null || !Number.isInteger(minute) || minute < 0 || minute > 130) {
    issues.push({ index, field, message: "Expected an integer between 0 and 130." });
    return undefined;
  }
  return minute;
}

export async function updateResults(
  supabase: SupabaseClient<Database>,
  payload: unknown,
  updatedBy: string
): Promise<ResultImportOutcome> {
  const parsed = parseResults(payload, updatedBy);
  if (parsed.issues.length) {
    return { imported: 0, statusUpdated: 0, issues: parsed.issues };
  }

  const { error } = await supabase
    .from("match_results")
    .upsert(parsed.rows, { onConflict: "match_n" });
  if (error) throw new Error(error.message);

  let statusUpdated = 0;
  const statuses = new Map<ResultStatus, number[]>();
  for (const row of parsed.rows) {
    const rows = statuses.get(row.status ?? "played") ?? [];
    rows.push(row.match_n);
    statuses.set(row.status ?? "played", rows);
  }

  for (const [status, matchNumbers] of statuses) {
    const { error: statusError } = await supabase
      .from("matches")
      .update({ status })
      .in("match_n", matchNumbers);
    if (statusError) throw new Error(statusError.message);
    statusUpdated += matchNumbers.length;
  }

  return { imported: parsed.rows.length, statusUpdated, issues: [] };
}
