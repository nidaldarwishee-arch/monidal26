import { jsonError } from "@/lib/api/admin";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function requirePredictionUser() {
  const supabase = await getSupabaseServer();
  if (!supabase) {
    return {
      ok: false as const,
      response: jsonError(
        "Supabase is not configured. Demo mode stores predictions in the browser.",
        501
      ),
    };
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return { ok: false as const, response: jsonError("Not authenticated", 401) };
  }

  return { ok: true as const, supabase, user: auth.user };
}
