import type { LiveMatchStatus, LiveScoreProvider, LiveScoreSnapshot } from "@/lib/live-scores/types";
import {
  asNumber,
  asRecord,
  asString,
  fetchProviderJson,
  snapshotBase,
} from "@/lib/live-scores/providers/base";

const FOOTBALL_DATA_BASE_URL = "https://api.football-data.org/v4";

function mapStatus(status: string | null): LiveMatchStatus {
  switch (status) {
    case "IN_PLAY":
    case "LIVE":
    case "EXTRA_TIME":
    case "PENALTY_SHOOTOUT":
      return "live";
    case "PAUSED":
      return "halftime";
    case "FINISHED":
      return "finished";
    case "POSTPONED":
    case "SUSPENDED":
      return "postponed";
    case "CANCELLED":
      return "cancelled";
    default:
      return "scheduled";
  }
}

function scorePart(score: Record<string, unknown>, key: string, side: "home" | "away") {
  const part = asRecord(score[key]);
  return asNumber(part[side]);
}

function mapMatch(item: unknown): LiveScoreSnapshot | null {
  const row = asRecord(item);
  const id = asString(row.id);
  if (!id) return null;

  const score = asRecord(row.score);
  const fullTimeHome = scorePart(score, "fullTime", "home");
  const fullTimeAway = scorePart(score, "fullTime", "away");

  return {
    ...snapshotBase("football-data", id, mapStatus(asString(row.status)), row),
    kickoffAt: asString(row.utcDate),
    homeScore: fullTimeHome,
    awayScore: fullTimeAway,
    halftimeHomeScore: scorePart(score, "halfTime", "home"),
    halftimeAwayScore: scorePart(score, "halfTime", "away"),
    extraTimeHomeScore: scorePart(score, "extraTime", "home"),
    extraTimeAwayScore: scorePart(score, "extraTime", "away"),
    penaltyHomeScore: scorePart(score, "penalties", "home"),
    penaltyAwayScore: scorePart(score, "penalties", "away"),
  };
}

export class FootballDataProvider implements LiveScoreProvider {
  id = "football-data" as const;

  constructor(private readonly apiKey: string) {}

  private async request(path: string, params: Record<string, string> = {}) {
    if (!this.apiKey) throw new Error("FOOTBALL_DATA_KEY is not configured.");
    const url = new URL(`${FOOTBALL_DATA_BASE_URL}${path}`);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    return fetchProviderJson(url, { "X-Auth-Token": this.apiKey });
  }

  async fetchLiveMatches(): Promise<LiveScoreSnapshot[]> {
    const payload = asRecord(await this.request("/matches", { status: "LIVE" }));
    return (Array.isArray(payload.matches) ? payload.matches : [])
      .map(mapMatch)
      .filter((item): item is LiveScoreSnapshot => Boolean(item));
  }

  async fetchMatchResult(matchId: string): Promise<LiveScoreSnapshot | null> {
    const payload = asRecord(await this.request(`/matches/${encodeURIComponent(matchId)}`));
    return mapMatch(payload.match ?? payload);
  }

  async syncFixtures(): Promise<LiveScoreSnapshot[]> {
    const payload = asRecord(await this.request("/competitions/WC/matches"));
    return (Array.isArray(payload.matches) ? payload.matches : [])
      .map(mapMatch)
      .filter((item): item is LiveScoreSnapshot => Boolean(item));
  }
}
