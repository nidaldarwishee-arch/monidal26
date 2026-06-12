import { NextRequest, NextResponse } from "next/server";
import { logAdminAction } from "@/lib/api/admin-log";
import { jsonError, requireAdminContext } from "@/lib/api/admin";
import { listResults } from "@/lib/admin/tournament";
import { updateResults } from "@/lib/fifa/importers";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function GET() {
  const admin = await requireAdminContext();
  if (!admin.ok) return admin.response;

  try {
    const results = await listResults(createServiceRoleClient());
    return NextResponse.json({ results });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to load results.", 500);
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdminContext();
  if (!admin.ok) return admin.response;

  const payload = await req.json().catch(() => null);
  const supabase = createServiceRoleClient();

  try {
    const result = await updateResults(supabase, payload, admin.user.id);
    if (result.issues.length) return NextResponse.json(result, { status: 400 });

    await logAdminAction(supabase, admin.user.id, "manage_results_upsert", {
      imported: result.imported,
      statusUpdated: result.statusUpdated,
    });

    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to save results.", 500);
  }
}
