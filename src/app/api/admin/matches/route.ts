import { NextRequest, NextResponse } from "next/server";
import { logAdminAction } from "@/lib/api/admin-log";
import { jsonError, requireAdminContext } from "@/lib/api/admin";
import { listMatches } from "@/lib/admin/tournament";
import { importFixtures } from "@/lib/fifa/importers";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function GET() {
  const admin = await requireAdminContext();
  if (!admin.ok) return admin.response;

  try {
    const matches = await listMatches(createServiceRoleClient());
    return NextResponse.json({ matches });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to load matches.", 500);
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdminContext();
  if (!admin.ok) return admin.response;

  const payload = await req.json().catch(() => null);
  const supabase = createServiceRoleClient();

  try {
    const result = await importFixtures(supabase, payload);
    if (result.issues.length) return NextResponse.json(result, { status: 400 });

    await logAdminAction(supabase, admin.user.id, "manage_matches_upsert", {
      imported: result.imported,
    });

    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to save matches.", 500);
  }
}
