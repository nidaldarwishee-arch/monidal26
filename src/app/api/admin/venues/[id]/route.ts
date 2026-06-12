import { NextRequest, NextResponse } from "next/server";
import { logAdminAction } from "@/lib/api/admin-log";
import { jsonError, requireAdminContext } from "@/lib/api/admin";
import { AdminValidationError, deleteVenue, updateVenue } from "@/lib/admin/tournament";
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
    const venue = await updateVenue(supabase, id, payload);
    await logAdminAction(supabase, admin.user.id, "manage_venue_update", { id: venue.id });
    return NextResponse.json({ venue });
  } catch (error) {
    if (error instanceof AdminValidationError) {
      return NextResponse.json({ issues: error.issues }, { status: 400 });
    }
    return jsonError(error instanceof Error ? error.message : "Failed to update venue.", 500);
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
    await deleteVenue(supabase, id);
    await logAdminAction(supabase, admin.user.id, "manage_venue_delete", { id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to delete venue.", 500);
  }
}
