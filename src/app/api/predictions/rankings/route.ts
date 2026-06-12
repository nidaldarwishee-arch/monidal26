import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/admin";
import { requirePredictionUser } from "@/lib/api/predictions";
import { getPredictionLeaderboard } from "@/lib/predictions/service";
import { createServiceRoleClient } from "@/lib/supabase/admin";

/** GET /api/predictions/rankings - authenticated leaderboard. */
export async function GET() {
  const context = await requirePredictionUser();
  if (!context.ok) return context.response;

  try {
    const rankings = await getPredictionLeaderboard(createServiceRoleClient());
    return NextResponse.json({ rankings });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to load rankings.", 500);
  }
}
