import { NextResponse } from "next/server";
import { logAdminAction } from "@/lib/api/admin-log";
import { jsonError, requireAdminContext } from "@/lib/api/admin";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { syncFixtures } from "@/lib/live-scores/service";
import type { Json } from "@/lib/supabase/database.types";

export async function POST() {
  const admin = await requireAdminContext();
  if (!admin.ok) return admin.response;

  try {
    const result = await syncFixtures(admin.user.id);
    await logAdminAction(createServiceRoleClient(), admin.user.id, "sync_fixtures", result as unknown as Json);
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to sync fixtures.", 500);
  }
}
