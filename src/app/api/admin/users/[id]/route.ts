import { NextRequest, NextResponse } from "next/server";
import { logAdminAction } from "@/lib/api/admin-log";
import { jsonError, requireAdminContext } from "@/lib/api/admin";
import {
  deleteAdminUser,
  SuperAdminValidationError,
  updateAdminUser,
  toJsonDetail,
} from "@/lib/admin/super-dashboard";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminContext();
  if (!admin.ok) return admin.response;

  const { id } = await params;
  const payload = await req.json().catch(() => null);
  const supabase = createServiceRoleClient();

  try {
    const profile = await updateAdminUser(supabase, admin.user.id, id, payload);
    await logAdminAction(supabase, admin.user.id, "super_admin_user_update", {
      targetUserId: id,
      payload: toJsonDetail(payload),
    });
    return NextResponse.json({ profile });
  } catch (error) {
    if (error instanceof SuperAdminValidationError) {
      return NextResponse.json({ issues: error.issues }, { status: 400 });
    }
    return jsonError(error instanceof Error ? error.message : "Failed to update user.", 500);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminContext();
  if (!admin.ok) return admin.response;

  const { id } = await params;
  const supabase = createServiceRoleClient();

  try {
    await deleteAdminUser(supabase, admin.user.id, id);
    await logAdminAction(supabase, admin.user.id, "super_admin_user_delete", { targetUserId: id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof SuperAdminValidationError) {
      return NextResponse.json({ issues: error.issues }, { status: 400 });
    }
    return jsonError(error instanceof Error ? error.message : "Failed to delete user.", 500);
  }
}
