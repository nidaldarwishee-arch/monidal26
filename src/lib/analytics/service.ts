import type { SupabaseClient } from "@supabase/supabase-js";
import { isRecord } from "@/lib/fifa/importers/validation";
import type { Database, Json } from "@/lib/supabase/database.types";

type DbClient = SupabaseClient<Database>;

export interface AnalyticsTrackInput {
  sessionId: string;
  visitorId: string;
  eventName: string;
  path: string;
  referrer: string | null;
  language: string | null;
  deviceType: string;
  browser: string;
  durationSeconds: number;
  pageViews: number;
  metadata: Json | null;
}

const EVENT_NAMES = new Set([
  "page_view",
  "session_heartbeat",
  "visibility_hidden",
  "calendar_export",
  "prediction_save",
  "match_save",
]);

function cleanText(value: unknown, fallback = "", max = 500) {
  if (typeof value !== "string") return fallback;
  return value.trim().slice(0, max) || fallback;
}

function cleanNullableText(value: unknown, max = 500) {
  const text = cleanText(value, "", max);
  return text || null;
}

function cleanInt(value: unknown, fallback: number, min: number, max: number) {
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.round(number)));
}

function jsonValue(value: unknown, depth = 0): Json {
  if (depth > 4) return null;
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) return value.slice(0, 25).map((item) => jsonValue(item, depth + 1));
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .slice(0, 25)
        .map(([key, item]) => [key.slice(0, 80), jsonValue(item, depth + 1)])
    ) as Json;
  }
  return null;
}

export function parseAnalyticsPayload(payload: unknown): AnalyticsTrackInput {
  if (!isRecord(payload)) {
    throw new Error("Expected an analytics object payload.");
  }

  const eventName = cleanText(payload.eventName, "page_view", 80);
  const normalizedEventName = EVENT_NAMES.has(eventName) ? eventName : "page_view";
  const sessionId = cleanText(payload.sessionId, "", 80);
  const visitorId = cleanText(payload.visitorId, "", 80);
  const path = cleanText(payload.path, "/", 500);

  if (!sessionId || !visitorId) {
    throw new Error("Analytics sessionId and visitorId are required.");
  }

  return {
    sessionId,
    visitorId,
    eventName: normalizedEventName,
    path,
    referrer: cleanNullableText(payload.referrer, 500),
    language: cleanNullableText(payload.language, 80),
    deviceType: cleanText(payload.deviceType, "unknown", 80),
    browser: cleanText(payload.browser, "unknown", 80),
    durationSeconds: cleanInt(payload.durationSeconds, 0, 0, 24 * 60 * 60),
    pageViews: cleanInt(payload.pageViews, 1, 1, 1000),
    metadata: isRecord(payload.metadata) ? jsonValue(payload.metadata) : null,
  };
}

export async function recordAnalyticsEvent(
  supabase: DbClient,
  input: AnalyticsTrackInput,
  userId: string | null,
  country: string | null
) {
  const now = new Date().toISOString();
  const bounced = input.pageViews <= 1 && input.durationSeconds < 15;

  const { error: sessionError } = await supabase.from("analytics_sessions").upsert(
    {
      id: input.sessionId,
      visitor_id: input.visitorId,
      user_id: userId,
      last_seen_at: now,
      duration_seconds: input.durationSeconds,
      page_views: input.pageViews,
      device_type: input.deviceType,
      browser: input.browser,
      country,
      language: input.language,
      referrer: input.referrer,
      entry_path: input.path,
      exit_path: input.path,
      bounced,
    },
    { onConflict: "id" }
  );
  if (sessionError) throw new Error(sessionError.message);

  const { error: eventError } = await supabase.from("analytics_events").insert({
    session_id: input.sessionId,
    visitor_id: input.visitorId,
    user_id: userId,
    event_name: input.eventName,
    path: input.path,
    metadata: input.metadata,
    device_type: input.deviceType,
    browser: input.browser,
    country,
    language: input.language,
  });
  if (eventError) throw new Error(eventError.message);

  if (userId) {
    const { error: presenceError } = await supabase.from("user_presence").upsert(
      {
        user_id: userId,
        current_path: input.path,
        last_seen_at: now,
        metadata: {
          deviceType: input.deviceType,
          browser: input.browser,
          language: input.language,
        },
      },
      { onConflict: "user_id" }
    );
    if (presenceError) throw new Error(presenceError.message);
  }
}
