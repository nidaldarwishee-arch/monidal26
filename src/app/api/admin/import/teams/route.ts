import { NextRequest, NextResponse } from "next/server";
import { logAdminAction } from "@/lib/api/admin-log";
import { jsonError, requireAdminContext } from "@/lib/api/admin";
import { importTeams } from "@/lib/fifa/importers";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const admin = await requireAdminContext();
  if (!admin.ok) return admin.response;

  const payload = await req.json().catch(() => null);
  const supabase = createServiceRoleClient();

  try {
    const result = await importTeams(supabase, payload);
    if (result.issues.length) {
      return NextResponse.json(result, { status: 400 });
    }

    await logAdminAction(supabase, admin.user.id, "import_teams", {
      imported: result.imported,
    });

    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Team import failed.", 500);
  }
}
