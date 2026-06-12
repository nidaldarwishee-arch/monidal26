import type { MatchResult } from "@/lib/types";

/**
 * Official results seeded at build time. New results are added through the
 * admin dashboard (Supabase `match_results` table) or, in local demo mode,
 * stored in the browser. Last seed update: 12 June 2026.
 */
export const SEED_RESULTS: MatchResult[] = [
  // Opening match — Estadio Azteca, 11 June 2026
  { matchN: 1, homeGoals: 2, awayGoals: 0, status: "played" },
];
