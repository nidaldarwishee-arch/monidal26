"use client";

import { useLocale, useTranslations } from "next-intl";
import { Bookmark, MapPin, Target } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { ResolvedMatch } from "@/lib/types";
import { VENUE_MAP } from "@/data/venues";
import { formatDate, formatTime, hasKickedOff } from "@/lib/time";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TeamLabel } from "@/components/team-label";
import { CalendarExportButton } from "@/components/calendar-export-button";
import { store, useLocalState } from "@/lib/store";

function TeamRow({
  match,
  side,
}: {
  match: ResolvedMatch;
  side: "home" | "away";
}) {
  const slot = side === "home" ? match.home : match.away;
  const r = match.result;
  const goals = r ? (side === "home" ? r.homeGoals : r.awayGoals) : undefined;
  const winner =
    r &&
    (r.homeGoals !== r.awayGoals
      ? (r.homeGoals > r.awayGoals) === (side === "home")
      : r.winner !== undefined && r.winner === slot.teamId);

  return (
    <div className="flex items-center justify-between gap-2">
      <TeamLabel slot={slot} bold={Boolean(winner)} flagSize={30} className="text-base" />
      {goals !== undefined && (
        <span
          className={cn(
            "min-w-7 text-center font-display text-xl font-bold tabular-nums",
            winner ? "text-primary" : "text-foreground"
          )}
        >
          {goals}
        </span>
      )}
    </div>
  );
}

/** Large, readable match card used across the app. */
export function MatchCard({
  match,
  showActions = true,
  className,
}: {
  match: ResolvedMatch;
  showActions?: boolean;
  className?: string;
}) {
  const t = useTranslations("match");
  const tr = useTranslations("rounds");
  const locale = useLocale();
  const venue = VENUE_MAP[match.v];
  const local = useLocalState();
  const saved = local.saved.includes(match.n);
  const kickedOff = hasKickedOff(match.t);
  const live = match.result?.status === "live";
  const finished = match.result?.status === "played";

  return (
    <article
      className={cn(
        "group rounded-2xl border bg-card p-4 shadow-sm transition-colors duration-200 hover:border-primary/40",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="muted">{t("matchN", { n: match.n })}</Badge>
          <Badge>{match.g ? t("group", { g: match.g }) : tr(match.r)}</Badge>
          {live && (
            <Badge variant="live">
              <span className="size-1.5 animate-live rounded-full bg-live" aria-hidden />
              {t("live")}
            </Badge>
          )}
          {finished && <Badge variant="muted">{t("fullTime")}</Badge>}
        </div>
        <time dateTime={match.t} className="font-medium text-muted-foreground">
          {formatDate(match.t, locale)} · {formatTime(match.t, locale)}
        </time>
      </div>

      <Link
        href={`/matches/${match.n}`}
        className="mt-3 block space-y-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={t("details")}
      >
        <TeamRow match={match} side="home" />
        <TeamRow match={match} side="away" />
      </Link>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="size-3.5 shrink-0" aria-hidden />
        <span className="truncate">
          {locale === "ar" ? venue.nameAr : venue.nameEn} ·{" "}
          {locale === "ar" ? venue.cityAr : venue.cityEn}
        </span>
      </div>

      {showActions && (
        <div className="mt-3 flex items-center gap-2 border-t pt-3">
          <CalendarExportButton scope={`matches:${match.n}`} match={match} />
          {!kickedOff && (
            <Link
              href={`/matches/${match.n}#predict`}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-primary transition-colors duration-200 hover:bg-primary/10"
            >
              <Target className="size-4" aria-hidden />
              {t("predict")}
            </Link>
          )}
          <button
            aria-label={t("saveMatch")}
            aria-pressed={saved}
            onClick={() => store.toggleSaved(match.n)}
            className={cn(
              "ms-auto cursor-pointer rounded-lg p-2 transition-colors duration-200 hover:bg-muted",
              saved ? "text-accent" : "text-muted-foreground"
            )}
          >
            <Bookmark className={cn("size-4", saved && "fill-current")} aria-hidden />
          </button>
        </div>
      )}
    </article>
  );
}
