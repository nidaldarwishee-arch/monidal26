import { NextResponse } from "next/server";
import { jsonError, requireAdminContext } from "@/lib/api/admin";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function GET() {
  const admin = await requireAdminContext();
  if (!admin.ok) return admin.response;

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("live_score_sync_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ logs: data ?? [] });
}
