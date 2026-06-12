import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export function isSupabaseConfiguredServer(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** Server Supabase client bound to the request cookies, or null in demo mode. */
export async function getSupabaseServer(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfiguredServer()) return null;
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — middleware refreshes sessions.
          }
        },
      },
    }
  );
}

/** Official results merged from the seed + the database (when configured). */
export async function getOfficialResultsServer() {
  const { SEED_RESULTS } = await import("@/data/results");
  const map = new Map(SEED_RESULTS.map((r) => [r.matchN, r]));
  const supabase = await getSupabaseServer();
  if (supabase) {
    const { data } = await supabase
      .from("match_results")
      .select("match_n, home_goals, away_goals, winner_team, status")
      .eq("official", true);
    for (const row of data ?? []) {
      map.set(row.match_n, {
        matchN: row.match_n,
        homeGoals: row.home_goals,
        awayGoals: row.away_goals,
        winner: row.winner_team ?? undefined,
        status: row.status === "live" ? "live" : "played",
      });
    }
  }
  return [...map.values()];
}
