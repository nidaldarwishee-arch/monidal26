import { NextRequest, NextResponse } from "next/server";
import { logAdminAction } from "@/lib/api/admin-log";
import { jsonError, requireAdminContext } from "@/lib/api/admin";
import { parseMatchNumberParam } from "@/lib/api/params";
import { deleteResult } from "@/lib/admin/tournament";
import { updateResults } from "@/lib/fifa/importers";
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

  const body = await req.json().catch(() => null);
  const supabase = createServiceRoleClient();

  try {
    const result = await updateResults(
      supabase,
      { results: [{ ...(typeof body === "object" && body ? body : {}), matchN }] },
      admin.user.id
    );
    if (result.issues.length) return NextResponse.json(result, { status: 400 });

    await logAdminAction(supabase, admin.user.id, "manage_result_update", { matchN });
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to update result.", 500);
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
    await deleteResult(supabase, matchN);
    await logAdminAction(supabase, admin.user.id, "manage_result_delete", { matchN });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to delete result.", 500);
  }
}
