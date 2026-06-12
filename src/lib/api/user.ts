import { jsonError } from "@/lib/api/admin";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function requireAuthenticatedUser() {
  const supabase = await getSupabaseServer();
  if (!supabase) {
    return {
      ok: false as const,
      response: jsonError("Supabase is not configured.", 501),
    };
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { ok: false as const, response: jsonError("Not authenticated.", 401) };
  }

  return { ok: true as const, supabase, user: data.user };
}
