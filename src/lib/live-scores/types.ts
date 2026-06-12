import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";
import type { MatchLifecycleStatus } from "@/lib/types";

export type LiveScoreProviderId = "manual" | "api-football" | "football-data" | "sportmonks";

export type LiveMatchStatus = Exclude<MatchLifecycleStatus, "played">;

export interface LiveScoreSnapshot {
  provider: LiveScoreProviderId;
  externalMatchId: string;
  matchN?: number;
  status: LiveMatchStatus;
  kickoffAt?: string | null;
  liveMinute?: number | null;
  homeScore?: number | null;
  awayScore?: number | null;
  halftimeHomeScore?: number | null;
  halftimeAwayScore?: number | null;
  extraTimeHomeScore?: number | null;
  extraTimeAwayScore?: number | null;
  penaltyHomeScore?: number | null;
  penaltyAwayScore?: number | null;
  winnerTeamId?: string | null;
  raw?: Json;
  fetchedAt: string;
}

export interface LiveScoreProvider {
  id: LiveScoreProviderId;
  fetchLiveMatches(): Promise<LiveScoreSnapshot[]>;
  fetchMatchResult(matchId: string): Promise<LiveScoreSnapshot | null>;
  syncFixtures?(): Promise<LiveScoreSnapshot[]>;
}

export interface SyncOutcome {
  provider: LiveScoreProviderId;
  checked: number;
  updated: number;
  skipped: number;
  message: string;
}

export type LiveScoreDbClient = SupabaseClient<Database>;
