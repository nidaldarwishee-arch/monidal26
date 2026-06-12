import { NextRequest, NextResponse } from "next/server";
import { logAdminAction } from "@/lib/api/admin-log";
import { jsonError, requireAdminContext } from "@/lib/api/admin";
import { parseMatchNumberParam } from "@/lib/api/params";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { isRecord } from "@/lib/fifa/importers/validation";
import type { Database, Json } from "@/lib/supabase/database.types";

type MatchEventUpdate = Database["public"]["Tables"]["match_events"]["Update"];
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

function eventUpdate(body: unknown): MatchEventUpdate | null {
  if (!isRecord(body)) return null;
  const update: MatchEventUpdate = {};

  const eventType = typeof body.eventType === "string" ? body.eventType : body.event_type;
  if (typeof eventType === "string") {
    if (!EVENT_TYPES.has(eventType)) return null;
    update.event_type = eventType as MatchEventType;
  }

  const teamId = typeof body.teamId === "string" ? body.teamId : body.team_id;
  if (teamId !== undefined) update.team_id = typeof teamId === "string" && teamId ? teamId : null;

  const playerName = typeof body.playerName === "string" ? body.playerName : body.player_name;
  if (playerName !== undefined) {
    update.player_name = typeof playerName === "string" && playerName ? playerName : null;
  }

  const minute = body.minute === undefined ? undefined : Number(body.minute);
  if (minute !== undefined) {
    if (!Number.isInteger(minute) || minute < 0 || minute > 130) return null;
    update.minute = minute;
  }

  const extraMinute =
    body.extraMinute === undefined && body.extra_minute === undefined
      ? undefined
      : Number(body.extraMinute ?? body.extra_minute);
  if (extraMinute !== undefined) {
    if (!Number.isInteger(extraMinute) || extraMinute < 0 || extraMinute > 30) return null;
    update.extra_minute = extraMinute;
  }

  if (body.detail !== undefined) {
    update.detail = isRecord(body.detail) ? (body.detail as Json) : null;
  }

  return Object.keys(update).length ? update : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ matchN: string; eventId: string }> }
) {
  const admin = await requireAdminContext();
  if (!admin.ok) return admin.response;

  const { matchN: rawMatchN, eventId } = await params;
  const matchN = parseMatchNumberParam(rawMatchN);
  if (!matchN) return jsonError("Invalid match number.", 400);

  const update = eventUpdate(await req.json().catch(() => null));
  if (!update) return jsonError("Invalid match event payload.", 400);

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("match_events")
    .update(update)
    .eq("id", eventId)
    .eq("match_n", matchN)
    .select("*")
    .single();
  if (error) return jsonError(error.message, 500);

  await logAdminAction(supabase, admin.user.id, "match_event_update", {
    matchN,
    eventId,
  });

  return NextResponse.json({ event: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ matchN: string; eventId: string }> }
) {
  const admin = await requireAdminContext();
  if (!admin.ok) return admin.response;

  const { matchN: rawMatchN, eventId } = await params;
  const matchN = parseMatchNumberParam(rawMatchN);
  if (!matchN) return jsonError("Invalid match number.", 400);

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("match_events")
    .delete()
    .eq("id", eventId)
    .eq("match_n", matchN);
  if (error) return jsonError(error.message, 500);

  await logAdminAction(supabase, admin.user.id, "match_event_delete", {
    matchN,
    eventId,
  });

  return NextResponse.json({ ok: true });
}
