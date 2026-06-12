import type { SupabaseClient } from "@supabase/supabase-js";
import { MATCH_MAP } from "@/data/matches";
import { getPredictionLeaderboard } from "@/lib/predictions/service";
import type { Database, Json } from "@/lib/supabase/database.types";
import { isRecord, type ImportIssue } from "@/lib/fifa/importers/validation";

type DbClient = SupabaseClient<Database>;
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
type AnalyticsSessionRow = Database["public"]["Tables"]["analytics_sessions"]["Row"];
type AnalyticsEventRow = Database["public"]["Tables"]["analytics_events"]["Row"];
type ContentArticleRow = Database["public"]["Tables"]["content_articles"]["Row"];
type ContentArticleInsert = Database["public"]["Tables"]["content_articles"]["Insert"];
type ContentArticleUpdate = Database["public"]["Tables"]["content_articles"]["Update"];
type MatchRow = Database["public"]["Tables"]["matches"]["Row"];
type PredictionRow = Database["public"]["Tables"]["user_predictions"]["Row"];
type TeamRow = Database["public"]["Tables"]["teams"]["Row"];

export class SuperAdminValidationError extends Error {
  constructor(readonly issues: ImportIssue[]) {
    super("Validation failed.");
  }
}

export interface CountPoint {
  label: string;
  count: number;
}

export interface BreakdownPoint extends CountPoint {
  percentage: number;
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string | null;
  country: string | null;
  role: ProfileRow["role"];
  status: ProfileRow["status"];
  registrationDate: string;
  lastLogin: string | null;
  predictionScore: number;
  rank: number | null;
}

export interface SuperAdminDashboardData {
  generatedAt: string;
  analytics: {
    totalVisitors: number;
    visitorsToday: number;
    visitorsThisWeek: number;
    visitorsThisMonth: number;
    activeUsers: number;
    newRegistrationsToday: number;
    returningVisitors: number;
    bounceRate: number;
    averageSessionDuration: number;
    pagesPerSession: number;
    dailyVisitors: CountPoint[];
    weeklyVisitors: CountPoint[];
    monthlyVisitors: CountPoint[];
    devices: BreakdownPoint[];
    browsers: BreakdownPoint[];
    countries: BreakdownPoint[];
    languages: BreakdownPoint[];
  };
  users: {
    total: number;
    newThisWeek: number;
    activeLast30Days: number;
    suspended: number;
    admins: number;
    rows: AdminUserRow[];
  };
  predictions: {
    total: number;
    usersWithPredictions: number;
    mostPredictedMatch: CountPoint | null;
    mostPredictedTeam: CountPoint | null;
    mostSuccessfulPredictor: {
      userId: string;
      displayName: string;
      points: number;
      rank: number;
    } | null;
    averageAccuracy: number;
    byMatch: CountPoint[];
    teamPopularity: CountPoint[];
  };
  matches: {
    total: number;
    scheduled: number;
    live: number;
    halftime: number;
    finished: number;
    postponed: number;
    cancelled: number;
    predictionLocks: number;
    nextKickoff: string | null;
  };
  content: {
    total: number;
    drafts: number;
    published: number;
    archived: number;
    byType: CountPoint[];
    latest: ContentArticleRow[];
  };
  monitoring: {
    onlineUsers: number;
    livePageViews: number;
    activeMatches: number;
    livePredictions: number;
    latestSync: {
      provider: string;
      syncType: string;
      status: string;
      message: string | null;
      finishedAt: string | null;
    } | null;
  };
}

function nowIso() {
  return new Date().toISOString();
}

function subtractDays(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

function startOfUtcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfUtcMonth(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function monthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

function parseDate(value: string | null | undefined) {
  const time = value ? Date.parse(value) : NaN;
  return Number.isNaN(time) ? null : new Date(time);
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function average(values: number[]) {
  if (!values.length) return 0;
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function countBy<T>(items: T[], getKey: (item: T) => string | null | undefined) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = getKey(item)?.trim() || "unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function topCounts(counts: Map<string, number>, limit = 8): CountPoint[] {
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
}

function breakdown(counts: Map<string, number>, total: number, limit = 8): BreakdownPoint[] {
  return topCounts(counts, limit).map((item) => ({
    ...item,
    percentage: total ? clampPercent((item.count / total) * 100) : 0,
  }));
}

function visitorsInRange(sessions: AnalyticsSessionRow[], start: Date, end?: Date) {
  const visitors = new Set<string>();
  for (const session of sessions) {
    const startedAt = parseDate(session.started_at);
    if (!startedAt || startedAt < start || (end && startedAt >= end)) continue;
    visitors.add(session.visitor_id);
  }
  return visitors.size;
}

function seriesByDay(sessions: AnalyticsSessionRow[], days = 14): CountPoint[] {
  const start = startOfUtcDay(subtractDays(days - 1));
  const buckets = new Map<string, Set<string>>();
  for (let i = 0; i < days; i += 1) {
    const bucketDate = new Date(start);
    bucketDate.setUTCDate(start.getUTCDate() + i);
    buckets.set(dateKey(bucketDate), new Set());
  }

  for (const session of sessions) {
    const startedAt = parseDate(session.started_at);
    if (!startedAt || startedAt < start) continue;
    buckets.get(dateKey(startedAt))?.add(session.visitor_id);
  }

  return [...buckets.entries()].map(([label, visitors]) => ({ label, count: visitors.size }));
}

function seriesByWeek(sessions: AnalyticsSessionRow[], weeks = 8): CountPoint[] {
  const today = startOfUtcDay();
  const firstStart = new Date(today);
  firstStart.setUTCDate(firstStart.getUTCDate() - (weeks - 1) * 7);

  return Array.from({ length: weeks }, (_, index) => {
    const start = new Date(firstStart);
    start.setUTCDate(firstStart.getUTCDate() + index * 7);
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 7);
    return {
      label: dateKey(start),
      count: visitorsInRange(sessions, start, end),
    };
  });
}

function seriesByMonth(sessions: AnalyticsSessionRow[], months = 12): CountPoint[] {
  const current = startOfUtcMonth();
  const firstStart = new Date(current);
  firstStart.setUTCMonth(firstStart.getUTCMonth() - (months - 1));
  const buckets = new Map<string, Set<string>>();
  for (let i = 0; i < months; i += 1) {
    const date = new Date(firstStart);
    date.setUTCMonth(firstStart.getUTCMonth() + i);
    buckets.set(monthKey(date), new Set());
  }

  for (const session of sessions) {
    const startedAt = parseDate(session.started_at);
    if (!startedAt || startedAt < firstStart) continue;
    buckets.get(monthKey(startedAt))?.add(session.visitor_id);
  }

  return [...buckets.entries()].map(([label, visitors]) => ({ label, count: visitors.size }));
}

function matchLabel(matchN: number) {
  const match = MATCH_MAP[matchN];
  return match ? `Match ${matchN}: ${match.h} vs ${match.a}` : `Match ${matchN}`;
}

function getString(body: Record<string, unknown>, keys: string[], field: string, issues: ImportIssue[], required = false) {
  const value = keys.map((key) => body[key]).find((item) => item !== undefined);
  if (value === undefined || value === null || value === "") {
    if (required) issues.push({ index: -1, field, message: "Required string is missing." });
    return undefined;
  }
  if (typeof value !== "string") {
    issues.push({ index: -1, field, message: "Expected a string." });
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed && required) {
    issues.push({ index: -1, field, message: "Required string is missing." });
    return undefined;
  }
  return trimmed || null;
}

function getNullableNumber(body: Record<string, unknown>, keys: string[], field: string, issues: ImportIssue[]) {
  const value = keys.map((key) => body[key]).find((item) => item !== undefined);
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isInteger(parsed)) {
    issues.push({ index: -1, field, message: "Expected an integer or null." });
    return undefined;
  }
  return parsed;
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function listAdminUsers(supabase: DbClient): Promise<AdminUserRow[]> {
  const [profilesResponse, leaderboard] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200),
    getPredictionLeaderboard(supabase),
  ]);

  if (profilesResponse.error) throw new Error(profilesResponse.error.message);

  const byUser = new Map(leaderboard.map((entry) => [entry.userId, entry]));
  return (profilesResponse.data ?? []).map((profile) => {
    const entry = byUser.get(profile.id);
    return {
      id: profile.id,
      name: profile.display_name ?? profile.email ?? "User",
      email: profile.email,
      country: profile.country,
      role: profile.role,
      status: profile.status,
      registrationDate: profile.created_at,
      lastLogin: profile.last_login_at,
      predictionScore: entry?.summary.points ?? 0,
      rank: entry?.rank ?? null,
    };
  });
}

export async function updateAdminUser(
  supabase: DbClient,
  actorUserId: string,
  targetUserId: string,
  payload: unknown
) {
  if (!isRecord(payload)) {
    throw new SuperAdminValidationError([{ index: -1, message: "Expected an object payload." }]);
  }

  const update: ProfileUpdate = {};
  const role = payload.role;
  const status = payload.status;

  if (role !== undefined) {
    if (role !== "user" && role !== "admin") {
      throw new SuperAdminValidationError([{ index: -1, field: "role", message: "Expected user or admin." }]);
    }
    if (actorUserId === targetUserId && role !== "admin") {
      throw new SuperAdminValidationError([{ index: -1, field: "role", message: "Admins cannot demote themselves." }]);
    }
    update.role = role;
  }

  if (status !== undefined) {
    if (status !== "active" && status !== "suspended" && status !== "deleted") {
      throw new SuperAdminValidationError([
        { index: -1, field: "status", message: "Expected active, suspended, or deleted." },
      ]);
    }
    if (actorUserId === targetUserId && status !== "active") {
      throw new SuperAdminValidationError([{ index: -1, field: "status", message: "Admins cannot suspend themselves." }]);
    }
    update.status = status;
    update.suspended_at = status === "suspended" ? nowIso() : null;
  }

  if (typeof payload.suspended_reason === "string") {
    update.suspended_reason = payload.suspended_reason.trim() || null;
  }
  if (status === "active") update.suspended_reason = null;

  if (!Object.keys(update).length) {
    throw new SuperAdminValidationError([{ index: -1, message: "No supported fields were provided." }]);
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", targetUserId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteAdminUser(supabase: DbClient, actorUserId: string, targetUserId: string) {
  if (actorUserId === targetUserId) {
    throw new SuperAdminValidationError([{ index: -1, message: "Admins cannot delete themselves." }]);
  }

  const { error } = await supabase.auth.admin.deleteUser(targetUserId);
  if (error) throw new Error(error.message);

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ status: "deleted" })
    .eq("id", targetUserId);
  if (profileError) throw new Error(profileError.message);
}

export async function listContentArticles(supabase: DbClient) {
  const { data, error } = await supabase
    .from("content_articles")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return data ?? [];
}

function parseContentPayload(
  payload: unknown,
  authorId: string
): { id: string; row: ContentArticleInsert | ContentArticleUpdate } {
  if (!isRecord(payload)) {
    throw new SuperAdminValidationError([{ index: -1, message: "Expected an object payload." }]);
  }

  const issues: ImportIssue[] = [];
  const id = typeof payload.id === "string" ? payload.id.trim() : "";
  const update: ContentArticleUpdate = {};

  const slug = getString(payload, ["slug"], "slug", issues);
  if (slug !== undefined) update.slug = normalizeSlug(slug ?? "");

  const contentType = getString(payload, ["content_type", "contentType"], "content_type", issues);
  if (contentType !== undefined) {
    if (contentType !== "news" && contentType !== "match" && contentType !== "team" && contentType !== "stadium") {
      issues.push({ index: -1, field: "content_type", message: "Expected news, match, team, or stadium." });
    } else {
      update.content_type = contentType;
    }
  }

  const status = getString(payload, ["status"], "status", issues);
  if (status !== undefined) {
    if (status !== "draft" && status !== "published" && status !== "archived") {
      issues.push({ index: -1, field: "status", message: "Expected draft, published, or archived." });
    } else {
      update.status = status;
      update.published_at = status === "published" ? nowIso() : null;
    }
  }

  const titleEn = getString(payload, ["title_en", "titleEn", "title"], "title_en", issues);
  if (titleEn !== undefined) update.title_en = titleEn ?? "";
  const titleAr = getString(payload, ["title_ar", "titleAr"], "title_ar", issues);
  if (titleAr !== undefined) update.title_ar = titleAr;
  const excerptEn = getString(payload, ["excerpt_en", "excerptEn"], "excerpt_en", issues);
  if (excerptEn !== undefined) update.excerpt_en = excerptEn;
  const excerptAr = getString(payload, ["excerpt_ar", "excerptAr"], "excerpt_ar", issues);
  if (excerptAr !== undefined) update.excerpt_ar = excerptAr;
  const bodyEn = getString(payload, ["body_en", "bodyEn", "body"], "body_en", issues);
  if (bodyEn !== undefined) update.body_en = bodyEn ?? "";
  const bodyAr = getString(payload, ["body_ar", "bodyAr"], "body_ar", issues);
  if (bodyAr !== undefined) update.body_ar = bodyAr;

  const matchN = getNullableNumber(payload, ["match_n", "matchN"], "match_n", issues);
  if (matchN !== undefined) update.match_n = matchN;

  const teamId = getString(payload, ["team_id", "teamId"], "team_id", issues);
  if (teamId !== undefined) update.team_id = teamId;
  const venueId = getString(payload, ["venue_id", "venueId"], "venue_id", issues);
  if (venueId !== undefined) update.venue_id = venueId;

  if (!id) {
    if (!update.slug) issues.push({ index: -1, field: "slug", message: "Slug is required." });
    if (!update.title_en) issues.push({ index: -1, field: "title_en", message: "English title is required." });
    if (!update.body_en) issues.push({ index: -1, field: "body_en", message: "English body is required." });
    if (issues.length) throw new SuperAdminValidationError(issues);

    return {
      id: "",
      row: {
        slug: update.slug!,
        content_type: update.content_type ?? "news",
        status: update.status ?? "draft",
        title_en: update.title_en!,
        title_ar: update.title_ar ?? null,
        excerpt_en: update.excerpt_en ?? null,
        excerpt_ar: update.excerpt_ar ?? null,
        body_en: update.body_en!,
        body_ar: update.body_ar ?? null,
        match_n: update.match_n ?? null,
        team_id: update.team_id ?? null,
        venue_id: update.venue_id ?? null,
        author_id: authorId,
        published_at: update.status === "published" ? (update.published_at ?? nowIso()) : null,
      },
    };
  }

  if (!Object.keys(update).length) {
    issues.push({ index: -1, message: "No supported fields were provided." });
  }

  if (issues.length) throw new SuperAdminValidationError(issues);
  return { id, row: update };
}

export async function upsertContentArticle(supabase: DbClient, authorId: string, payload: unknown) {
  const { id, row } = parseContentPayload(payload, authorId);

  if (id) {
    const { data, error } = await supabase
      .from("content_articles")
      .update(row)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  const { data, error } = await supabase
    .from("content_articles")
    .insert(row as ContentArticleInsert)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteContentArticle(supabase: DbClient, id: string) {
  const { error } = await supabase.from("content_articles").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

async function loadDashboardRows(supabase: DbClient) {
  const [
    sessions,
    events,
    profiles,
    predictions,
    matches,
    articles,
    teams,
    presence,
    syncLogs,
    leaderboard,
  ] = await Promise.all([
    supabase.from("analytics_sessions").select("*").order("started_at", { ascending: false }).limit(5000),
    supabase.from("analytics_events").select("*").order("created_at", { ascending: false }).limit(5000),
    supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(1000),
    supabase.from("user_predictions").select("*").order("updated_at", { ascending: false }).limit(10000),
    supabase.from("matches").select("*").order("kickoff_at", { ascending: true }),
    supabase.from("content_articles").select("*").order("updated_at", { ascending: false }).limit(100),
    supabase.from("teams").select("*"),
    supabase.from("user_presence").select("*").order("last_seen_at", { ascending: false }).limit(1000),
    supabase.from("live_score_sync_logs").select("*").order("created_at", { ascending: false }).limit(1),
    getPredictionLeaderboard(supabase),
  ]);

  for (const response of [sessions, events, profiles, predictions, matches, articles, teams, presence, syncLogs]) {
    if (response.error) throw new Error(response.error.message);
  }

  return {
    sessions: sessions.data ?? [],
    events: events.data ?? [],
    profiles: profiles.data ?? [],
    predictions: predictions.data ?? [],
    matches: matches.data ?? [],
    articles: articles.data ?? [],
    teams: teams.data ?? [],
    presence: presence.data ?? [],
    syncLogs: syncLogs.data ?? [],
    leaderboard,
  };
}

function buildAnalytics(
  sessions: AnalyticsSessionRow[],
  profiles: ProfileRow[],
  presence: { last_seen_at: string }[]
) {
  const today = startOfUtcDay();
  const weekStart = subtractDays(7);
  const monthStart = startOfUtcMonth();
  const activeCutoff = subtractDays(0);
  activeCutoff.setUTCMinutes(activeCutoff.getUTCMinutes() - 5);

  const visitorCounts = countBy(sessions, (session) => session.visitor_id);
  const returningVisitors = [...visitorCounts.values()].filter((count) => count > 1).length;
  const bounceSessions = sessions.filter((session) => session.bounced || session.page_views <= 1).length;
  const recentPresence = presence.filter((item) => {
    const seenAt = parseDate(item.last_seen_at);
    return seenAt ? seenAt >= activeCutoff : false;
  }).length;
  const recentSessionUsers = new Set(
    sessions
      .filter((session) => {
        const seenAt = parseDate(session.last_seen_at);
        return seenAt ? seenAt >= activeCutoff : false;
      })
      .map((session) => session.user_id ?? session.visitor_id)
  ).size;

  return {
    totalVisitors: new Set(sessions.map((session) => session.visitor_id)).size,
    visitorsToday: visitorsInRange(sessions, today),
    visitorsThisWeek: visitorsInRange(sessions, weekStart),
    visitorsThisMonth: visitorsInRange(sessions, monthStart),
    activeUsers: Math.max(recentPresence, recentSessionUsers),
    newRegistrationsToday: profiles.filter((profile) => {
      const createdAt = parseDate(profile.created_at);
      return createdAt ? createdAt >= today : false;
    }).length,
    returningVisitors,
    bounceRate: sessions.length ? clampPercent((bounceSessions / sessions.length) * 100) : 0,
    averageSessionDuration: average(sessions.map((session) => session.duration_seconds)),
    pagesPerSession: sessions.length ? Number((sum(sessions.map((session) => session.page_views)) / sessions.length).toFixed(1)) : 0,
    dailyVisitors: seriesByDay(sessions),
    weeklyVisitors: seriesByWeek(sessions),
    monthlyVisitors: seriesByMonth(sessions),
    devices: breakdown(countBy(sessions, (session) => session.device_type), sessions.length),
    browsers: breakdown(countBy(sessions, (session) => session.browser), sessions.length),
    countries: breakdown(countBy(sessions, (session) => session.country), sessions.length),
    languages: breakdown(countBy(sessions, (session) => session.language), sessions.length),
  };
}

function buildUserSummary(profiles: ProfileRow[], users: AdminUserRow[]) {
  const sevenDaysAgo = subtractDays(7);
  const thirtyDaysAgo = subtractDays(30);
  return {
    total: profiles.length,
    newThisWeek: profiles.filter((profile) => {
      const createdAt = parseDate(profile.created_at);
      return createdAt ? createdAt >= sevenDaysAgo : false;
    }).length,
    activeLast30Days: profiles.filter((profile) => {
      const lastLogin = parseDate(profile.last_login_at);
      return lastLogin ? lastLogin >= thirtyDaysAgo : false;
    }).length,
    suspended: profiles.filter((profile) => profile.status === "suspended").length,
    admins: profiles.filter((profile) => profile.role === "admin").length,
    rows: users,
  };
}

function buildPredictionAnalytics(predictions: PredictionRow[], teams: TeamRow[], leaderboard: Awaited<ReturnType<typeof getPredictionLeaderboard>>) {
  const usersWithPredictions = new Set(predictions.map((prediction) => prediction.user_id)).size;
  const byMatch = countBy(predictions, (prediction) => String(prediction.match_n));
  const byTeam = countBy(
    predictions.filter((prediction) => prediction.winner_team_id),
    (prediction) => prediction.winner_team_id
  );
  const teamNames = new Map(teams.map((team) => [team.id, team.name_en]));
  const scoredEntries = leaderboard.filter((entry) => entry.summary.scored > 0);
  const accuracyValues = scoredEntries.map((entry) =>
    ((entry.summary.exact + entry.summary.outcome) / entry.summary.scored) * 100
  );
  const topMatch = topCounts(byMatch, 1)[0] ?? null;
  const topTeam = topCounts(byTeam, 1)[0] ?? null;
  const leader = leaderboard[0] ?? null;

  return {
    total: predictions.length,
    usersWithPredictions,
    mostPredictedMatch: topMatch ? { label: matchLabel(Number(topMatch.label)), count: topMatch.count } : null,
    mostPredictedTeam: topTeam
      ? { label: teamNames.get(topTeam.label) ?? topTeam.label, count: topTeam.count }
      : null,
    mostSuccessfulPredictor: leader
      ? {
          userId: leader.userId,
          displayName: leader.displayName,
          points: leader.summary.points,
          rank: leader.rank,
        }
      : null,
    averageAccuracy: average(accuracyValues),
    byMatch: topCounts(byMatch, 10).map((item) => ({
      label: matchLabel(Number(item.label)),
      count: item.count,
    })),
    teamPopularity: topCounts(byTeam, 10).map((item) => ({
      label: teamNames.get(item.label) ?? item.label,
      count: item.count,
    })),
  };
}

function buildMatchSummary(matches: MatchRow[]) {
  const now = new Date();
  const next = matches.find((match) => parseDate(match.kickoff_at) && parseDate(match.kickoff_at)! >= now);
  return {
    total: matches.length,
    scheduled: matches.filter((match) => match.status === "scheduled").length,
    live: matches.filter((match) => match.status === "live").length,
    halftime: matches.filter((match) => match.status === "halftime").length,
    finished: matches.filter((match) => match.status === "finished" || match.status === "played").length,
    postponed: matches.filter((match) => match.status === "postponed").length,
    cancelled: matches.filter((match) => match.status === "cancelled").length,
    predictionLocks: matches.filter((match) => {
      const kickoff = parseDate(match.kickoff_at);
      return kickoff ? kickoff <= now : false;
    }).length,
    nextKickoff: next?.kickoff_at ?? null,
  };
}

function buildContentSummary(articles: ContentArticleRow[]) {
  return {
    total: articles.length,
    drafts: articles.filter((article) => article.status === "draft").length,
    published: articles.filter((article) => article.status === "published").length,
    archived: articles.filter((article) => article.status === "archived").length,
    byType: topCounts(countBy(articles, (article) => article.content_type), 4),
    latest: articles.slice(0, 8),
  };
}

function buildMonitoring(
  events: AnalyticsEventRow[],
  matches: MatchRow[],
  predictions: PredictionRow[],
  presence: { last_seen_at: string }[],
  syncLogs: {
    provider: string;
    sync_type: string;
    status: string;
    message: string | null;
    finished_at: string | null;
  }[]
) {
  const cutoff = subtractDays(0);
  cutoff.setUTCMinutes(cutoff.getUTCMinutes() - 5);
  const onlineUsers = presence.filter((item) => {
    const seenAt = parseDate(item.last_seen_at);
    return seenAt ? seenAt >= cutoff : false;
  }).length;
  const livePageViews = events.filter((event) => {
    const createdAt = parseDate(event.created_at);
    return createdAt ? createdAt >= cutoff && event.event_name === "page_view" : false;
  }).length;
  const livePredictions = predictions.filter((prediction) => {
    const updatedAt = parseDate(prediction.updated_at);
    return updatedAt ? updatedAt >= cutoff : false;
  }).length;
  const latestSync = syncLogs[0];

  return {
    onlineUsers,
    livePageViews,
    activeMatches: matches.filter((match) => match.status === "live" || match.status === "halftime").length,
    livePredictions,
    latestSync: latestSync
      ? {
          provider: latestSync.provider,
          syncType: latestSync.sync_type,
          status: latestSync.status,
          message: latestSync.message,
          finishedAt: latestSync.finished_at,
        }
      : null,
  };
}

export async function getSuperAdminDashboard(supabase: DbClient): Promise<SuperAdminDashboardData> {
  const rows = await loadDashboardRows(supabase);
  const users = await listAdminUsers(supabase);

  return {
    generatedAt: nowIso(),
    analytics: buildAnalytics(rows.sessions, rows.profiles, rows.presence),
    users: buildUserSummary(rows.profiles, users),
    predictions: buildPredictionAnalytics(rows.predictions, rows.teams, rows.leaderboard),
    matches: buildMatchSummary(rows.matches),
    content: buildContentSummary(rows.articles),
    monitoring: buildMonitoring(rows.events, rows.matches, rows.predictions, rows.presence, rows.syncLogs),
  };
}

export function toJsonDetail(value: unknown): Json {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) return value.map(toJsonDetail);
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, toJsonDetail(item)])
    ) as Json;
  }
  return null;
}
