import type { SupabaseClient } from "@supabase/supabase-js";
import { MATCH_MAP } from "@/data/matches";
import type { Database } from "@/lib/supabase/database.types";
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

    if (match.r !== "GS" && homeGoals === awayGoals && !winnerTeamId && status === "played") {
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
        winner_team_id: winnerTeamId,
        status,
        official: true,
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      },
    ];
  });

  return { rows, issues };
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

  const played = parsed.rows.filter((row) => row.status === "played").map((row) => row.match_n);
  const live = parsed.rows.filter((row) => row.status === "live").map((row) => row.match_n);

  let statusUpdated = 0;
  if (played.length) {
    const { error: statusError } = await supabase
      .from("matches")
      .update({ status: "played" })
      .in("match_n", played);
    if (statusError) throw new Error(statusError.message);
    statusUpdated += played.length;
  }
  if (live.length) {
    const { error: statusError } = await supabase
      .from("matches")
      .update({ status: "live" })
      .in("match_n", live);
    if (statusError) throw new Error(statusError.message);
    statusUpdated += live.length;
  }

  return { imported: parsed.rows.length, statusUpdated, issues: [] };
}
