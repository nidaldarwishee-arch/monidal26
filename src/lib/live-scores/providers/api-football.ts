import type { LiveMatchStatus, LiveScoreProvider, LiveScoreSnapshot } from "@/lib/live-scores/types";
import {
  asNumber,
  asRecord,
  asString,
  fetchProviderJson,
  snapshotBase,
} from "@/lib/live-scores/providers/base";

const API_FOOTBALL_BASE_URL = "https://v3.football.api-sports.io";

function mapStatus(short: string | null): LiveMatchStatus {
  switch (short) {
    case "1H":
    case "2H":
    case "ET":
    case "BT":
    case "P":
      return "live";
    case "HT":
      return "halftime";
    case "FT":
    case "AET":
    case "PEN":
      return "finished";
    case "PST":
      return "postponed";
    case "CANC":
    case "ABD":
      return "cancelled";
    default:
      return "scheduled";
  }
}

function scorePart(score: Record<string, unknown>, key: string, side: "home" | "away") {
  return asNumber(asRecord(score[key])[side]);
}

function mapFixture(item: unknown): LiveScoreSnapshot | null {
  const row = asRecord(item);
  const fixture = asRecord(row.fixture);
  const id = asString(fixture.id);
  if (!id) return null;

  const status = asRecord(fixture.status);
  const goals = asRecord(row.goals);
  const score = asRecord(row.score);

  return {
    ...snapshotBase("api-football", id, mapStatus(asString(status.short)), row),
    liveMinute: asNumber(status.elapsed),
    homeScore: asNumber(goals.home),
    awayScore: asNumber(goals.away),
    halftimeHomeScore: scorePart(score, "halftime", "home"),
    halftimeAwayScore: scorePart(score, "halftime", "away"),
    extraTimeHomeScore: scorePart(score, "extratime", "home"),
    extraTimeAwayScore: scorePart(score, "extratime", "away"),
    penaltyHomeScore: scorePart(score, "penalty", "home"),
    penaltyAwayScore: scorePart(score, "penalty", "away"),
    kickoffAt: asString(fixture.date),
  };
}

export class ApiFootballProvider implements LiveScoreProvider {
  id = "api-football" as const;

  constructor(private readonly apiKey: string) {}

  private async request(path: string, params: Record<string, string>) {
    if (!this.apiKey) throw new Error("API_FOOTBALL_KEY is not configured.");
    const url = new URL(`${API_FOOTBALL_BASE_URL}${path}`);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    return fetchProviderJson(url, { "x-apisports-key": this.apiKey });
  }

  async fetchLiveMatches(): Promise<LiveScoreSnapshot[]> {
    const payload = asRecord(await this.request("/fixtures", { live: "all" }));
    return (Array.isArray(payload.response) ? payload.response : [])
      .map(mapFixture)
      .filter((item): item is LiveScoreSnapshot => Boolean(item));
  }

  async fetchMatchResult(matchId: string): Promise<LiveScoreSnapshot | null> {
    const payload = asRecord(await this.request("/fixtures", { id: matchId }));
    const first = Array.isArray(payload.response) ? payload.response[0] : null;
    return mapFixture(first);
  }

  async syncFixtures(): Promise<LiveScoreSnapshot[]> {
    const payload = asRecord(await this.request("/fixtures", { league: "1", season: "2026" }));
    return (Array.isArray(payload.response) ? payload.response : [])
      .map(mapFixture)
      .filter((item): item is LiveScoreSnapshot => Boolean(item));
  }
}
