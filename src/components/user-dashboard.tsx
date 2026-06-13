"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Award,
  Bell,
  Bookmark,
  CalendarPlus,
  Check,
  Clock,
  Flag,
  Globe2,
  Heart,
  Languages,
  LogOut,
  Medal,
  Network,
  Save,
  Target,
  TrendingUp,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { MATCHES } from "@/data/matches";
import { TEAMS, TEAM_MAP } from "@/data/teams";
import { formatKickoff, hasKickedOff } from "@/lib/time";
import { useUser } from "@/lib/hooks";
import { useResolvedMatches } from "@/lib/use-resolved";
import { isFinalResultStatus } from "@/lib/types";
import type { UserDashboardData } from "@/lib/dashboard/service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { MatchCard } from "@/components/match-card";
import { TeamFlag } from "@/components/team-flag";
import { useSlotName } from "@/components/team-label";
import { CalendarExportButton } from "@/components/calendar-export-button";
import { cn } from "@/lib/utils";

type DashboardData = UserDashboardData;

const COPY = {
  en: {
    loading: "Loading your dashboard...",
    loadError: "We couldn't load your dashboard. Please try again.",
    retry: "Try again",
    saveProfile: "Save profile",
    saved: "Saved",
    country: "Country",
    favoriteTeam: "Favorite team",
    preferredLanguage: "Preferred language",
    registrationDate: "Registration date",
    lastLogin: "Last login",
    notSet: "Not set",
    predictionCenter: "Prediction center",
    allPredictions: "All predictions",
    upcomingPredictions: "Upcoming",
    completedPredictions: "Completed",
    accuracy: "Accuracy",
    correct: "Correct",
    incorrect: "Incorrect",
    rank: "Rank",
    followTeams: "Follow teams",
    notifications: "Notifications",
    matchReminders: "Match reminders",
    teamNews: "Team news",
    predictionReminders: "Prediction reminders",
    resultAlerts: "Result alerts",
    followedMatches: "Followed matches",
    followMore: "Follow more matches",
    calendar: "Calendar",
    addGoogle: "Google Calendar",
    addApple: "Apple Calendar",
    addOutlook: "Outlook",
    statistics: "Statistics",
    matchesViewed: "Matches viewed",
    pagesViewed: "Pages viewed",
    timeSpent: "Time spent",
    favoriteActivity: "Favorite team activity",
    predictionPerformance: "Prediction performance",
    achievements: "Achievements",
    unlocked: "Unlocked",
    locked: "In progress",
    noPredictions: "No predictions yet.",
    noSaved: "No followed matches yet.",
  },
  ar: {
    loading: "جار تحميل لوحة التحكم...",
    loadError: "تعذر تحميل لوحة التحكم. حاول مرة أخرى.",
    retry: "إعادة المحاولة",
    saveProfile: "حفظ الملف",
    saved: "تم الحفظ",
    country: "الدولة",
    favoriteTeam: "المنتخب المفضل",
    preferredLanguage: "اللغة المفضلة",
    registrationDate: "تاريخ التسجيل",
    lastLogin: "آخر دخول",
    notSet: "غير محدد",
    predictionCenter: "مركز التوقعات",
    allPredictions: "كل التوقعات",
    upcomingPredictions: "قادمة",
    completedPredictions: "مكتملة",
    accuracy: "الدقة",
    correct: "صحيحة",
    incorrect: "خاطئة",
    rank: "الترتيب",
    followTeams: "متابعة المنتخبات",
    notifications: "الإشعارات",
    matchReminders: "تذكير المباريات",
    teamNews: "أخبار المنتخب",
    predictionReminders: "تذكير التوقعات",
    resultAlerts: "تنبيهات النتائج",
    followedMatches: "المباريات المتابعة",
    followMore: "متابعة مباريات أخرى",
    calendar: "التقويم",
    addGoogle: "تقويم Google",
    addApple: "تقويم Apple",
    addOutlook: "Outlook",
    statistics: "الإحصاءات",
    matchesViewed: "مشاهدات المباريات",
    pagesViewed: "مشاهدات الصفحات",
    timeSpent: "الوقت المستغرق",
    favoriteActivity: "نشاط المنتخب المفضل",
    predictionPerformance: "أداء التوقعات",
    achievements: "الإنجازات",
    unlocked: "مفتوح",
    locked: "قيد التقدم",
    noPredictions: "لا توجد توقعات بعد.",
    noSaved: "لا توجد مباريات متابعة بعد.",
  },
};

function minutesLabel(seconds: number) {
  return `${Math.round(seconds / 60)}m`;
}

function formatDateTime(value: string | null, locale: string) {
  if (!value) return null;
  return formatKickoff(value, locale, { dateStyle: "medium" });
}

async function track(field: string, amount = 1) {
  await fetch("/api/dashboard/stats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ field, amount }),
  }).catch(() => null);
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
}) {
  return (
    <Card className="rounded-lg">
      <CardContent className="flex items-center gap-3 p-4">
        <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" aria-hidden />
        </span>
        <span>
          <span className="block font-display text-2xl font-bold tabular-nums">{value}</span>
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
        </span>
      </CardContent>
    </Card>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm">
      <span className="font-medium">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 accent-primary"
      />
    </label>
  );
}

export function UserDashboard() {
  const t = useTranslations("dashboard");
  const ta = useTranslations("auth");
  const locale = useLocale();
  const copy = COPY[locale === "ar" ? "ar" : "en"];
  const { user, loading, signOut } = useUser();
  const { resolved } = useResolvedMatches();
  const slotName = useSlotName();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [profileDraft, setProfileDraft] = useState({
    displayName: "",
    country: "",
    favoriteTeamId: "",
    preferredLanguage: locale === "ar" ? "ar" : "en",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const loadDashboard = async () => {
    setLoadError(false);
    try {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      if (!response.ok) throw new Error(`Dashboard request failed (${response.status}).`);
      const payload = (await response.json()) as { dashboard: DashboardData };
      setDashboard(payload.dashboard);
      setProfileDraft({
        displayName: payload.dashboard.profile.display_name ?? "",
        country: payload.dashboard.profile.country ?? "",
        favoriteTeamId: payload.dashboard.profile.favorite_team_id ?? "",
        preferredLanguage: payload.dashboard.profile.preferred_language ?? (locale === "ar" ? "ar" : "en"),
      });
    } catch {
      setLoadError(true);
    }
  };

  // Analytics: track on mount/unmount regardless of auth state.
  useEffect(() => {
    track("pages_viewed");
    const startedAt = Date.now();
    return () => {
      const seconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
      track("time_spent_seconds", seconds);
    };
  }, []);

  // Dashboard data: only fetch once the authenticated user is confirmed.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!user) return;
    loadDashboard();
  // user.id is stable; using the object reference would cause infinite loops.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const savedSet = useMemo(
    () => new Set(dashboard?.savedMatches.map((match) => match.match_n) ?? []),
    [dashboard?.savedMatches]
  );
  const favoriteSet = useMemo(
    () => new Set(dashboard?.favoriteTeams.map((team) => team.team_id) ?? []),
    [dashboard?.favoriteTeams]
  );
  const upcomingMatches = useMemo(
    () =>
      MATCHES.filter((match) => !hasKickedOff(match.t))
        .slice(0, 8)
        .map((match) => resolved.get(match.n))
        .filter(Boolean),
    [resolved]
  );
  const predictionItems = dashboard?.predictionItems ?? [];

  if (loading) {
    return (
      <div className="mx-auto max-w-md rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        {copy.loading}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <UserRound className="mx-auto size-12 text-muted-foreground" aria-hidden />
        <p className="text-muted-foreground">{t("signInPrompt")}</p>
        <Link
          href="/login"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/85"
        >
          {ta("signIn")}
        </Link>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="mx-auto max-w-md rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        {loadError ? (
          <div className="space-y-4">
            <p role="alert">{copy.loadError}</p>
            <Button variant="outline" onClick={() => void loadDashboard()}>
              {copy.retry}
            </Button>
          </div>
        ) : (
          copy.loading
        )}
      </div>
    );
  }

  const summary = dashboard.predictionSummary;
  const profile = dashboard.profile;
  const savedMatches = dashboard.savedMatches
    .slice()
    .sort((a, b) => a.match_n - b.match_n)
    .map((item) => resolved.get(item.match_n))
    .filter(Boolean);
  const favoriteTeam = profile.favorite_team_id ? TEAM_MAP[profile.favorite_team_id] : null;

  const saveProfile = async () => {
    setSavingProfile(true);
    await fetch("/api/dashboard/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileDraft),
    }).catch(() => null);
    if (profileDraft.preferredLanguage !== profile.preferred_language) {
      await track("language_changes");
    }
    await loadDashboard();
    setSavingProfile(false);
  };

  const toggleFavorite = async (teamId: string) => {
    const active = favoriteSet.has(teamId);
    await fetch("/api/dashboard/favorite-teams", {
      method: active ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId, notificationsEnabled: true }),
    }).catch(() => null);
    await loadDashboard();
  };

  const toggleSavedMatch = async (matchN: number) => {
    const active = savedSet.has(matchN);
    await fetch("/api/dashboard/saved-matches", {
      method: active ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchN, notificationsEnabled: true }),
    }).catch(() => null);
    await loadDashboard();
  };

  const updateNotifications = async (key: keyof DashboardData["notifications"], value: boolean) => {
    await fetch("/api/dashboard/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    }).catch(() => null);
    await loadDashboard();
  };

  const followedScope = savedMatches.length
    ? `matches:${savedMatches.map((match) => match!.n).join(",")}`
    : "all";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">
            {t("welcome", { name: profile.display_name ?? user.name })}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{profile.auth_email}</p>
        </div>
        <div className="flex items-center gap-2">
          {user.role === "admin" && (
            <Link
              href="/admin"
              className="inline-flex h-9 items-center rounded-lg bg-accent/15 px-3 text-xs font-bold text-accent"
            >
              Admin
            </Link>
          )}
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut aria-hidden />
            {ta("signOut")}
          </Button>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label={copy.predictionCenter}>
        <Metric label={copy.allPredictions} value={summary.total} icon={Target} />
        <Metric label={copy.accuracy} value={`${summary.accuracy}%`} icon={TrendingUp} />
        <Metric label={copy.correct} value={summary.correct} icon={Check} />
        <Metric label={copy.rank} value={summary.leaderboardRank ? `#${summary.leaderboardRank}` : "-"} icon={Medal} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound className="size-4 text-primary" aria-hidden />
              {t("profile")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="dash-name">{ta("name")}</Label>
                <Input
                  id="dash-name"
                  value={profileDraft.displayName}
                  onChange={(event) =>
                    setProfileDraft((draft) => ({ ...draft, displayName: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dash-country">{copy.country}</Label>
                <Input
                  id="dash-country"
                  value={profileDraft.country}
                  onChange={(event) =>
                    setProfileDraft((draft) => ({ ...draft, country: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dash-favorite">{copy.favoriteTeam}</Label>
                <Select
                  id="dash-favorite"
                  value={profileDraft.favoriteTeamId}
                  onChange={(event) =>
                    setProfileDraft((draft) => ({ ...draft, favoriteTeamId: event.target.value }))
                  }
                >
                  <option value="">{copy.notSet}</option>
                  {TEAMS.map((team) => (
                    <option key={team.id} value={team.id}>
                      {locale === "ar" ? team.nameAr : team.nameEn}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dash-lang">{copy.preferredLanguage}</Label>
                <Select
                  id="dash-lang"
                  value={profileDraft.preferredLanguage}
                  onChange={(event) =>
                    setProfileDraft((draft) => ({
                      ...draft,
                      preferredLanguage: event.target.value,
                    }))
                  }
                >
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                </Select>
              </div>
            </div>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div className="rounded-lg bg-muted/50 p-3">
                <dt className="text-xs font-semibold text-muted-foreground">{copy.registrationDate}</dt>
                <dd className="mt-1 font-medium">{formatDateTime(profile.created_at, locale)}</dd>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <dt className="text-xs font-semibold text-muted-foreground">{copy.lastLogin}</dt>
                <dd className="mt-1 font-medium">
                  {formatDateTime(profile.last_login_at, locale) ?? copy.notSet}
                </dd>
              </div>
            </dl>
            {favoriteTeam && (
              <div className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                <TeamFlag teamId={favoriteTeam.id} size={28} />
                <span className="font-semibold">
                  {locale === "ar" ? favoriteTeam.nameAr : favoriteTeam.nameEn}
                </span>
              </div>
            )}
            <Button onClick={saveProfile} disabled={savingProfile}>
              {savingProfile ? <Clock aria-hidden /> : <Save aria-hidden />}
              {savingProfile ? copy.saved : copy.saveProfile}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="size-4 text-primary" aria-hidden />
              {copy.predictionCenter}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <Metric label={copy.upcomingPredictions} value={summary.upcoming} icon={Clock} />
              <Metric label={copy.completedPredictions} value={summary.completed} icon={Flag} />
              <Metric label={copy.incorrect} value={summary.incorrect} icon={Globe2} />
              <Metric label={t("points")} value={summary.points} icon={Award} />
            </div>
            {dashboard.predictions.length === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                {copy.noPredictions}
              </p>
            ) : (
              <ul className="max-h-96 divide-y overflow-auto rounded-lg border">
                {predictionItems.map((item) => {
                  const match = resolved.get(item.prediction.matchN);
                  const final = isFinalResultStatus(item.result?.status);
                  return (
                    <li key={item.prediction.matchN}>
                      <Link
                        href={`/matches/${item.prediction.matchN}`}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm transition-colors duration-200 hover:bg-muted/50"
                      >
                        <span className="min-w-0 truncate">
                          {match ? `${slotName(match.home)} vs ${slotName(match.away)}` : `M${item.prediction.matchN}`}
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <Badge variant="accent" className="tabular-nums">
                            {item.prediction.homeGoals}:{item.prediction.awayGoals}
                          </Badge>
                          {final && (
                            <Badge variant={item.outcome ? "default" : "muted"} className="tabular-nums">
                              {item.result?.homeGoals}:{item.result?.awayGoals}
                            </Badge>
                          )}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Heart className="size-4 text-primary" aria-hidden />
              {copy.followTeams}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8 lg:grid-cols-12">
              {TEAMS.map((team) => {
                const active = favoriteSet.has(team.id);
                return (
                  <button
                    key={team.id}
                    type="button"
                    aria-pressed={active}
                    aria-label={locale === "ar" ? team.nameAr : team.nameEn}
                    onClick={() => toggleFavorite(team.id)}
                    className={cn(
                      "flex cursor-pointer flex-col items-center gap-1 rounded-lg border p-2 transition-colors duration-200",
                      active ? "border-primary bg-primary/10" : "hover:bg-muted"
                    )}
                  >
                    <TeamFlag teamId={team.id} size={30} />
                    <span className="w-full truncate text-center text-[10px] font-semibold">{team.id}</span>
                  </button>
                );
              })}
            </div>
            {dashboard.favoriteTeams.length > 0 && (
              <CalendarExportButton
                scope={`teams:${dashboard.favoriteTeams.map((team) => team.team_id).join(",")}`}
                label={t("myCalendar")}
                variant="secondary"
                size="default"
                onExport={() => track("calendar_exports")}
              />
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="size-4 text-primary" aria-hidden />
              {copy.notifications}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ToggleRow
              label={copy.matchReminders}
              checked={dashboard.notifications.match_reminders}
              onChange={(value) => updateNotifications("match_reminders", value)}
            />
            <ToggleRow
              label={copy.teamNews}
              checked={dashboard.notifications.team_news}
              onChange={(value) => updateNotifications("team_news", value)}
            />
            <ToggleRow
              label={copy.predictionReminders}
              checked={dashboard.notifications.prediction_reminders}
              onChange={(value) => updateNotifications("prediction_reminders", value)}
            />
            <ToggleRow
              label={copy.resultAlerts}
              checked={dashboard.notifications.result_alerts}
              onChange={(value) => updateNotifications("result_alerts", value)}
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bookmark className="size-4 text-primary" aria-hidden />
              {copy.followedMatches}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {savedMatches.length === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                {copy.noSaved}
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {savedMatches.slice(0, 4).map((match) => (
                  <MatchCard key={match!.n} match={match!} showActions={false} />
                ))}
              </div>
            )}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase text-muted-foreground">{copy.followMore}</p>
              <div className="flex flex-wrap gap-2">
                {upcomingMatches.map((match) => (
                  <Button
                    key={match!.n}
                    variant={savedSet.has(match!.n) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleSavedMatch(match!.n)}
                  >
                    M{match!.n}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarPlus className="size-4 text-primary" aria-hidden />
              {copy.calendar}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-3">
            <CalendarExportButton
              scope={followedScope}
              label={copy.addApple}
              variant="outline"
              size="default"
              onExport={() => track("calendar_exports")}
            />
            <CalendarExportButton
              scope={followedScope}
              label={copy.addOutlook}
              variant="outline"
              size="default"
              onExport={() => track("calendar_exports")}
            />
            <Button
              variant="outline"
              onClick={() => {
                track("calendar_exports");
                window.open(`/api/calendar/ics?scope=${encodeURIComponent(followedScope)}&locale=${locale}`, "_blank");
              }}
            >
              <CalendarPlus aria-hidden />
              {copy.addGoogle}
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4 text-primary" aria-hidden />
              {copy.statistics}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <Metric label={copy.matchesViewed} value={dashboard.stats.matches_viewed} icon={Target} />
            <Metric label={copy.pagesViewed} value={dashboard.stats.pages_viewed} icon={Globe2} />
            <Metric label={copy.timeSpent} value={minutesLabel(dashboard.stats.time_spent_seconds)} icon={Clock} />
            <Metric label={copy.favoriteActivity} value={dashboard.stats.favorite_team_activity} icon={Heart} />
            <Metric label={copy.predictionPerformance} value={`${summary.accuracy}%`} icon={Network} />
            <Metric label={copy.calendar} value={dashboard.stats.calendar_exports} icon={Languages} />
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="size-4 text-primary" aria-hidden />
              {copy.achievements}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {dashboard.achievements.map((achievement) => (
              <div key={achievement.key} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{achievement.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{achievement.description}</p>
                  </div>
                  <Badge variant={achievement.unlocked ? "default" : "muted"}>
                    {achievement.unlocked ? copy.unlocked : copy.locked}
                  </Badge>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(100, (achievement.progress / achievement.target) * 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {achievement.progress}/{achievement.target}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
