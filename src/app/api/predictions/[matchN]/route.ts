import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/admin";
import { parseMatchNumberParam } from "@/lib/api/params";
import { requirePredictionUser } from "@/lib/api/predictions";
import { deleteUserPrediction, saveUserPrediction } from "@/lib/predictions/service";
import { incrementDashboardStat } from "@/lib/dashboard/service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ matchN: string }> }
) {
  const context = await requirePredictionUser();
  if (!context.ok) return context.response;

  const { matchN: rawMatchN } = await params;
  const matchN = parseMatchNumberParam(rawMatchN);
  if (!matchN) return jsonError("Invalid match number.", 400);

  const body = await req.json().catch(() => null);

  try {
    const result = await saveUserPrediction(context.supabase, context.user.id, body, matchN);
    if (result.issues.length) return NextResponse.json(result, { status: 400 });
    await incrementDashboardStat(context.supabase, context.user.id, "prediction_submissions", 1);
    return NextResponse.json({ prediction: result.prediction });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to update prediction.", 500);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ matchN: string }> }
) {
  const context = await requirePredictionUser();
  if (!context.ok) return context.response;

  const { matchN: rawMatchN } = await params;
  const matchN = parseMatchNumberParam(rawMatchN);
  if (!matchN) return jsonError("Invalid match number.", 400);

  try {
    await deleteUserPrediction(context.supabase, context.user.id, matchN);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to delete prediction.", 500);
  }
}
