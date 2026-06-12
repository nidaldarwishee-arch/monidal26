import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/admin";
import { requirePredictionUser } from "@/lib/api/predictions";
import {
  getUserPredictionScore,
  listUserPredictions,
  saveUserPrediction,
} from "@/lib/predictions/service";
import { incrementDashboardStat } from "@/lib/dashboard/service";

/** GET /api/predictions - the signed-in user's predictions and score. */
export async function GET() {
  const context = await requirePredictionUser();
  if (!context.ok) return context.response;

  try {
    const [predictions, score] = await Promise.all([
      listUserPredictions(context.supabase, context.user.id),
      getUserPredictionScore(context.supabase, context.user.id),
    ]);

    return NextResponse.json({ predictions, score: score.summary });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to load predictions.", 500);
  }
}

/**
 * POST /api/predictions
 * Body: { matchN, homeGoals, awayGoals, winner? }
 */
export async function POST(req: NextRequest) {
  const context = await requirePredictionUser();
  if (!context.ok) return context.response;

  const body = await req.json().catch(() => null);

  try {
    const result = await saveUserPrediction(context.supabase, context.user.id, body);
    if (result.issues.length) return NextResponse.json(result, { status: 400 });
    await incrementDashboardStat(context.supabase, context.user.id, "prediction_submissions", 1);
    return NextResponse.json({ prediction: result.prediction });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to save prediction.", 500);
  }
}
