import { NextRequest, NextResponse } from "next/server";
import { logAdminAction } from "@/lib/api/admin-log";
import { jsonError, requireAdminContext } from "@/lib/api/admin";
import {
  deleteContentArticle,
  SuperAdminValidationError,
  toJsonDetail,
  upsertContentArticle,
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
    const article = await upsertContentArticle(supabase, admin.user.id, {
      ...(typeof payload === "object" && payload !== null ? payload : {}),
      id,
    });
    await logAdminAction(supabase, admin.user.id, "super_admin_content_update", {
      articleId: id,
      payload: toJsonDetail(payload),
    });
    return NextResponse.json({ article });
  } catch (error) {
    if (error instanceof SuperAdminValidationError) {
      return NextResponse.json({ issues: error.issues }, { status: 400 });
    }
    return jsonError(error instanceof Error ? error.message : "Failed to update content.", 500);
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
    await deleteContentArticle(supabase, id);
    await logAdminAction(supabase, admin.user.id, "super_admin_content_delete", { articleId: id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to delete content.", 500);
  }
}
