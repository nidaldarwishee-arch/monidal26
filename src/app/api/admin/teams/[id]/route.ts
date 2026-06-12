import { NextRequest, NextResponse } from "next/server";
import { logAdminAction } from "@/lib/api/admin-log";
import { jsonError, requireAdminContext } from "@/lib/api/admin";
import { AdminValidationError, deleteTeam, updateTeam } from "@/lib/admin/tournament";
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
    const team = await updateTeam(supabase, id.toUpperCase(), payload);
    await logAdminAction(supabase, admin.user.id, "manage_team_update", { id: team.id });
    return NextResponse.json({ team });
  } catch (error) {
    if (error instanceof AdminValidationError) {
      return NextResponse.json({ issues: error.issues }, { status: 400 });
    }
    return jsonError(error instanceof Error ? error.message : "Failed to update team.", 500);
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
    await deleteTeam(supabase, id.toUpperCase());
    await logAdminAction(supabase, admin.user.id, "manage_team_delete", { id: id.toUpperCase() });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to delete team.", 500);
  }
}
