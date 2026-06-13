import type { MatchResult } from "@/lib/types";

/**
 * Official results seeded at build time. New results are added through the
 * admin dashboard (Supabase `match_results` table) or, in local demo mode,
 * stored in the browser. Last seed update: 13 June 2026.
 *
 * DB results override these at runtime; seed is the offline/instant fallback.
 */
export const SEED_RESULTS: MatchResult[] = [
  // ── 11 June 2026 ──────────────────────────────────────────────────────────
  { matchN: 1,  homeGoals: 2, awayGoals: 0, status: "played" }, // MEX 2–0 RSA

  // ── 12 June 2026 ──────────────────────────────────────────────────────────
  { matchN: 2,  homeGoals: 2, awayGoals: 1, status: "played" }, // KOR 2–1 CZE
  { matchN: 3,  homeGoals: 1, awayGoals: 1, status: "played" }, // CAN 1–1 BIH

  // ── 13 June 2026 ──────────────────────────────────────────────────────────
  { matchN: 4,  homeGoals: 4, awayGoals: 1, status: "played" }, // USA 4–1 PAR
  { matchN: 8,  homeGoals: 0, awayGoals: 1, status: "played" }, // QAT 0–1 SUI
];
