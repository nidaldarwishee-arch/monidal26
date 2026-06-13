"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MatchResult, Prediction, UserProfile } from "@/lib/types";
import { isFinalResultStatus } from "@/lib/types";
import { SEED_RESULTS } from "@/data/results";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";
import { store, useLocalState } from "@/lib/store";
import { toResultsMap } from "@/lib/bracket";
import type { ResultsMap } from "@/lib/standings";

/**
 * Official results: seed + database rows (when Supabase is configured) +
 * admin-entered local results (demo mode).
 */
const RESULTS_POLL_MS = 3 * 60 * 1000; // re-fetch from Supabase every 3 min

export function useOfficialResults(): ResultsMap {
  const local = useLocalState();
  const [dbResults, setDbResults] = useState<MatchResult[]>([]);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    let cancelled = false;

    const fetchResults = () =>
      supabase
        .from("match_results")
        .select(
          "match_n, home_goals, away_goals, winner_team_id, status, halftime_home_score, halftime_away_score, extra_time_home_score, extra_time_away_score, penalty_home_score, penalty_away_score, live_minute, last_synced_at, external_provider, external_match_id"
        )
        .eq("official", true)
        .then(({ data }) => {
          if (cancelled || !data) return;
          setDbResults(
            data.map((row) => ({
              matchN: row.match_n,
              homeGoals: row.home_goals,
              awayGoals: row.away_goals,
              winner: row.winner_team_id ?? undefined,
              status: row.status === "live" || row.status === "halftime" ? row.status : "finished",
              halftimeHomeGoals: row.halftime_home_score,
              halftimeAwayGoals: row.halftime_away_score,
              extraTimeHomeGoals: row.extra_time_home_score,
              extraTimeAwayGoals: row.extra_time_away_score,
              penaltyHomeGoals: row.penalty_home_score,
              penaltyAwayGoals: row.penalty_away_score,
              liveMinute: row.live_minute,
              lastSyncedAt: row.last_synced_at,
              externalProvider: row.external_provider,
              externalMatchId: row.external_match_id,
            }))
          );
        });

    fetchResults(); // initial load
    const timer = setInterval(fetchResults, RESULTS_POLL_MS); // auto-refresh

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return useMemo(() => {
    const merged = toResultsMap(SEED_RESULTS);
    for (const r of dbResults) merged.set(r.matchN, r);
    for (const r of Object.values(local.localResults)) merged.set(r.matchN, r);
    return merged;
  }, [dbResults, local.localResults]);
}

/** Current user: Supabase session when configured, local profile otherwise. */
export function useUser() {
  const local = useLocalState();
  const [supabaseProfile, setSupabaseProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured());

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Hard deadline: if Supabase auth hasn't fired within 8 s (e.g. the
    // project is paused, the token refresh is retrying, or the network is
    // unreachable), stop waiting and treat the user as signed out.
    // For the dashboard the server already confirmed auth via requireUser(),
    // so this deadline only matters for the nav/other pages.
    let settled = false;
    const settle = () => {
      if (!settled) {
        settled = true;
        setLoading(false);
      }
    };
    const deadline = setTimeout(settle, 8_000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        clearTimeout(deadline);
        if (!session?.user) {
          setSupabaseProfile(null);
          settle();
          return;
        }
        const user = session.user;
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, role")
            .eq("id", user.id)
            .single();
          setSupabaseProfile({
            id: user.id,
            name: profile?.display_name ?? user.email ?? "User",
            email: user.email ?? "",
            role: profile?.role === "admin" ? "admin" : "user",
          });
        } catch {
          setSupabaseProfile({
            id: user.id,
            name: user.email ?? "User",
            email: user.email ?? "",
            role: "user",
          });
        } finally {
          settle();
        }
      }
    );

    return () => {
      clearTimeout(deadline);
      subscription.unsubscribe();
    };
  }, []);

  const user = isSupabaseConfigured() ? supabaseProfile : local.profile;

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    if (supabase) await supabase.auth.signOut();
    store.setProfile(null);
  }, []);

  return { user, loading, signOut, demoMode: !isSupabaseConfigured() };
}

/** Saves a prediction locally and, when possible, to the database. */
export function useSavePrediction() {
  return useCallback(async (p: Prediction) => {
    store.setPrediction(p);
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    }).catch(() => null);
  }, []);
}

/** Prediction accuracy vs official results: 3 pts exact score, 1 pt outcome. */
export function usePredictionScore(predictions: Record<number, Prediction>, results: ResultsMap) {
  return useMemo(() => {
    let exact = 0;
    let outcome = 0;
    let scored = 0;
    for (const p of Object.values(predictions)) {
      const r = results.get(p.matchN);
      if (!r || !isFinalResultStatus(r.status)) continue;
      scored += 1;
      if (r.homeGoals === p.homeGoals && r.awayGoals === p.awayGoals) {
        exact += 1;
      } else {
        const sign = (x: number) => (x > 0 ? 1 : x < 0 ? -1 : 0);
        if (sign(r.homeGoals - r.awayGoals) === sign(p.homeGoals - p.awayGoals)) outcome += 1;
      }
    }
    return { exact, outcome, scored, points: exact * 3 + outcome };
  }, [predictions, results]);
}
