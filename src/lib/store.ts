"use client";

/**
 * Client-side store backed by localStorage.
 *
 * With Supabase configured it holds fast local copies that sync up to the
 * database; in demo mode it is the single source of truth, so the entire
 * platform (predictions, favorites, admin results, bracket preview) stays
 * fully interactive without a backend.
 */

import { useSyncExternalStore } from "react";
import type { MatchResult, Prediction, UserProfile } from "@/lib/types";

export interface LocalState {
  profile: UserProfile | null;
  predictions: Record<number, Prediction>;
  favorites: string[];
  saved: number[];
  /** Results entered through the admin screen in demo mode */
  localResults: Record<number, MatchResult>;
}

const KEY = "wc26:v1";
const EVENT = "wc26:store";

const EMPTY: LocalState = {
  profile: null,
  predictions: {},
  favorites: [],
  saved: [],
  localResults: {},
};

let cache: LocalState | null = null;

function read(): LocalState {
  if (cache) return cache;
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache!;
}

function write(next: LocalState) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage full / privacy mode — keep in-memory state working
  }
  window.dispatchEvent(new Event(EVENT));
}

function update(mut: (s: LocalState) => LocalState) {
  write(mut(read()));
}

export const store = {
  get: read,

  setProfile(profile: UserProfile | null) {
    update((s) => ({ ...s, profile }));
  },

  setPrediction(p: Prediction) {
    update((s) => ({ ...s, predictions: { ...s.predictions, [p.matchN]: p } }));
  },

  removePrediction(matchN: number) {
    update((s) => {
      const predictions = { ...s.predictions };
      delete predictions[matchN];
      return { ...s, predictions };
    });
  },

  toggleFavorite(teamId: string) {
    update((s) => ({
      ...s,
      favorites: s.favorites.includes(teamId)
        ? s.favorites.filter((t) => t !== teamId)
        : [...s.favorites, teamId],
    }));
  },

  toggleSaved(matchN: number) {
    update((s) => ({
      ...s,
      saved: s.saved.includes(matchN)
        ? s.saved.filter((n) => n !== matchN)
        : [...s.saved, matchN],
    }));
  },

  setLocalResult(r: MatchResult) {
    update((s) => ({ ...s, localResults: { ...s.localResults, [r.matchN]: r } }));
  },

  removeLocalResult(matchN: number) {
    update((s) => {
      const localResults = { ...s.localResults };
      delete localResults[matchN];
      return { ...s, localResults };
    });
  },

  clearAll() {
    write(EMPTY);
  },
};

function subscribe(cb: () => void): () => void {
  const handler = () => {
    cache = null;
    cb();
  };
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function useLocalState(): LocalState {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}
