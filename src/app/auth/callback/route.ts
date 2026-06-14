import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseConfig } from "@/lib/supabase/env";
import { touchLastLogin } from "@/lib/dashboard/service";

function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));

  const redirectTo = new URL(next, url.origin);
  const response = NextResponse.redirect(redirectTo);

  if (code) {
    const config = getSupabaseConfig();
    if (config) {
      // Use request/response cookie pattern — the ONLY reliable way to set
      // cookies in a Route Handler and have them appear in the redirect response.
      const supabase = createServerClient<Database>(config.url, config.key, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
            });
          },

        },
      });

      await supabase.auth.exchangeCodeForSession(code);
      const { data } = await supabase.auth.getUser();
      if (data.user) await touchLastLogin(supabase as unknown as SupabaseClient<Database>, data.user.id);
    }
  }

  return response;
}
