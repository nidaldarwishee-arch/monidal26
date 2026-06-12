import { NextRequest, NextResponse } from "next/server";
import { logAdminAction } from "@/lib/api/admin-log";
import { jsonError, requireAdminContext } from "@/lib/api/admin";
import { listVenues, upsertVenues } from "@/lib/admin/tournament";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function GET() {
  const admin = await requireAdminContext();
  if (!admin.ok) return admin.response;

  try {
    const venues = await listVenues(createServiceRoleClient());
    return NextResponse.json({ venues });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to load venues.", 500);
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdminContext();
  if (!admin.ok) return admin.response;

  const payload = await req.json().catch(() => null);
  const supabase = createServiceRoleClient();

  try {
    const result = await upsertVenues(supabase, payload);
    if (result.issues.length) return NextResponse.json(result, { status: 400 });

    await logAdminAction(supabase, admin.user.id, "manage_venues_upsert", {
      imported: result.imported,
    });

    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to save venues.", 500);
  }
}
