import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/admin";
import { requirePredictionUser } from "@/lib/api/predictions";
import { getUserPredictionScore } from "@/lib/predictions/service";

/** GET /api/predictions/score - signed-in user's scored predictions. */
export async function GET() {
  const context = await requirePredictionUser();
  if (!context.ok) return context.response;

  try {
    const score = await getUserPredictionScore(context.supabase, context.user.id);
    return NextResponse.json(score);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to score predictions.", 500);
  }
}
