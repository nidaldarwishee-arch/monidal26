import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import {
  booleanField,
  isRecord,
  rowsFromPayload,
  stringField,
  validateGroupId,
  type ImportIssue,
  type ImportOutcome,
} from "@/lib/fifa/importers/validation";

type TeamInsert = Database["public"]["Tables"]["teams"]["Insert"];

function parseTeams(payload: unknown): { rows: TeamInsert[]; issues: ImportIssue[] } {
  const issues: ImportIssue[] = [];
  const sourceRows = rowsFromPayload(payload, "teams");

  if (!sourceRows.length) {
    issues.push({ index: -1, message: "Payload must be an array or contain a teams array." });
  }

  const rows = sourceRows.flatMap((item, index) => {
    if (!isRecord(item)) {
      issues.push({ index, message: "Expected an object." });
      return [];
    }

    const id = stringField(item, ["id", "team_id", "code"], index, issues, { field: "id" });
    const groupId = validateGroupId(
      stringField(item, ["group_id", "groupId", "group"], index, issues, {
        field: "group_id",
      }),
      index,
      issues
    );
    const iso = stringField(item, ["iso", "flag_iso"], index, issues, { field: "iso" });
    const nameEn = stringField(item, ["name_en", "nameEn", "name"], index, issues, {
      field: "name_en",
    });
    const nameAr = stringField(item, ["name_ar", "nameAr"], index, issues, {
      field: "name_ar",
    });

    if (!id || !groupId || !iso || !nameEn || !nameAr) return [];

    return [
      {
        id: id.toUpperCase(),
        group_id: groupId,
        iso: iso.toLowerCase(),
        name_en: nameEn,
        name_ar: nameAr,
        host: booleanField(item, ["host", "isHost"]),
      },
    ];
  });

  return { rows, issues };
}

export async function importTeams(
  supabase: SupabaseClient<Database>,
  payload: unknown
): Promise<ImportOutcome> {
  const parsed = parseTeams(payload);
  if (parsed.issues.length) return { imported: 0, issues: parsed.issues };

  const { error } = await supabase.from("teams").upsert(parsed.rows, { onConflict: "id" });
  if (error) throw new Error(error.message);

  return { imported: parsed.rows.length, issues: [] };
}
