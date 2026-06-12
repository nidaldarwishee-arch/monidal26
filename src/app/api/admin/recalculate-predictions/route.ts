import { NextResponse } from "next/server";
import { logAdminAction } from "@/lib/api/admin-log";
import { jsonError, requireAdminContext } from "@/lib/api/admin";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { recalculatePredictionScores } from "@/lib/live-scores/service";

export async function POST() {
  const admin = await requireAdminContext();
  if (!admin.ok) return admin.response;

  try {
    const result = await recalculatePredictionScores(admin.user.id);
    await logAdminAction(createServiceRoleClient(), admin.user.id, "recalculate_predictions", {
      users: result.users,
    });
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to recalculate predictions.", 500);
  }
}
