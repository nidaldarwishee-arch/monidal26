import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/database.types";
import {
  getRequiredSupabaseConfig,
  getSupabaseConfig,
  isSupabaseConfigured,
} from "@/lib/supabase/env";

type ServerClient = SupabaseClient<Database>;

export function isSupabaseConfiguredServer(): boolean {
  return isSupabaseConfigured();
}

export async function createClient(): Promise<ServerClient> {
  const { url, key } = getRequiredSupabaseConfig();
  const cookieStore = await cookies();
  const setAll: SetAllCookies = (cookiesToSet) => {
    try {
      cookiesToSet.forEach(({ name, value, options }) =>
        cookieStore.set(name, value, options)
      );
    } catch {
      // Called from a Server Component; middleware refreshes sessions.
    }
  };

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll,
    },
  }) as unknown as ServerClient;
}

/** Server Supabase client bound to the request cookies, or null in demo mode. */
export async function getSupabaseServer(): Promise<ServerClient | null> {
  const config = getSupabaseConfig();
  if (!config) return null;
  return createClient();
}

/** Official results merged from the seed + the database (when configured). */
export async function getOfficialResultsServer() {
  const { SEED_RESULTS } = await import("@/data/results");
  const map = new Map(SEED_RESULTS.map((r) => [r.matchN, r]));
  const supabase = await getSupabaseServer();
  if (supabase) {
    const { data } = await supabase
      .from("match_results")
      .select("match_n, home_goals, away_goals, winner_team_id, status")
      .eq("official", true);
    for (const row of data ?? []) {
      map.set(row.match_n, {
        matchN: row.match_n,
        homeGoals: row.home_goals,
        awayGoals: row.away_goals,
        winner: row.winner_team_id ?? undefined,
        status: row.status === "live" ? "live" : "played",
      });
    }
  }
  return [...map.values()];
}
