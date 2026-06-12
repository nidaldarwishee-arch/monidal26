import { NextResponse } from "next/server";
import { jsonError, requireAdminContext } from "@/lib/api/admin";
import { listAdminUsers } from "@/lib/admin/super-dashboard";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function GET() {
  const admin = await requireAdminContext();
  if (!admin.ok) return admin.response;

  try {
    const users = await listAdminUsers(createServiceRoleClient());
    return NextResponse.json({ users });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to load users.", 500);
  }
}
