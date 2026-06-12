import { NextResponse } from "next/server";
import { logAdminAction } from "@/lib/api/admin-log";
import { jsonError, requireAdminContext } from "@/lib/api/admin";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
  recalculatePredictionScores,
  syncFinishedResults,
  updateBracketAfterResult,
  updateStandingsAfterResult,
} from "@/lib/live-scores/service";

export async function POST() {
  const admin = await requireAdminContext();
  if (!admin.ok) return admin.response;

  try {
    const result = await syncFinishedResults(admin.user.id);
    const standings = await updateStandingsAfterResult(admin.user.id);
    const bracket = await updateBracketAfterResult(admin.user.id);
    const predictions = await recalculatePredictionScores(admin.user.id);
    await logAdminAction(createServiceRoleClient(), admin.user.id, "sync_finished_results", {
      ...result,
      groups: Object.keys(standings.standings).length,
      knockoutMatches: bracket.knockout.length,
      predictionUsers: predictions.users,
    });
    return NextResponse.json({ result, standings, bracket, predictions });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to sync final results.", 500);
  }
}
