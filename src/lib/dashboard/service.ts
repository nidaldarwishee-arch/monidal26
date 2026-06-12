import type { SupabaseClient, User } from "@supabase/supabase-js";
import { MATCH_MAP } from "@/data/matches";
import { getOfficialResultsMap, getPredictionLeaderboard, listUserPredictions } from "@/lib/predictions/service";
import { scorePredictions, type ScoredPrediction } from "@/lib/predictions/scoring";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { hasKickedOff } from "@/lib/time";
import { isFinalResultStatus, type Prediction } from "@/lib/types";
import type { Database, Json } from "@/lib/supabase/database.types";

type DbClient = SupabaseClient<Database>;
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type FavoriteTeamRow = Database["public"]["Tables"]["user_favorite_teams"]["Row"];
type SavedMatchRow = Database["public"]["Tables"]["user_saved_matches"]["Row"];
type NotificationPreferencesRow =
  Database["public"]["Tables"]["user_notification_preferences"]["Row"];
type DashboardStatsRow = Database["public"]["Tables"]["user_dashboard_stats"]["Row"];
type AchievementKey =
  Database["public"]["Tables"]["user_achievements"]["Row"]["achievement_key"];
export type DashboardStatField = keyof Pick<
  DashboardStatsRow,
  | "matches_viewed"
  | "pages_viewed"
  | "time_spent_seconds"
  | "favorite_team_activity"
  | "prediction_submissions"
  | "calendar_exports"
  | "language_changes"
>;

export interface AchievementState {
  key: AchievementKey;
  label: string;
  description: string;
  progress: number;
  target: number;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface DashboardPredictionSummary {
  total: number;
  upcoming: number;
  completed: number;
  scored: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  points: number;
  exact: number;
  outcome: number;
  leaderboardRank: number | null;
}

export interface UserDashboardData {
  profile: ProfileRow & { auth_email: string | null };
  predictions: Prediction[];
  predictionItems: ScoredPrediction[];
  predictionSummary: DashboardPredictionSummary;
  favoriteTeams: FavoriteTeamRow[];
  savedMatches: SavedMatchRow[];
  notifications: NotificationPreferencesRow;
  stats: DashboardStatsRow;
  achievements: AchievementState[];
}

const ACHIEVEMENTS: Record<AchievementKey, Omit<AchievementState, "progress" | "unlocked" | "unlockedAt">> = {
  first_prediction: {
    key: "first_prediction",
    label: "First Prediction",
    description: "Submit your first match prediction.",
    target: 1,
  },
  ten_correct_predictions: {
    key: "ten_correct_predictions",
    label: "10 Correct Predictions",
    description: "Get 10 match outcomes correct.",
    target: 10,
  },
  group_stage_expert: {
    key: "group_stage_expert",
    label: "Group Stage Expert",
    description: "Get 12 group-stage outcomes correct.",
    target: 12,
  },
  knockout_expert: {
    key: "knockout_expert",
    label: "Knockout Expert",
    description: "Get 4 knockout outcomes correct.",
    target: 4,
  },
  world_champion_predictor: {
    key: "world_champion_predictor",
    label: "World Champion Predictor",
    description: "Correctly predict the final winner.",
    target: 1,
  },
};

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeLanguage(value: unknown): "en" | "ar" {
  return value === "ar" ? "ar" : "en";
}

function scoredCorrect(items: ScoredPrediction[]) {
  return items.filter((item) => item.status === "scored" && item.outcome);
}

function achievementProgress(items: ScoredPrediction[], predictions: Prediction[]) {
  const correct = scoredCorrect(items);
  const groupCorrect = correct.filter((item) => MATCH_MAP[item.prediction.matchN]?.r === "GS").length;
  const knockoutCorrect = correct.filter((item) => MATCH_MAP[item.prediction.matchN]?.r !== "GS").length;
  const final = items.find((item) => item.prediction.matchN === 104);
  const finalCorrect =
    final?.status === "scored" &&
    final.outcome &&
    final.result &&
    isFinalResultStatus(final.result.status);

  return {
    first_prediction: predictions.length,
    ten_correct_predictions: correct.length,
    group_stage_expert: groupCorrect,
    knockout_expert: knockoutCorrect,
    world_champion_predictor: finalCorrect ? 1 : 0,
  } satisfies Record<AchievementKey, number>;
}

async function ensureDashboardRows(supabase: DbClient, userId: string) {
  await Promise.all([
    supabase
      .from("user_notification_preferences")
      .upsert({ user_id: userId }, { onConflict: "user_id" }),
    supabase.from("user_dashboard_stats").upsert({ user_id: userId }, { onConflict: "user_id" }),
  ]);
}

async function loadProfile(supabase: DbClient, user: User) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (error) throw new Error(error.message);
  return {
    ...data,
    auth_email: user.email ?? data.email,
  };
}

async function loadDashboardRows(supabase: DbClient, userId: string) {
  const [favorites, saved, notifications, stats, achievements] = await Promise.all([
    supabase
      .from("user_favorite_teams")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    supabase
      .from("user_saved_matches")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    supabase
      .from("user_notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .single(),
    supabase
      .from("user_dashboard_stats")
      .select("*")
      .eq("user_id", userId)
      .single(),
    supabase
      .from("user_achievements")
      .select("achievement_key, progress, unlocked_at")
      .eq("user_id", userId),
  ]);

  for (const response of [favorites, saved, notifications, stats, achievements]) {
    if (response.error) throw new Error(response.error.message);
  }

  return {
    favorites: favorites.data ?? [],
    saved: saved.data ?? [],
    notifications: notifications.data!,
    stats: stats.data!,
    achievements: achievements.data ?? [],
  };
}

async function syncAchievements(
  supabase: DbClient,
  userId: string,
  items: ScoredPrediction[],
  predictions: Prediction[]
): Promise<AchievementState[]> {
  const progress = achievementProgress(items, predictions);
  const unlockable = Object.entries(progress).flatMap(([key, value]) => {
    const achievementKey = key as AchievementKey;
    const definition = ACHIEVEMENTS[achievementKey];
    if (value < definition.target) return [];
    return [
      {
        user_id: userId,
        achievement_key: achievementKey,
        progress: { value, target: definition.target } as Json,
      },
    ];
  });

  if (unlockable.length) {
    const { error } = await supabase
      .from("user_achievements")
      .upsert(unlockable, { onConflict: "user_id,achievement_key", ignoreDuplicates: true });
    if (error) throw new Error(error.message);
  }

  const { data, error } = await supabase
    .from("user_achievements")
    .select("achievement_key, unlocked_at")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);

  const unlocked = new Map((data ?? []).map((item) => [item.achievement_key, item.unlocked_at]));
  return (Object.keys(ACHIEVEMENTS) as AchievementKey[]).map((key) => ({
    ...ACHIEVEMENTS[key],
    progress: Math.min(progress[key], ACHIEVEMENTS[key].target),
    unlocked: unlocked.has(key),
    unlockedAt: unlocked.get(key),
  }));
}

function predictionSummary(
  predictions: Prediction[],
  items: ScoredPrediction[],
  leaderboardRank: number | null
): DashboardPredictionSummary {
  const scored = items.filter((item) => item.status === "scored");
  const correct = scored.filter((item) => item.outcome).length;
  const exact = scored.filter((item) => item.exact).length;
  const outcome = scored.filter((item) => item.outcome && !item.exact).length;
  const completed = predictions.filter((prediction) =>
    isFinalResultStatus(items.find((item) => item.prediction.matchN === prediction.matchN)?.result?.status)
  ).length;

  return {
    total: predictions.length,
    upcoming: predictions.filter((prediction) => !hasKickedOff(MATCH_MAP[prediction.matchN]?.t ?? "")).length,
    completed,
    scored: scored.length,
    correct,
    incorrect: Math.max(0, scored.length - correct),
    accuracy: scored.length ? clampPercent((correct / scored.length) * 100) : 0,
    points: scored.reduce((total, item) => total + item.points, 0),
    exact,
    outcome,
    leaderboardRank,
  };
}

export async function touchLastLogin(supabase: DbClient, userId: string) {
  await supabase
    .from("profiles")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", userId);
}

export async function getUserDashboard(supabase: DbClient, user: User): Promise<UserDashboardData> {
  await ensureDashboardRows(supabase, user.id);
  const adminSupabase = createServiceRoleClient();
  const [profile, predictions, results, leaderboard] = await Promise.all([
    loadProfile(supabase, user),
    listUserPredictions(supabase, user.id),
    getOfficialResultsMap(supabase),
    getPredictionLeaderboard(adminSupabase),
  ]);
  const scored = scorePredictions(predictions, results);
  const rows = await loadDashboardRows(supabase, user.id);
  const rank = leaderboard.find((item) => item.userId === user.id)?.rank ?? null;
  const achievements = await syncAchievements(supabase, user.id, scored.items, predictions);

  return {
    profile,
    predictions,
    predictionItems: scored.items,
    predictionSummary: predictionSummary(predictions, scored.items, rank),
    favoriteTeams: rows.favorites,
    savedMatches: rows.saved,
    notifications: rows.notifications,
    stats: rows.stats,
    achievements,
  };
}

export async function updateDashboardProfile(
  supabase: DbClient,
  userId: string,
  payload: unknown
) {
  const body = typeof payload === "object" && payload !== null ? (payload as Record<string, unknown>) : {};
  const update: Database["public"]["Tables"]["profiles"]["Update"] = {};

  if (typeof body.displayName === "string") update.display_name = body.displayName.trim() || null;
  if (typeof body.country === "string") update.country = body.country.trim() || null;
  if (typeof body.favoriteTeamId === "string") update.favorite_team_id = body.favoriteTeamId || null;
  if (body.favoriteTeamId === null) update.favorite_team_id = null;
  if (body.preferredLanguage !== undefined) {
    update.preferred_language = normalizeLanguage(body.preferredLanguage);
  }

  if (!Object.keys(update).length) return null;

  const { data, error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function setFavoriteTeam(
  supabase: DbClient,
  userId: string,
  teamId: string,
  notificationsEnabled = true
) {
  const { data, error } = await supabase
    .from("user_favorite_teams")
    .upsert(
      { user_id: userId, team_id: teamId, notifications_enabled: notificationsEnabled },
      { onConflict: "user_id,team_id" }
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await incrementDashboardStat(supabase, userId, "favorite_team_activity", 1);
  return data;
}

export async function removeFavoriteTeam(supabase: DbClient, userId: string, teamId: string) {
  const { error } = await supabase
    .from("user_favorite_teams")
    .delete()
    .eq("user_id", userId)
    .eq("team_id", teamId);
  if (error) throw new Error(error.message);
}

export async function setSavedMatch(
  supabase: DbClient,
  userId: string,
  matchN: number,
  notificationsEnabled = true
) {
  const { data, error } = await supabase
    .from("user_saved_matches")
    .upsert(
      { user_id: userId, match_n: matchN, notifications_enabled: notificationsEnabled },
      { onConflict: "user_id,match_n" }
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function removeSavedMatch(supabase: DbClient, userId: string, matchN: number) {
  const { error } = await supabase
    .from("user_saved_matches")
    .delete()
    .eq("user_id", userId)
    .eq("match_n", matchN);
  if (error) throw new Error(error.message);
}

export async function updateNotificationPreferences(
  supabase: DbClient,
  userId: string,
  payload: unknown
) {
  const body = typeof payload === "object" && payload !== null ? (payload as Record<string, unknown>) : {};
  const update: Database["public"]["Tables"]["user_notification_preferences"]["Update"] = {};
  for (const key of ["match_reminders", "team_news", "prediction_reminders", "result_alerts"] as const) {
    if (typeof body[key] === "boolean") update[key] = body[key];
  }
  if (!Object.keys(update).length) return null;

  const { data, error } = await supabase
    .from("user_notification_preferences")
    .update(update)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function incrementDashboardStat(
  supabase: DbClient,
  userId: string,
  field: DashboardStatField,
  amount: number
) {
  await ensureDashboardRows(supabase, userId);
  const { data, error } = await supabase
    .from("user_dashboard_stats")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error) throw new Error(error.message);
  const current = typeof data?.[field] === "number" ? data[field] : 0;
  const update = { [field]: Math.max(0, current + amount) } as Database["public"]["Tables"]["user_dashboard_stats"]["Update"];
  const { error: updateError } = await supabase
    .from("user_dashboard_stats")
    .update(update)
    .eq("user_id", userId);
  if (updateError) throw new Error(updateError.message);
}
