import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/admin";
import { requireAuthenticatedUser } from "@/lib/api/user";
import { updateNotificationPreferences } from "@/lib/dashboard/service";

export async function PATCH(req: NextRequest) {
  const context = await requireAuthenticatedUser();
  if (!context.ok) return context.response;

  const payload = await req.json().catch(() => null);
  try {
    const notifications = await updateNotificationPreferences(context.supabase, context.user.id, payload);
    return NextResponse.json({ notifications });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to update notifications.",
      500
    );
  }
}
