import type { Json } from "@/lib/supabase/database.types";
import type { LiveMatchStatus, LiveScoreProviderId, LiveScoreSnapshot } from "@/lib/live-scores/types";

export function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }
  return null;
}

export function asString(value: unknown): string | null {
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

export function asJson(value: unknown): Json {
  return value as Json;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function snapshotBase(
  provider: LiveScoreProviderId,
  externalMatchId: string,
  status: LiveMatchStatus,
  raw: unknown
): Pick<LiveScoreSnapshot, "provider" | "externalMatchId" | "status" | "raw" | "fetchedAt"> {
  return {
    provider,
    externalMatchId,
    status,
    raw: asJson(raw),
    fetchedAt: nowIso(),
  };
}

export async function fetchProviderJson(
  url: URL,
  headers: HeadersInit
): Promise<unknown> {
  const response = await fetch(url, {
    headers,
    next: { revalidate: 0 },
  });
  const body = (await response.json().catch(() => ({}))) as unknown;
  if (!response.ok) {
    throw new Error(`Live score provider request failed (${response.status}).`);
  }
  return body;
}
