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

  // getUser() validates the token server-side and refreshes it if expired.
  // getClaims() only parses the JWT locally and does not guarantee cookie refresh.
  const { data: { user }, error } = await supabase.auth.getUser();
  if (process.env.NODE_ENV !== "production") {
    console.log("[middleware] getUser:", user ? `uid=${user.id}` : "null", error?.message ?? "");
  }

  return supabaseResponse;
}
