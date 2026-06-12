"use client";

import { useMemo } from "react";
import { resolveBracket, toResultsMap } from "@/lib/bracket";
import { useLocalState } from "@/lib/store";
import { useOfficialResults } from "@/lib/hooks";
import type { ResolvedMatch } from "@/lib/types";
import type { ResultsMap } from "@/lib/standings";

/** Bracket resolved from official results. */
export function useResolvedMatches(): {
  resolved: Map<number, ResolvedMatch>;
  results: ResultsMap;
} {
  const results = useOfficialResults();
  const resolved = useMemo(() => resolveBracket(results), [results]);
  return { resolved, results };
}

/**
 * Bracket resolved from official results overlaid with the user's
 * predictions — powers "my bracket" and what-if progression previews.
 */
export function usePredictedMatches(): {
  resolved: Map<number, ResolvedMatch>;
  results: ResultsMap;
} {
  const official = useOfficialResults();
  const local = useLocalState();
  const results = useMemo(() => {
    const merged: ResultsMap = new Map(official);
    for (const p of Object.values(local.predictions)) {
      if (!merged.has(p.matchN)) {
        merged.set(p.matchN, {
          matchN: p.matchN,
          homeGoals: p.homeGoals,
          awayGoals: p.awayGoals,
          winner: p.winner,
          status: "played",
        });
      }
    }
    return merged;
  }, [official, local.predictions]);
  const resolved = useMemo(() => resolveBracket(results), [results]);
  return { resolved, results };
}
