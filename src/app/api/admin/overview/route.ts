import { NextResponse } from "next/server";
import { jsonError, requireAdminContext } from "@/lib/api/admin";
import { getSuperAdminDashboard } from "@/lib/admin/super-dashboard";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function GET() {
  const admin = await requireAdminContext();
  if (!admin.ok) return admin.response;

  try {
    const dashboard = await getSuperAdminDashboard(createServiceRoleClient());
    return NextResponse.json({ dashboard });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to load admin overview.", 500);
  }
}
