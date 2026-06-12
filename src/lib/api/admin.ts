import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/auth";

type AdminContext =
  | {
      ok: true;
      user: User;
      profile: Profile;
    }
  | {
      ok: false;
      response: NextResponse;
    };

export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export async function requireAdminContext(): Promise<AdminContext> {
  const supabase = await getSupabaseServer();
  if (!supabase) {
    return {
      ok: false,
      response: jsonError("Supabase is not configured.", 501),
    };
  }

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) {
    return {
      ok: false,
      response: jsonError("Not authenticated.", 401),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "admin") {
    return {
      ok: false,
      response: jsonError("Admin role required.", 403),
    };
  }

  return { ok: true, user: auth.user, profile };
}
