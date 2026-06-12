import { GROUPS, ROUND_ORDER, type GroupId, type RoundId } from "@/lib/types";

export interface ImportIssue {
  index: number;
  field?: string;
  message: string;
}

export interface ImportOutcome {
  imported: number;
  issues: ImportIssue[];
}

const GROUP_SET = new Set<string>(GROUPS);
const ROUND_SET = new Set<string>(ROUND_ORDER);
const COUNTRY_SET = new Set(["USA", "Canada", "Mexico"]);
const MATCH_STATUS_SET = new Set(["scheduled", "live", "played", "postponed", "cancelled"]);
const RESULT_STATUS_SET = new Set(["live", "played"]);

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function rowsFromPayload(payload: unknown, key: string | string[]): unknown[] {
  const keys = Array.isArray(key) ? key : [key];
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];
  const rows = keys.map((item) => payload[item]).find((item) => item !== undefined) ?? payload.data;
  return Array.isArray(rows) ? rows : [];
}

export function stringField(
  row: Record<string, unknown>,
  keys: string[],
  index: number,
  issues: ImportIssue[],
  options: { field: string; required?: boolean } = { field: keys[0], required: true }
): string | null {
  const value = keys.map((key) => row[key]).find((item) => item !== undefined);
  if (value === undefined || value === null || value === "") {
    if (options.required !== false) {
      issues.push({ index, field: options.field, message: "Required string is missing." });
    }
    return null;
  }
  if (typeof value !== "string") {
    issues.push({ index, field: options.field, message: "Expected a string." });
    return null;
  }
  return value.trim();
}

export function numberField(
  row: Record<string, unknown>,
  keys: string[],
  index: number,
  issues: ImportIssue[],
  field: string
): number | null {
  const value = keys.map((key) => row[key]).find((item) => item !== undefined);
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(number)) {
    issues.push({ index, field, message: "Expected a number." });
    return null;
  }
  return number;
}

export function booleanField(row: Record<string, unknown>, keys: string[]): boolean {
  const value = keys.map((key) => row[key]).find((item) => item !== undefined);
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return false;
}

export function validateGroupId(
  value: string | null,
  index: number,
  issues: ImportIssue[],
  field = "group_id"
): GroupId | null {
  if (!value) return null;
  if (!GROUP_SET.has(value)) {
    issues.push({ index, field, message: "Expected a group id from A to L." });
    return null;
  }
  return value as GroupId;
}

export function validateRoundId(
  value: string | null,
  index: number,
  issues: ImportIssue[],
  field = "round"
): RoundId | null {
  if (!value) return null;
  if (!ROUND_SET.has(value)) {
    issues.push({ index, field, message: "Expected a supported match stage id." });
    return null;
  }
  return value as RoundId;
}

export function validateCountry(value: string | null, index: number, issues: ImportIssue[]) {
  if (!value) return null;
  if (!COUNTRY_SET.has(value)) {
    issues.push({ index, field: "country", message: "Expected USA, Canada, or Mexico." });
    return null;
  }
  return value as "USA" | "Canada" | "Mexico";
}

export function validateMatchStatus(
  value: string | null,
  index: number,
  issues: ImportIssue[],
  fallback = "scheduled"
) {
  const status = value ?? fallback;
  if (!MATCH_STATUS_SET.has(status)) {
    issues.push({ index, field: "status", message: "Expected a supported match status." });
    return fallback as "scheduled";
  }
  return status as "scheduled" | "live" | "played" | "postponed" | "cancelled";
}

export function validateResultStatus(value: string | null, index: number, issues: ImportIssue[]) {
  const status = value ?? "played";
  if (!RESULT_STATUS_SET.has(status)) {
    issues.push({ index, field: "status", message: "Expected live or played." });
    return "played" as const;
  }
  return status as "live" | "played";
}

export function validateGoal(value: number | null, index: number, issues: ImportIssue[], field: string) {
  if (value === null || !Number.isInteger(value) || value < 0 || value > 20) {
    issues.push({ index, field, message: "Expected an integer between 0 and 20." });
    return null;
  }
  return value;
}

export function validateKickoff(value: string | null, index: number, issues: ImportIssue[]) {
  if (!value) return null;
  const time = Date.parse(value);
  if (Number.isNaN(time)) {
    issues.push({ index, field: "kickoff_at", message: "Expected a valid ISO timestamp." });
    return null;
  }
  return new Date(time).toISOString();
}
