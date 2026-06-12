"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MatchResult, Prediction, UserProfile } from "@/lib/types";
import { SEED_RESULTS } from "@/data/results";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";
import { store, useLocalState } from "@/lib/store";
import { toResultsMap } from "@/lib/bracket";
import type { ResultsMap } from "@/lib/standings";

/**
 * Official results: seed + database rows (when Supabase is configured) +
 * admin-entered local results (demo mode).
 */
export function useOfficialResults(): ResultsMap {
  const local = useLocalState();
  const [dbResults, setDbResults] = useState<MatchResult[]>([]);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    let cancelled = false;
    supabase
      .from("match_results")
      .select("match_n, home_goals, away_goals, winner_team, status")
      .eq("official", true)
      .then(({ data }) => {
        if (cancelled || !data) return;
        setDbResults(
          data.map((row) => ({
            matchN: row.match_n,
            homeGoals: row.home_goals,
            awayGoals: row.away_goals,
            winner: row.winner_team ?? undefined,
            status: row.status === "live" ? "live" : "played",
          }))
        );
      });
    return () => {
      cancelled = true;
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
    if (!supabase) return;

    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        setSupabaseProfile(null);
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, role")
        .eq("id", data.user.id)
        .single();
      setSupabaseProfile({
        id: data.user.id,
        name: profile?.display_name ?? data.user.email ?? "User",
        email: data.user.email ?? "",
        role: profile?.role === "admin" ? "admin" : "user",
      });
      setLoading(false);
    };

    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => sub.subscription.unsubscribe();
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
    await supabase.from("user_predictions").upsert(
      {
        user_id: data.user.id,
        match_n: p.matchN,
        home_goals: p.homeGoals,
        away_goals: p.awayGoals,
        winner_team: p.winner ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,match_n" }
    );
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
      if (!r || r.status !== "played") continue;
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
