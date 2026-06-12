"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  Bookmark,
  Heart,
  LogOut,
  Network,
  Target,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { TEAMS, TEAM_MAP } from "@/data/teams";
import { hasKickedOff } from "@/lib/time";
import { store, useLocalState } from "@/lib/store";
import { useOfficialResults, usePredictionScore, useUser } from "@/lib/hooks";
import { useResolvedMatches } from "@/lib/use-resolved";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchCard } from "@/components/match-card";
import { TeamFlag } from "@/components/team-flag";
import { useSlotName } from "@/components/team-label";
import { CalendarExportButton } from "@/components/calendar-export-button";
import { cn } from "@/lib/utils";

export function UserDashboard() {
  const t = useTranslations("dashboard");
  const ta = useTranslations("auth");
  const locale = useLocale();
  const { user, signOut, demoMode } = useUser();
  const local = useLocalState();
  const results = useOfficialResults();
  const { resolved } = useResolvedMatches();
  const slotName = useSlotName();
  const score = usePredictionScore(local.predictions, results);

  const predictions = Object.values(local.predictions).sort((a, b) => a.matchN - b.matchN);

  if (!user) {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <UserRound className="mx-auto size-12 text-muted-foreground" aria-hidden />
        <p className="text-muted-foreground">{t("signInPrompt")}</p>
        <Link
          href="/auth"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/85"
        >
          {ta("signIn")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">
            {t("welcome", { name: user.name })}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
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

      {demoMode && (
        <p className="rounded-xl bg-accent/10 px-4 py-3 text-sm text-accent">
          {ta("demoNote")}
        </p>
      )}

      <section aria-labelledby="accuracy-heading">
        <h2 id="accuracy-heading" className="mb-3 flex items-center gap-2 font-display text-xl font-bold">
          <TrendingUp className="size-5 text-primary" aria-hidden />
          {t("accuracy")}
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="font-display text-3xl font-bold text-primary">{score.points}</p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">{t("points")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="font-display text-3xl font-bold">{score.exact}</p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">{t("exact")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="font-display text-3xl font-bold">{score.outcome}</p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">{t("outcome")}</p>
            </CardContent>
          </Card>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {t("scoredOf", { scored: score.scored })}
        </p>
      </section>

      <section aria-labelledby="fav-heading">
        <h2 id="fav-heading" className="mb-1 flex items-center gap-2 font-display text-xl font-bold">
          <Heart className="size-5 text-primary" aria-hidden />
          {t("favorites")}
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">{t("favoritesHint")}</p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8 lg:grid-cols-12">
          {TEAMS.map((team) => {
            const active = local.favorites.includes(team.id);
            return (
              <button
                key={team.id}
                aria-pressed={active}
                aria-label={locale === "ar" ? team.nameAr : team.nameEn}
                title={locale === "ar" ? team.nameAr : team.nameEn}
                onClick={() => store.toggleFavorite(team.id)}
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-1 rounded-xl border p-2 transition-colors duration-200",
                  active ? "border-primary bg-primary/10" : "hover:bg-muted"
                )}
              >
                <TeamFlag teamId={team.id} size={32} />
                <span className="w-full truncate text-center text-[10px] font-semibold">
                  {team.id}
                </span>
              </button>
            );
          })}
        </div>
        {local.favorites.length > 0 && (
          <div className="mt-3">
            <CalendarExportButton
              scope={`teams:${local.favorites.join(",")}`}
              label={t("myCalendar")}
              variant="secondary"
              size="default"
            />
          </div>
        )}
      </section>

      <section aria-labelledby="pred-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="pred-heading" className="flex items-center gap-2 font-display text-xl font-bold">
            <Target className="size-5 text-primary" aria-hidden />
            {t("myPredictions")}
          </h2>
          <Link
            href="/rounds"
            className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <Network className="size-4" aria-hidden />
            {t("myBracket")}
          </Link>
        </div>

        {predictions.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            {t("noPredictions")}
          </p>
        ) : (
          <>
            <p className="mb-3 text-xs text-muted-foreground">{t("editHint")}</p>
            <ul className="divide-y rounded-2xl border bg-card">
              {predictions.map((p) => {
                const m = resolved.get(p.matchN)!;
                const r = results.get(p.matchN);
                const locked = hasKickedOff(m.t);
                return (
                  <li key={p.matchN}>
                    <Link
                      href={`/matches/${p.matchN}`}
                      className="flex items-center justify-between gap-3 px-4 py-3 transition-colors duration-200 hover:bg-muted/50"
                    >
                      <span className="min-w-0 truncate text-sm font-medium">
                        {slotName(m.home)} – {slotName(m.away)}
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <Badge variant="accent" className="tabular-nums">
                          {p.homeGoals}:{p.awayGoals}
                        </Badge>
                        {r?.status === "played" && (
                          <Badge variant="muted" className="tabular-nums">
                            {r.homeGoals}:{r.awayGoals}
                          </Badge>
                        )}
                        {!locked && <Target className="size-3.5 text-muted-foreground" aria-hidden />}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      <section aria-labelledby="saved-heading">
        <h2 id="saved-heading" className="mb-3 flex items-center gap-2 font-display text-xl font-bold">
          <Bookmark className="size-5 text-primary" aria-hidden />
          {t("savedMatches")}
        </h2>
        {local.saved.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            {t("noPredictions")}
          </p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {local.saved
                .slice()
                .sort((a, b) => a - b)
                .map((n) => (
                  <MatchCard key={n} match={resolved.get(n)!} />
                ))}
            </div>
            <div className="mt-3">
              <CalendarExportButton
                scope={`matches:${local.saved.join(",")}`}
                label={t("myCalendar")}
                variant="secondary"
                size="default"
              />
            </div>
          </>
        )}
      </section>

      <section className="border-t pt-6">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => store.clearAll()}
        >
          {t("deleteAll")}
        </Button>
      </section>
    </div>
  );
}
