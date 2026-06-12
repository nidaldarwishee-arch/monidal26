import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/admin";
import { requireAuthenticatedUser } from "@/lib/api/user";
import { getUserDashboard } from "@/lib/dashboard/service";

/** GET /api/dashboard - complete authenticated user dashboard payload. */
export async function GET() {
  const context = await requireAuthenticatedUser();
  if (!context.ok) return context.response;

  try {
    const dashboard = await getUserDashboard(context.supabase, context.user);
    return NextResponse.json({ dashboard });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to load dashboard.", 500);
  }
}
