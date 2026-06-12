import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseConfig } from "@/lib/supabase/env";

export async function updateSession(
  request: NextRequest,
  response = NextResponse.next({ request })
): Promise<NextResponse> {
  const config = getSupabaseConfig();
  if (!config) return response;

  const supabaseResponse = response;
  const setAll: SetAllCookies = (cookiesToSet) => {
    cookiesToSet.forEach(({ name, value }) => {
      request.cookies.set(name, value);
    });
    cookiesToSet.forEach(({ name, value, options }) => {
      supabaseResponse.cookies.set(name, value, options);
    });
  };

  const supabase = createServerClient<Database>(config.url, config.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll,
    },
  });

  await supabase.auth.getClaims();

  return supabaseResponse;
}
