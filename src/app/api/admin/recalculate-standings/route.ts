import { NextResponse } from "next/server";
import { logAdminAction } from "@/lib/api/admin-log";
import { jsonError, requireAdminContext } from "@/lib/api/admin";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { updateBracketAfterResult, updateStandingsAfterResult } from "@/lib/live-scores/service";

export async function POST() {
  const admin = await requireAdminContext();
  if (!admin.ok) return admin.response;

  try {
    const standings = await updateStandingsAfterResult(admin.user.id);
    const bracket = await updateBracketAfterResult(admin.user.id);
    await logAdminAction(createServiceRoleClient(), admin.user.id, "recalculate_standings", {
      groups: Object.keys(standings.standings).length,
      knockoutMatches: bracket.knockout.length,
    });
    return NextResponse.json({ standings, bracket });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to recalculate standings.", 500);
  }
}
