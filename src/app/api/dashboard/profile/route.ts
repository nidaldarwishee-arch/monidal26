import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/admin";
import { requireAuthenticatedUser } from "@/lib/api/user";
import { updateDashboardProfile } from "@/lib/dashboard/service";

export async function PATCH(req: NextRequest) {
  const context = await requireAuthenticatedUser();
  if (!context.ok) return context.response;

  const payload = await req.json().catch(() => null);
  try {
    const profile = await updateDashboardProfile(context.supabase, context.user.id, payload);
    return NextResponse.json({ profile });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to update profile.", 500);
  }
}
