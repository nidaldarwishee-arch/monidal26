import { NextRequest, NextResponse } from "next/server";
import { parseAnalyticsPayload, recordAnalyticsEvent } from "@/lib/analytics/service";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getSupabaseServer } from "@/lib/supabase/server";

function countryFromRequest(req: NextRequest) {
  return (
    req.headers.get("x-vercel-ip-country") ??
    req.headers.get("cf-ipcountry") ??
    req.headers.get("x-country") ??
    null
  );
}

export async function POST(req: NextRequest) {
  try {
    const text = await req.text();
    const payload = text ? JSON.parse(text) : null;
    const input = parseAnalyticsPayload(payload);
    const requestSupabase = await getSupabaseServer();
    const { data } = requestSupabase ? await requestSupabase.auth.getUser() : { data: { user: null } };
    await recordAnalyticsEvent(
      createServiceRoleClient(),
      input,
      data.user?.id ?? null,
      countryFromRequest(req)
    );
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to record analytics." },
      { status: 400 }
    );
  }
}
