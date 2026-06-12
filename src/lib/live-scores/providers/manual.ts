import type { LiveScoreProvider, LiveScoreSnapshot } from "@/lib/live-scores/types";

export class ManualLiveScoreProvider implements LiveScoreProvider {
  id = "manual" as const;

  async fetchLiveMatches(): Promise<LiveScoreSnapshot[]> {
    return [];
  }

  async fetchMatchResult(): Promise<LiveScoreSnapshot | null> {
    return null;
  }

  async syncFixtures(): Promise<LiveScoreSnapshot[]> {
    return [];
  }
}
