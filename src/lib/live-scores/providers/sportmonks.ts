import type { LiveMatchStatus, LiveScoreProvider, LiveScoreSnapshot } from "@/lib/live-scores/types";
import {
  asArray,
  asNumber,
  asRecord,
  asString,
  fetchProviderJson,
  snapshotBase,
} from "@/lib/live-scores/providers/base";

const SPORTMONKS_BASE_URL = "https://api.sportmonks.com/v3/football";

function mapStatus(status: string | null): LiveMatchStatus {
  const value = status?.toLowerCase() ?? "";
  if (["1st half", "2nd half", "extra time", "penalties", "inplay", "live"].includes(value)) {
    return "live";
  }
  if (["halftime", "half-time", "ht"].includes(value)) return "halftime";
  if (["ft", "finished", "after extra time", "after penalties"].includes(value)) return "finished";
  if (value.includes("postponed")) return "postponed";
  if (value.includes("cancel")) return "cancelled";
  return "scheduled";
}

function scoreByDescription(row: Record<string, unknown>, description: string, side: "home" | "away") {
  const scores = asArray(row.scores).map(asRecord);
  const found = scores.find((score) =>
    (asString(score.description) ?? "").toLowerCase().includes(description)
  );
  const score = asRecord(found?.score);
  return asNumber(score[side]);
}

function currentScore(row: Record<string, unknown>, side: "home" | "away") {
  return (
    scoreByDescription(row, "current", side) ??
    scoreByDescription(row, "fulltime", side) ??
    scoreByDescription(row, "full time", side)
  );
}

function mapFixture(item: unknown): LiveScoreSnapshot | null {
  const row = asRecord(item);
  const id = asString(row.id);
  if (!id) return null;

  const state = asRecord(row.state);
  const status = asString(state.name) ?? asString(state.short_name) ?? asString(row.status);

  return {
    ...snapshotBase("sportmonks", id, mapStatus(status), row),
    kickoffAt: asString(row.starting_at) ?? asString(row.starting_at_timestamp),
    liveMinute: asNumber(row.minute),
    homeScore: currentScore(row, "home"),
    awayScore: currentScore(row, "away"),
    halftimeHomeScore: scoreByDescription(row, "1st half", "home"),
    halftimeAwayScore: scoreByDescription(row, "1st half", "away"),
    extraTimeHomeScore: scoreByDescription(row, "extra time", "home"),
    extraTimeAwayScore: scoreByDescription(row, "extra time", "away"),
    penaltyHomeScore: scoreByDescription(row, "penalties", "home"),
    penaltyAwayScore: scoreByDescription(row, "penalties", "away"),
  };
}

export class SportmonksProvider implements LiveScoreProvider {
  id = "sportmonks" as const;

  constructor(private readonly apiKey: string) {}

  private async request(path: string, params: Record<string, string> = {}) {
    if (!this.apiKey) throw new Error("SPORTMONKS_API_KEY is not configured.");
    const url = new URL(`${SPORTMONKS_BASE_URL}${path}`);
    url.searchParams.set("api_token", this.apiKey);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    return fetchProviderJson(url, {});
  }

  async fetchLiveMatches(): Promise<LiveScoreSnapshot[]> {
    const payload = asRecord(await this.request("/livescores/inplay", { include: "scores;state" }));
    return asArray(payload.data)
      .map(mapFixture)
      .filter((item): item is LiveScoreSnapshot => Boolean(item));
  }

  async fetchMatchResult(matchId: string): Promise<LiveScoreSnapshot | null> {
    const payload = asRecord(
      await this.request(`/fixtures/${encodeURIComponent(matchId)}`, { include: "scores;state" })
    );
    return mapFixture(payload.data ?? payload);
  }

  async syncFixtures(): Promise<LiveScoreSnapshot[]> {
    const payload = asRecord(await this.request("/fixtures", { include: "scores;state" }));
    return asArray(payload.data)
      .map(mapFixture)
      .filter((item): item is LiveScoreSnapshot => Boolean(item));
  }
}
