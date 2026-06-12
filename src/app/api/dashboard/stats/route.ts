import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/admin";
import { requireAuthenticatedUser } from "@/lib/api/user";
import { incrementDashboardStat, type DashboardStatField } from "@/lib/dashboard/service";

const TRACKABLE_FIELDS = new Set([
  "matches_viewed",
  "pages_viewed",
  "time_spent_seconds",
  "favorite_team_activity",
  "prediction_submissions",
  "calendar_exports",
  "language_changes",
]);

export async function POST(req: NextRequest) {
  const context = await requireAuthenticatedUser();
  if (!context.ok) return context.response;

  const body = await req.json().catch(() => null);
  if (typeof body !== "object" || body === null) return jsonError("Invalid stats payload.", 400);

  const field = (body as Record<string, unknown>).field;
  const amount = Number((body as Record<string, unknown>).amount ?? 1);
  if (typeof field !== "string" || !TRACKABLE_FIELDS.has(field)) {
    return jsonError("Invalid stats field.", 400);
  }
  if (!Number.isFinite(amount) || amount <= 0 || amount > 86400) {
    return jsonError("Invalid stats amount.", 400);
  }

  try {
    await incrementDashboardStat(context.supabase, context.user.id, field as DashboardStatField, Math.round(amount));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to track dashboard stat.", 500);
  }
}
