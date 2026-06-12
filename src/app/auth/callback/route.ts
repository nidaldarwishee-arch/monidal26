import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { touchLastLogin } from "@/lib/dashboard/service";

function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
    const { data } = await supabase.auth.getUser();
    if (data.user) await touchLastLogin(supabase, data.user.id);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
