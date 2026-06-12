import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import {
  isRecord,
  numberField,
  rowsFromPayload,
  stringField,
  validateGroupId,
  validateKickoff,
  validateMatchStatus,
  validateRoundId,
  type ImportIssue,
  type ImportOutcome,
} from "@/lib/fifa/importers/validation";

type MatchInsert = Database["public"]["Tables"]["matches"]["Insert"];

function parseFixtures(payload: unknown): { rows: MatchInsert[]; issues: ImportIssue[] } {
  const issues: ImportIssue[] = [];
  const sourceRows = rowsFromPayload(payload, ["fixtures", "matches"]);

  if (!sourceRows.length) {
    issues.push({ index: -1, message: "Payload must be an array or contain fixtures/matches." });
  }

  const rows = sourceRows.flatMap((item, index) => {
    if (!isRecord(item)) {
      issues.push({ index, message: "Expected an object." });
      return [];
    }

    const matchN = numberField(item, ["match_n", "matchN", "n"], index, issues, "match_n");
    const round = validateRoundId(
      stringField(item, ["round", "r"], index, issues, { field: "round" }),
      index,
      issues
    );
    const groupId = validateGroupId(
      stringField(item, ["group_id", "groupId", "group", "g"], index, issues, {
        field: "group_id",
        required: round === "GS",
      }),
      index,
      issues
    );
    const homeSlot = stringField(item, ["home_slot", "homeSlot", "home", "h"], index, issues, {
      field: "home_slot",
    });
    const awaySlot = stringField(item, ["away_slot", "awaySlot", "away", "a"], index, issues, {
      field: "away_slot",
    });
    const kickoffAt = validateKickoff(
      stringField(item, ["kickoff_at", "kickoffAt", "time", "t"], index, issues, {
        field: "kickoff_at",
      }),
      index,
      issues
    );
    const venueId = stringField(item, ["venue_id", "venueId", "venue", "v"], index, issues, {
      field: "venue_id",
    });
    const status = validateMatchStatus(
      stringField(item, ["status"], index, issues, { field: "status", required: false }),
      index,
      issues
    );

    if (
      matchN === null ||
      !Number.isInteger(matchN) ||
      matchN < 1 ||
      matchN > 104 ||
      !round ||
      (round === "GS" && !groupId) ||
      !homeSlot ||
      !awaySlot ||
      !kickoffAt ||
      !venueId
    ) {
      if (matchN !== null && (!Number.isInteger(matchN) || matchN < 1 || matchN > 104)) {
        issues.push({ index, field: "match_n", message: "Expected a match number from 1 to 104." });
      }
      return [];
    }

    return [
      {
        match_n: matchN,
        round,
        group_id: groupId,
        home_slot: homeSlot,
        away_slot: awaySlot,
        kickoff_at: kickoffAt,
        venue_id: venueId,
        status,
      },
    ];
  });

  return { rows, issues };
}

export async function importFixtures(
  supabase: SupabaseClient<Database>,
  payload: unknown
): Promise<ImportOutcome> {
  const parsed = parseFixtures(payload);
  if (parsed.issues.length) return { imported: 0, issues: parsed.issues };

  const { error } = await supabase.from("matches").upsert(parsed.rows, { onConflict: "match_n" });
  if (error) throw new Error(error.message);

  return { imported: parsed.rows.length, issues: [] };
}
