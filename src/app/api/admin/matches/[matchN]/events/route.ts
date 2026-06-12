import { NextRequest, NextResponse } from "next/server";
import { logAdminAction } from "@/lib/api/admin-log";
import { jsonError, requireAdminContext } from "@/lib/api/admin";
import { parseMatchNumberParam } from "@/lib/api/params";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { isRecord } from "@/lib/fifa/importers/validation";
import type { Database, Json } from "@/lib/supabase/database.types";

type MatchEventType = Database["public"]["Tables"]["match_events"]["Row"]["event_type"];

const EVENT_TYPES = new Set([
  "goal",
  "own_goal",
  "penalty_goal",
  "penalty_miss",
  "yellow_card",
  "red_card",
  "substitution",
  "var",
  "other",
]);

function eventPayload(body: unknown, matchN: number, userId: string) {
  if (!isRecord(body)) return null;
  const eventType = typeof body.eventType === "string" ? body.eventType : body.event_type;
  if (typeof eventType !== "string" || !EVENT_TYPES.has(eventType)) return null;

  const minute = Number(body.minute);
  const extraMinute = Number(body.extraMinute ?? body.extra_minute);

  return {
    match_n: matchN,
    event_type: eventType as MatchEventType,
    team_id: typeof body.teamId === "string" ? body.teamId : typeof body.team_id === "string" ? body.team_id : null,
    player_name:
      typeof body.playerName === "string"
        ? body.playerName
        : typeof body.player_name === "string"
          ? body.player_name
          : null,
    minute: Number.isInteger(minute) && minute >= 0 && minute <= 130 ? minute : null,
    extra_minute:
      Number.isInteger(extraMinute) && extraMinute >= 0 && extraMinute <= 30 ? extraMinute : null,
    detail: isRecord(body.detail) ? (body.detail as Json) : null,
    source: "manual",
    created_by: userId,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ matchN: string }> }
) {
  const admin = await requireAdminContext();
  if (!admin.ok) return admin.response;

  const { matchN: rawMatchN } = await params;
  const matchN = parseMatchNumberParam(rawMatchN);
  if (!matchN) return jsonError("Invalid match number.", 400);

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("match_events")
    .select("*")
    .eq("match_n", matchN)
    .order("minute", { ascending: true, nullsFirst: false });

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ events: data ?? [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ matchN: string }> }
) {
  const admin = await requireAdminContext();
  if (!admin.ok) return admin.response;

  const { matchN: rawMatchN } = await params;
  const matchN = parseMatchNumberParam(rawMatchN);
  if (!matchN) return jsonError("Invalid match number.", 400);

  const payload = eventPayload(await req.json().catch(() => null), matchN, admin.user.id);
  if (!payload) return jsonError("Invalid match event payload.", 400);

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from("match_events").insert(payload).select("*").single();
  if (error) return jsonError(error.message, 500);

  await logAdminAction(supabase, admin.user.id, "match_event_create", {
    matchN,
    eventId: data.id,
    eventType: data.event_type,
  });

  return NextResponse.json({ event: data }, { status: 201 });
}
