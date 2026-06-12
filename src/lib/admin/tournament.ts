import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import {
  booleanField,
  isRecord,
  numberField,
  rowsFromPayload,
  stringField,
  validateCountry,
  validateGroupId,
  validateKickoff,
  validateMatchStatus,
  validateRoundId,
  type ImportIssue,
  type ImportOutcome,
} from "@/lib/fifa/importers/validation";

type DbClient = SupabaseClient<Database>;
type TeamUpdate = Database["public"]["Tables"]["teams"]["Update"];
type VenueInsert = Database["public"]["Tables"]["venues"]["Insert"];
type VenueUpdate = Database["public"]["Tables"]["venues"]["Update"];
type MatchUpdate = Database["public"]["Tables"]["matches"]["Update"];

export class AdminValidationError extends Error {
  constructor(readonly issues: ImportIssue[]) {
    super("Validation failed.");
  }
}

function readObject(payload: unknown): Record<string, unknown> {
  if (!isRecord(payload)) {
    throw new AdminValidationError([{ index: -1, message: "Expected an object payload." }]);
  }
  return payload;
}

function optionalValue(row: Record<string, unknown>, keys: string[]) {
  const key = keys.find((item) => row[item] !== undefined);
  return key ? { present: true, value: row[key] } : { present: false, value: undefined };
}

function optionalString(
  row: Record<string, unknown>,
  keys: string[],
  field: string,
  issues: ImportIssue[]
): string | undefined {
  const value = optionalValue(row, keys);
  if (!value.present) return undefined;
  if (typeof value.value !== "string" || value.value.trim() === "") {
    issues.push({ index: -1, field, message: "Expected a non-empty string." });
    return undefined;
  }
  return value.value.trim();
}

function optionalNumber(
  row: Record<string, unknown>,
  keys: string[],
  field: string,
  issues: ImportIssue[]
): number | undefined {
  const value = optionalValue(row, keys);
  if (!value.present) return undefined;
  const number =
    typeof value.value === "number"
      ? value.value
      : typeof value.value === "string"
        ? Number(value.value)
        : NaN;
  if (!Number.isFinite(number)) {
    issues.push({ index: -1, field, message: "Expected a number." });
    return undefined;
  }
  return number;
}

function optionalBoolean(row: Record<string, unknown>, keys: string[]) {
  const value = optionalValue(row, keys);
  if (!value.present) return undefined;
  return booleanField(row, keys);
}

function throwIfInvalid(issues: ImportIssue[]) {
  if (issues.length) throw new AdminValidationError(issues);
}

function throwIfEmpty(values: Record<string, unknown>) {
  if (!Object.keys(values).length) {
    throw new AdminValidationError([{ index: -1, message: "No supported fields were provided." }]);
  }
}

function parseVenues(payload: unknown): { rows: VenueInsert[]; issues: ImportIssue[] } {
  const issues: ImportIssue[] = [];
  const sourceRows = rowsFromPayload(payload, "venues");
  if (!sourceRows.length) {
    issues.push({ index: -1, message: "Payload must be an array or contain a venues array." });
  }

  const rows = sourceRows.flatMap((item, index) => {
    if (!isRecord(item)) {
      issues.push({ index, message: "Expected an object." });
      return [];
    }

    const id = stringField(item, ["id", "venue_id"], index, issues, { field: "id" });
    const nameEn = stringField(item, ["name_en", "nameEn", "name"], index, issues, {
      field: "name_en",
    });
    const nameAr = stringField(item, ["name_ar", "nameAr"], index, issues, {
      field: "name_ar",
    });
    const cityEn = stringField(item, ["city_en", "cityEn", "city"], index, issues, {
      field: "city_en",
    });
    const cityAr = stringField(item, ["city_ar", "cityAr"], index, issues, {
      field: "city_ar",
    });
    const country = validateCountry(
      stringField(item, ["country"], index, issues, { field: "country" }),
      index,
      issues
    );
    const lat = numberField(item, ["lat"], index, issues, "lat");
    const lng = numberField(item, ["lng"], index, issues, "lng");
    const tz = stringField(item, ["tz", "timezone"], index, issues, { field: "tz" });
    const capacity = numberField(item, ["capacity"], index, issues, "capacity");

    if (
      !id ||
      !nameEn ||
      !nameAr ||
      !cityEn ||
      !cityAr ||
      !country ||
      lat === null ||
      lng === null ||
      !tz ||
      capacity === null ||
      !Number.isInteger(capacity) ||
      capacity <= 0
    ) {
      if (capacity !== null && (!Number.isInteger(capacity) || capacity <= 0)) {
        issues.push({ index, field: "capacity", message: "Expected a positive integer." });
      }
      return [];
    }

    return [
      {
        id,
        name_en: nameEn,
        name_ar: nameAr,
        city_en: cityEn,
        city_ar: cityAr,
        country,
        lat,
        lng,
        tz,
        capacity,
      },
    ];
  });

  return { rows, issues };
}

export async function listTeams(supabase: DbClient) {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .order("group_id")
    .order("id");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateTeam(supabase: DbClient, id: string, payload: unknown) {
  const body = readObject(payload);
  const issues: ImportIssue[] = [];
  const update: TeamUpdate = {};

  const groupId = optionalString(body, ["group_id", "groupId", "group"], "group_id", issues);
  if (groupId !== undefined) update.group_id = validateGroupId(groupId, -1, issues) ?? undefined;
  const iso = optionalString(body, ["iso", "flag_iso"], "iso", issues);
  if (iso !== undefined) update.iso = iso.toLowerCase();
  const nameEn = optionalString(body, ["name_en", "nameEn", "name"], "name_en", issues);
  if (nameEn !== undefined) update.name_en = nameEn;
  const nameAr = optionalString(body, ["name_ar", "nameAr"], "name_ar", issues);
  if (nameAr !== undefined) update.name_ar = nameAr;
  const host = optionalBoolean(body, ["host", "isHost"]);
  if (host !== undefined) update.host = host;

  throwIfInvalid(issues);
  throwIfEmpty(update);

  const { data, error } = await supabase
    .from("teams")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteTeam(supabase: DbClient, id: string) {
  const { error } = await supabase.from("teams").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listVenues(supabase: DbClient) {
  const { data, error } = await supabase.from("venues").select("*").order("country").order("city_en");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function upsertVenues(supabase: DbClient, payload: unknown): Promise<ImportOutcome> {
  const parsed = parseVenues(payload);
  if (parsed.issues.length) return { imported: 0, issues: parsed.issues };

  const { error } = await supabase.from("venues").upsert(parsed.rows, { onConflict: "id" });
  if (error) throw new Error(error.message);
  return { imported: parsed.rows.length, issues: [] };
}

export async function updateVenue(supabase: DbClient, id: string, payload: unknown) {
  const body = readObject(payload);
  const issues: ImportIssue[] = [];
  const update: VenueUpdate = {};

  const nameEn = optionalString(body, ["name_en", "nameEn", "name"], "name_en", issues);
  if (nameEn !== undefined) update.name_en = nameEn;
  const nameAr = optionalString(body, ["name_ar", "nameAr"], "name_ar", issues);
  if (nameAr !== undefined) update.name_ar = nameAr;
  const cityEn = optionalString(body, ["city_en", "cityEn", "city"], "city_en", issues);
  if (cityEn !== undefined) update.city_en = cityEn;
  const cityAr = optionalString(body, ["city_ar", "cityAr"], "city_ar", issues);
  if (cityAr !== undefined) update.city_ar = cityAr;
  const country = optionalString(body, ["country"], "country", issues);
  if (country !== undefined) update.country = validateCountry(country, -1, issues) ?? undefined;
  const lat = optionalNumber(body, ["lat"], "lat", issues);
  if (lat !== undefined) update.lat = lat;
  const lng = optionalNumber(body, ["lng"], "lng", issues);
  if (lng !== undefined) update.lng = lng;
  const tz = optionalString(body, ["tz", "timezone"], "tz", issues);
  if (tz !== undefined) update.tz = tz;
  const capacity = optionalNumber(body, ["capacity"], "capacity", issues);
  if (capacity !== undefined) {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      issues.push({ index: -1, field: "capacity", message: "Expected a positive integer." });
    } else {
      update.capacity = capacity;
    }
  }

  throwIfInvalid(issues);
  throwIfEmpty(update);

  const { data, error } = await supabase
    .from("venues")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteVenue(supabase: DbClient, id: string) {
  const { error } = await supabase.from("venues").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listMatches(supabase: DbClient) {
  const { data, error } = await supabase.from("matches").select("*").order("match_n");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateMatch(supabase: DbClient, matchN: number, payload: unknown) {
  const body = readObject(payload);
  const issues: ImportIssue[] = [];
  const update: MatchUpdate = {};

  const round = optionalString(body, ["round", "r"], "round", issues);
  if (round !== undefined) update.round = validateRoundId(round, -1, issues) ?? undefined;
  const group = optionalValue(body, ["group_id", "groupId", "group", "g"]);
  if (group.present) {
    if (group.value === null || group.value === "") {
      update.group_id = null;
    } else if (typeof group.value === "string") {
      update.group_id = validateGroupId(group.value, -1, issues) ?? undefined;
    } else {
      issues.push({ index: -1, field: "group_id", message: "Expected a group id or null." });
    }
  }
  const homeSlot = optionalString(body, ["home_slot", "homeSlot", "home", "h"], "home_slot", issues);
  if (homeSlot !== undefined) update.home_slot = homeSlot;
  const awaySlot = optionalString(body, ["away_slot", "awaySlot", "away", "a"], "away_slot", issues);
  if (awaySlot !== undefined) update.away_slot = awaySlot;
  const kickoff = optionalString(body, ["kickoff_at", "kickoffAt", "time", "t"], "kickoff_at", issues);
  if (kickoff !== undefined) update.kickoff_at = validateKickoff(kickoff, -1, issues) ?? undefined;
  const venueId = optionalString(body, ["venue_id", "venueId", "venue", "v"], "venue_id", issues);
  if (venueId !== undefined) update.venue_id = venueId;
  const status = optionalString(body, ["status"], "status", issues);
  if (status !== undefined) update.status = validateMatchStatus(status, -1, issues);

  throwIfInvalid(issues);
  throwIfEmpty(update);

  const { data, error } = await supabase
    .from("matches")
    .update(update)
    .eq("match_n", matchN)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteMatch(supabase: DbClient, matchN: number) {
  const { error } = await supabase.from("matches").delete().eq("match_n", matchN);
  if (error) throw new Error(error.message);
}

export async function listResults(supabase: DbClient) {
  const { data, error } = await supabase.from("match_results").select("*").order("match_n");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function deleteResult(supabase: DbClient, matchN: number) {
  const { error } = await supabase.from("match_results").delete().eq("match_n", matchN);
  if (error) throw new Error(error.message);
  const { error: statusError } = await supabase
    .from("matches")
    .update({ status: "scheduled" })
    .eq("match_n", matchN);
  if (statusError) throw new Error(statusError.message);
}
