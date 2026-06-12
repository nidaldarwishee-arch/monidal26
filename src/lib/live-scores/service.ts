import { GROUPS, type GroupId, type MatchLifecycleStatus, isFinalResultStatus } from "@/lib/types";
import { computeGroupStandings, rankThirdPlaced } from "@/lib/standings";
import { resolveBracket } from "@/lib/bracket";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/lib/supabase/database.types";
import { getPredictionLeaderboard, getOfficialResultsMap } from "@/lib/predictions/service";
import { createLiveScoreProvider } from "@/lib/live-scores/providers";
import type {
  LiveMatchStatus,
  LiveScoreDbClient,
  LiveScoreProvider,
  LiveScoreProviderId,
  LiveScoreSnapshot,
  SyncOutcome,
} from "@/lib/live-scores/types";

type MatchRow = Database["public"]["Tables"]["matches"]["Row"];
type ResultRow = Database["public"]["Tables"]["match_results"]["Row"];
type SyncType = Database["public"]["Tables"]["live_score_sync_logs"]["Row"]["sync_type"];
type SyncStatus = Database["public"]["Tables"]["live_score_sync_logs"]["Row"]["status"];

const LIVE_CACHE_SECONDS = 55;
const RESULT_CACHE_SECONDS = 5 * 60;
const FIXTURE_CACHE_SECONDS = 24 * 60 * 60;

function tryServiceClient(): LiveScoreDbClient | null {
  try {
    return createServiceRoleClient();
  } catch {
    return null;
  }
}

function expiresAt(seconds: number) {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

function toJson(value: unknown): Json {
  return value as Json;
}

function resultStatusFromLive(status: LiveMatchStatus): ResultRow["status"] {
  if (status === "finished") return "finished";
  if (status === "halftime") return "halftime";
  if (status === "live") return "live";
  return status;
}

function hasScore(snapshot: LiveScoreSnapshot): snapshot is LiveScoreSnapshot & {
  homeScore: number;
  awayScore: number;
} {
  return typeof snapshot.homeScore === "number" && typeof snapshot.awayScore === "number";
}

async function readCachedSnapshots(
  supabase: LiveScoreDbClient,
  provider: LiveScoreProviderId,
  cacheKey: string
): Promise<LiveScoreSnapshot[] | null> {
  const { data, error } = await supabase
    .from("live_score_cache")
    .select("response, expires_at")
    .eq("provider", provider)
    .eq("cache_key", cacheKey)
    .maybeSingle();

  if (error || !data || Date.parse(data.expires_at) <= Date.now()) return null;
  return Array.isArray(data.response) ? (data.response as unknown as LiveScoreSnapshot[]) : null;
}

async function writeSnapshotCache(
  supabase: LiveScoreDbClient,
  provider: LiveScoreProviderId,
  cacheKey: string,
  snapshots: LiveScoreSnapshot[],
  ttlSeconds: number
) {
  await supabase.from("live_score_cache").upsert(
    {
      provider,
      cache_key: cacheKey,
      response: toJson(snapshots),
      fetched_at: new Date().toISOString(),
      expires_at: expiresAt(ttlSeconds),
      status_code: 200,
      error: null,
    },
    { onConflict: "provider,cache_key" }
  );
}

async function logSyncStatus(
  supabase: LiveScoreDbClient,
  provider: LiveScoreProviderId,
  syncType: SyncType,
  status: SyncStatus,
  detail: {
    message: string;
    checked?: number;
    updated?: number;
    createdBy?: string | null;
    extra?: Json;
  }
) {
  await supabase.from("live_score_sync_logs").insert({
    provider,
    sync_type: syncType,
    status,
    message: detail.message,
    matches_checked: detail.checked ?? 0,
    matches_updated: detail.updated ?? 0,
    detail: detail.extra ?? null,
    created_by: detail.createdBy ?? null,
    finished_at: new Date().toISOString(),
  });
}

function resultRowToSnapshot(match: MatchRow, result?: ResultRow): LiveScoreSnapshot {
  return {
    provider: (match.external_provider as LiveScoreProviderId | null) ?? "manual",
    externalMatchId: match.external_match_id ?? String(match.match_n),
    matchN: match.match_n,
    status: (match.status === "played" ? "finished" : match.status) as LiveMatchStatus,
    kickoffAt: match.kickoff_at,
    liveMinute: result?.live_minute ?? match.live_minute,
    homeScore: result?.home_score ?? result?.home_goals ?? null,
    awayScore: result?.away_score ?? result?.away_goals ?? null,
    halftimeHomeScore: result?.halftime_home_score ?? null,
    halftimeAwayScore: result?.halftime_away_score ?? null,
    extraTimeHomeScore: result?.extra_time_home_score ?? null,
    extraTimeAwayScore: result?.extra_time_away_score ?? null,
    penaltyHomeScore: result?.penalty_home_score ?? null,
    penaltyAwayScore: result?.penalty_away_score ?? null,
    winnerTeamId: result?.winner_team_id ?? null,
    fetchedAt: result?.last_synced_at ?? match.last_synced_at ?? new Date().toISOString(),
  };
}

async function listDbSnapshots(
  supabase: LiveScoreDbClient,
  matchN?: number,
  statuses?: MatchLifecycleStatus[]
): Promise<LiveScoreSnapshot[]> {
  let matchQuery = supabase
    .from("matches")
    .select("*")
    .order("kickoff_at", { ascending: true });

  if (matchN) matchQuery = matchQuery.eq("match_n", matchN);
  if (statuses?.length) matchQuery = matchQuery.in("status", statuses);

  const { data: matches, error: matchError } = await matchQuery;
  if (matchError) throw new Error(matchError.message);
  if (!matches?.length) return [];

  const matchNumbers = matches.map((match) => match.match_n);
  const { data: results, error: resultError } = await supabase
    .from("match_results")
    .select("*")
    .in("match_n", matchNumbers);
  if (resultError) throw new Error(resultError.message);

  const resultsByMatch = new Map((results ?? []).map((row) => [row.match_n, row]));
  return matches.map((match) => resultRowToSnapshot(match, resultsByMatch.get(match.match_n)));
}

async function findMatchForSnapshot(
  supabase: LiveScoreDbClient,
  snapshot: LiveScoreSnapshot
): Promise<MatchRow | null> {
  if (snapshot.matchN) {
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .eq("match_n", snapshot.matchN)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ?? null;
  }

  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("external_provider", snapshot.provider)
    .eq("external_match_id", snapshot.externalMatchId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? null;
}

async function resolveWinnerTeamId(
  supabase: LiveScoreDbClient,
  matchN: number,
  snapshot: LiveScoreSnapshot
): Promise<string | null> {
  if (snapshot.winnerTeamId) return snapshot.winnerTeamId;
  if (!hasScore(snapshot) || snapshot.homeScore === snapshot.awayScore) return null;

  const results = await getOfficialResultsMap(supabase);
  results.set(matchN, {
    matchN,
    homeGoals: snapshot.homeScore,
    awayGoals: snapshot.awayScore,
    status: "finished",
  });

  const match = resolveBracket(results).get(matchN);
  if (!match) return null;
  return snapshot.homeScore > snapshot.awayScore
    ? match.home.teamId ?? null
    : match.away.teamId ?? null;
}

async function applyLiveSnapshot(
  supabase: LiveScoreDbClient,
  snapshot: LiveScoreSnapshot
): Promise<boolean> {
  const match = await findMatchForSnapshot(supabase, snapshot);
  if (!match) return false;

  const now = new Date().toISOString();
  const matchStatus = snapshot.status === "finished" ? "finished" : snapshot.status;
  const { error: matchError } = await supabase
    .from("matches")
    .update({
      status: matchStatus,
      live_minute: snapshot.liveMinute ?? null,
      last_synced_at: now,
      external_provider: snapshot.provider,
      external_match_id: snapshot.externalMatchId,
    })
    .eq("match_n", match.match_n);
  if (matchError) throw new Error(matchError.message);

  if (!hasScore(snapshot)) return true;

  const winnerTeamId = isFinalResultStatus(matchStatus)
    ? await resolveWinnerTeamId(supabase, match.match_n, snapshot)
    : null;

  const { error: resultError } = await supabase.from("match_results").upsert(
    {
      match_n: match.match_n,
      home_goals: snapshot.homeScore,
      away_goals: snapshot.awayScore,
      home_score: snapshot.homeScore,
      away_score: snapshot.awayScore,
      halftime_home_score: snapshot.halftimeHomeScore ?? null,
      halftime_away_score: snapshot.halftimeAwayScore ?? null,
      extra_time_home_score: snapshot.extraTimeHomeScore ?? null,
      extra_time_away_score: snapshot.extraTimeAwayScore ?? null,
      penalty_home_score: snapshot.penaltyHomeScore ?? null,
      penalty_away_score: snapshot.penaltyAwayScore ?? null,
      winner_team_id: winnerTeamId,
      status: resultStatusFromLive(snapshot.status),
      official: true,
      live_minute: snapshot.liveMinute ?? null,
      last_synced_at: now,
      external_provider: snapshot.provider,
      external_match_id: snapshot.externalMatchId,
      locked: isFinalResultStatus(matchStatus),
      updated_at: now,
    },
    { onConflict: "match_n" }
  );
  if (resultError) throw new Error(resultError.message);
  return true;
}

async function fetchProviderSnapshots(
  supabase: LiveScoreDbClient,
  provider: LiveScoreProvider,
  cacheKey: string,
  ttlSeconds: number,
  load: () => Promise<LiveScoreSnapshot[]>
) {
  const cached = await readCachedSnapshots(supabase, provider.id, cacheKey);
  if (cached) return cached;
  const snapshots = await load();
  await writeSnapshotCache(supabase, provider.id, cacheKey, snapshots, ttlSeconds);
  return snapshots;
}

export async function fetchLiveMatches(): Promise<LiveScoreSnapshot[]> {
  const supabase = tryServiceClient();
  if (!supabase) return [];

  const provider = createLiveScoreProvider();
  if (provider.id === "manual") {
    return listDbSnapshots(supabase, undefined, ["live", "halftime"]);
  }

  try {
    return await fetchProviderSnapshots(supabase, provider, "live", LIVE_CACHE_SECONDS, () =>
      provider.fetchLiveMatches()
    );
  } catch (error) {
    await logSyncStatus(supabase, provider.id, "live", "error", {
      message: error instanceof Error ? error.message : "Failed to fetch live scores.",
    });
    return listDbSnapshots(supabase, undefined, ["live", "halftime"]);
  }
}

export async function fetchMatchResult(matchId: string): Promise<LiveScoreSnapshot | null> {
  const supabase = tryServiceClient();
  if (!supabase) return null;

  const localMatchN = Number(matchId);
  if (Number.isInteger(localMatchN)) {
    const [snapshot] = await listDbSnapshots(supabase, localMatchN);
    return snapshot ?? null;
  }

  const provider = createLiveScoreProvider();
  if (provider.id === "manual") return null;

  const cacheKey = `result:${matchId}`;
  const cached = await readCachedSnapshots(supabase, provider.id, cacheKey);
  if (cached?.[0]) return cached[0];

  const snapshot = await provider.fetchMatchResult(matchId);
  if (snapshot) await writeSnapshotCache(supabase, provider.id, cacheKey, [snapshot], RESULT_CACHE_SECONDS);
  return snapshot;
}

export async function syncFixtures(createdBy?: string): Promise<SyncOutcome> {
  const supabase = createServiceRoleClient();
  const provider = createLiveScoreProvider();
  if (!provider.syncFixtures || provider.id === "manual") {
    const outcome = {
      provider: provider.id,
      checked: 0,
      updated: 0,
      skipped: 0,
      message: "Fixture sync skipped for manual provider.",
    };
    await logSyncStatus(supabase, provider.id, "fixtures", "skipped", {
      message: outcome.message,
      createdBy,
    });
    return outcome;
  }

  const snapshots = await fetchProviderSnapshots(supabase, provider, "fixtures", FIXTURE_CACHE_SECONDS, () =>
    provider.syncFixtures!()
  );
  let updated = 0;
  for (const snapshot of snapshots) {
    if (await applyLiveSnapshot(supabase, snapshot)) updated += 1;
  }

  await logSyncStatus(supabase, provider.id, "fixtures", "success", {
    message: "Fixture sync completed.",
    checked: snapshots.length,
    updated,
    createdBy,
  });

  return {
    provider: provider.id,
    checked: snapshots.length,
    updated,
    skipped: snapshots.length - updated,
    message: "Fixture sync completed.",
  };
}

export async function syncLiveScores(createdBy?: string): Promise<SyncOutcome> {
  const supabase = createServiceRoleClient();
  const provider = createLiveScoreProvider();

  if (provider.id === "manual") {
    const snapshots = await listDbSnapshots(supabase, undefined, ["live", "halftime"]);
    await logSyncStatus(supabase, provider.id, "live", "skipped", {
      message: "Manual provider uses admin-entered scores.",
      checked: snapshots.length,
      createdBy,
    });
    return {
      provider: provider.id,
      checked: snapshots.length,
      updated: 0,
      skipped: snapshots.length,
      message: "Manual provider uses admin-entered scores.",
    };
  }

  const snapshots = await fetchProviderSnapshots(supabase, provider, "live", LIVE_CACHE_SECONDS, () =>
    provider.fetchLiveMatches()
  );
  let updated = 0;
  for (const snapshot of snapshots) {
    if (await applyLiveSnapshot(supabase, snapshot)) updated += 1;
  }

  await logSyncStatus(supabase, provider.id, "live", "success", {
    message: "Live score sync completed.",
    checked: snapshots.length,
    updated,
    createdBy,
  });

  return {
    provider: provider.id,
    checked: snapshots.length,
    updated,
    skipped: snapshots.length - updated,
    message: "Live score sync completed.",
  };
}

export async function syncFinishedResults(createdBy?: string): Promise<SyncOutcome> {
  const supabase = createServiceRoleClient();
  const provider = createLiveScoreProvider();
  const candidates = await listDbSnapshots(supabase, undefined, ["live", "halftime"]);

  if (provider.id === "manual") {
    await logSyncStatus(supabase, provider.id, "results", "skipped", {
      message: "Manual provider uses admin-entered final results.",
      checked: candidates.length,
      createdBy,
    });
    return {
      provider: provider.id,
      checked: candidates.length,
      updated: 0,
      skipped: candidates.length,
      message: "Manual provider uses admin-entered final results.",
    };
  }

  let updated = 0;
  for (const candidate of candidates) {
    if (candidate.provider !== provider.id || !candidate.externalMatchId) continue;
    const cacheKey = `result:${candidate.externalMatchId}`;
    const cached = await readCachedSnapshots(supabase, provider.id, cacheKey);
    const snapshot =
      cached?.[0] ??
      (await provider.fetchMatchResult(candidate.externalMatchId).then(async (item) => {
        if (item) await writeSnapshotCache(supabase, provider.id, cacheKey, [item], RESULT_CACHE_SECONDS);
        return item;
      }));
    if (snapshot?.status === "finished" && (await applyLiveSnapshot(supabase, snapshot))) {
      updated += 1;
    }
  }

  await logSyncStatus(supabase, provider.id, "results", "success", {
    message: "Finished result sync completed.",
    checked: candidates.length,
    updated,
    createdBy,
  });

  return {
    provider: provider.id,
    checked: candidates.length,
    updated,
    skipped: candidates.length - updated,
    message: "Finished result sync completed.",
  };
}

export async function updateStandingsAfterResult(createdBy?: string) {
  const supabase = createServiceRoleClient();
  const results = await getOfficialResultsMap(supabase);
  const standings = new Map<GroupId, ReturnType<typeof computeGroupStandings>>(
    GROUPS.map((group) => [group, computeGroupStandings(group, results)])
  );

  await logSyncStatus(supabase, "manual", "standings", "success", {
    message: "Standings recalculated from final official results.",
    checked: results.size,
    updated: standings.size,
    createdBy,
  });

  return {
    standings: Object.fromEntries(standings),
    thirdPlaced: rankThirdPlaced(standings),
  };
}

export async function updateBracketAfterResult(createdBy?: string) {
  const supabase = createServiceRoleClient();
  const results = await getOfficialResultsMap(supabase);
  const resolved = [...resolveBracket(results).values()].filter((match) => match.r !== "GS");
  const complete = resolved.filter((match) => match.result && isFinalResultStatus(match.result.status));

  await logSyncStatus(supabase, "manual", "bracket", "success", {
    message: "Bracket recalculated from final official results.",
    checked: resolved.length,
    updated: complete.length,
    createdBy,
  });

  return { knockout: resolved, complete: complete.length };
}

export async function recalculatePredictionScores(createdBy?: string) {
  const supabase = createServiceRoleClient();
  const leaderboard = await getPredictionLeaderboard(supabase);

  await logSyncStatus(supabase, "manual", "predictions", "success", {
    message: "Prediction scores recalculated from final official results.",
    checked: leaderboard.length,
    updated: leaderboard.length,
    createdBy,
  });

  return { leaderboard, users: leaderboard.length };
}

export async function getLiveMatchSnapshot(matchN: number) {
  const supabase = tryServiceClient();
  if (!supabase) return null;
  const [snapshot] = await listDbSnapshots(supabase, matchN);
  return snapshot ?? null;
}
