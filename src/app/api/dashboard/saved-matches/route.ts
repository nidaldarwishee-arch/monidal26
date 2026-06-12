import { NextRequest, NextResponse } from "next/server";
import { MATCH_MAP } from "@/data/matches";
import { jsonError } from "@/lib/api/admin";
import { requireAuthenticatedUser } from "@/lib/api/user";
import { removeSavedMatch, setSavedMatch } from "@/lib/dashboard/service";

function readMatchN(payload: unknown) {
  if (typeof payload !== "object" || payload === null) return null;
  const value = Number((payload as Record<string, unknown>).matchN);
  return Number.isInteger(value) && MATCH_MAP[value] ? value : null;
}

export async function POST(req: NextRequest) {
  const context = await requireAuthenticatedUser();
  if (!context.ok) return context.response;

  const body = await req.json().catch(() => null);
  const matchN = readMatchN(body);
  if (!matchN) return jsonError("Invalid match number.", 400);

  const notificationsEnabled =
    typeof body === "object" &&
    body !== null &&
    typeof (body as Record<string, unknown>).notificationsEnabled === "boolean"
      ? Boolean((body as Record<string, unknown>).notificationsEnabled)
      : true;

  try {
    const saved = await setSavedMatch(context.supabase, context.user.id, matchN, notificationsEnabled);
    return NextResponse.json({ saved });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to follow match.", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const context = await requireAuthenticatedUser();
  if (!context.ok) return context.response;

  const body = await req.json().catch(() => null);
  const matchN = readMatchN(body);
  if (!matchN) return jsonError("Invalid match number.", 400);

  try {
    await removeSavedMatch(context.supabase, context.user.id, matchN);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to unfollow match.", 500);
  }
}
