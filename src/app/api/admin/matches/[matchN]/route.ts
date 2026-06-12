import { NextRequest, NextResponse } from "next/server";
import { logAdminAction } from "@/lib/api/admin-log";
import { jsonError, requireAdminContext } from "@/lib/api/admin";
import { parseMatchNumberParam } from "@/lib/api/params";
import { AdminValidationError, deleteMatch, updateMatch } from "@/lib/admin/tournament";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ matchN: string }> }
) {
  const admin = await requireAdminContext();
  if (!admin.ok) return admin.response;

  const { matchN: rawMatchN } = await params;
  const matchN = parseMatchNumberParam(rawMatchN);
  if (!matchN) return jsonError("Invalid match number.", 400);

  const payload = await req.json().catch(() => null);
  const supabase = createServiceRoleClient();

  try {
    const match = await updateMatch(supabase, matchN, payload);
    await logAdminAction(supabase, admin.user.id, "manage_match_update", { matchN });
    return NextResponse.json({ match });
  } catch (error) {
    if (error instanceof AdminValidationError) {
      return NextResponse.json({ issues: error.issues }, { status: 400 });
    }
    return jsonError(error instanceof Error ? error.message : "Failed to update match.", 500);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ matchN: string }> }
) {
  const admin = await requireAdminContext();
  if (!admin.ok) return admin.response;

  const { matchN: rawMatchN } = await params;
  const matchN = parseMatchNumberParam(rawMatchN);
  if (!matchN) return jsonError("Invalid match number.", 400);

  const supabase = createServiceRoleClient();

  try {
    await deleteMatch(supabase, matchN);
    await logAdminAction(supabase, admin.user.id, "manage_match_delete", { matchN });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to delete match.", 500);
  }
}
