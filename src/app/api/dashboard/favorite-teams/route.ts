import { NextRequest, NextResponse } from "next/server";
import { TEAM_MAP } from "@/data/teams";
import { jsonError } from "@/lib/api/admin";
import { requireAuthenticatedUser } from "@/lib/api/user";
import { removeFavoriteTeam, setFavoriteTeam } from "@/lib/dashboard/service";

function readTeamId(payload: unknown) {
  if (typeof payload !== "object" || payload === null) return null;
  const value = (payload as Record<string, unknown>).teamId;
  return typeof value === "string" && TEAM_MAP[value] ? value : null;
}

export async function POST(req: NextRequest) {
  const context = await requireAuthenticatedUser();
  if (!context.ok) return context.response;

  const body = await req.json().catch(() => null);
  const teamId = readTeamId(body);
  if (!teamId) return jsonError("Invalid team id.", 400);

  const notificationsEnabled =
    typeof body === "object" &&
    body !== null &&
    typeof (body as Record<string, unknown>).notificationsEnabled === "boolean"
      ? Boolean((body as Record<string, unknown>).notificationsEnabled)
      : true;

  try {
    const favorite = await setFavoriteTeam(context.supabase, context.user.id, teamId, notificationsEnabled);
    return NextResponse.json({ favorite });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to follow team.", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const context = await requireAuthenticatedUser();
  if (!context.ok) return context.response;

  const body = await req.json().catch(() => null);
  const teamId = readTeamId(body);
  if (!teamId) return jsonError("Invalid team id.", 400);

  try {
    await removeFavoriteTeam(context.supabase, context.user.id, teamId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to unfollow team.", 500);
  }
}
