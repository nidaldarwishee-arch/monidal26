"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, Check, MapPin, Share2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { MATCHES } from "@/data/matches";
import { VENUE_MAP } from "@/data/venues";
import { nextMatchOf, relatedMatches } from "@/lib/bracket";
import { formatKickoff, hasKickedOff } from "@/lib/time";
import { useLocalState } from "@/lib/store";
import { useResolvedMatches } from "@/lib/use-resolved";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamLabel, useSlotName } from "@/components/team-label";
import { MatchCard } from "@/components/match-card";
import { PredictionForm } from "@/components/prediction-form";
import { CalendarExportButton } from "@/components/calendar-export-button";
import { cn } from "@/lib/utils";

export function MatchDetail({ matchN }: { matchN: number }) {
  const t = useTranslations("match");
  const tr = useTranslations("rounds");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { resolved } = useResolvedMatches();
  const local = useLocalState();
  const slotName = useSlotName();
  const [copied, setCopied] = useState(false);

  const match = resolved.get(matchN)!;
  const venue = VENUE_MAP[match.v];
  const r = match.result;
  const prediction = local.predictions[matchN];
  const { winnerTo, loserTo } = nextMatchOf(matchN);
  const feeders = relatedMatches(match);
  const groupMeetings = match.g
    ? MATCHES.filter((m) => m.g === match.g && m.r === "GS" && m.n !== matchN)
    : [];

  const share = async () => {
    const url = window.location.href;
    const title = `${slotName(match.home)} ${tc("vs")} ${slotName(match.away)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user cancelled — fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/matches"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors duration-200 hover:text-foreground"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
        {tc("backToMatches")}
      </Link>

      <Card className="overflow-hidden">
        <div className="pitch-grid border-b bg-muted/30 p-6 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge variant="muted">{t("matchN", { n: match.n })}</Badge>
            <Badge>{match.g ? t("group", { g: match.g }) : tr(match.r)}</Badge>
            {r?.status === "live" && (
              <Badge variant="live">
                <span className="size-1.5 animate-live rounded-full bg-live" aria-hidden />
                {t("live")}
              </Badge>
            )}
            {r?.status === "played" && <Badge variant="muted">{t("fullTime")}</Badge>}
          </div>

          <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="flex flex-col items-center gap-2">
              <TeamLabel
                slot={match.home}
                flagSize={56}
                bold
                className="flex-col text-center [&>span:last-child]:whitespace-normal"
              />
            </div>
            <div className="font-display text-4xl font-bold tabular-nums">
              {r ? (
                <span>
                  {r.homeGoals}
                  <span className="mx-1 text-muted-foreground">:</span>
                  {r.awayGoals}
                </span>
              ) : (
                <span className="text-2xl text-muted-foreground">{tc("vs")}</span>
              )}
            </div>
            <div className="flex flex-col items-center gap-2">
              <TeamLabel
                slot={match.away}
                flagSize={56}
                bold
                className="flex-col text-center [&>span:last-child]:whitespace-normal"
              />
            </div>
          </div>

          {r && r.homeGoals === r.awayGoals && r.winner && (
            <p className="mt-3 text-sm font-medium text-primary">
              {slotName(r.winner === match.home.teamId ? match.home : match.away)} ✓
            </p>
          )}
        </div>

        <CardContent className="space-y-4 p-6">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-muted/50 p-3">
              <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {t("yourTime")}
              </dt>
              <dd className="mt-1 font-semibold">
                {formatKickoff(match.t, locale, { dateStyle: "full" })}
              </dd>
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {t("venueTime")}
              </dt>
              <dd className="mt-1 font-semibold">
                {formatKickoff(match.t, locale, { dateStyle: "full", tz: venue.tz })}
              </dd>
            </div>
          </dl>

          <Link
            href="/map"
            className="flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold transition-colors duration-200 hover:border-primary/50 hover:bg-primary/5"
          >
            <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
            {locale === "ar" ? venue.nameAr : venue.nameEn} ·{" "}
            {locale === "ar" ? venue.cityAr : venue.cityEn} · {venue.country}
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <CalendarExportButton scope={`matches:${match.n}`} match={match} variant="default" size="default" />
            <Button variant="outline" onClick={share}>
              {copied ? <Check aria-hidden /> : <Share2 aria-hidden />}
              {copied ? t("shareCopied") : t("share")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {(winnerTo || loserTo) && (
        <Card>
          <CardHeader>
            <CardTitle>{t("relatedMatches")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {winnerTo && (
              <Link
                href={`/matches/${winnerTo}`}
                className="flex items-center justify-between rounded-xl border p-3 text-sm font-semibold transition-colors duration-200 hover:border-primary/50 hover:bg-primary/5"
              >
                <span>
                  {t("winnerAdvances", {
                    match: `${tr(resolved.get(winnerTo)!.r)} · M${winnerTo}`,
                  })}
                </span>
                <ArrowLeft className="size-4 rotate-180 rtl:rotate-0" aria-hidden />
              </Link>
            )}
            {loserTo && (
              <Link
                href={`/matches/${loserTo}`}
                className="flex items-center justify-between rounded-xl border p-3 text-sm font-semibold transition-colors duration-200 hover:border-primary/50 hover:bg-primary/5"
              >
                <span>
                  {t("loserGoesTo", {
                    match: `${tr(resolved.get(loserTo)!.r)} · M${loserTo}`,
                  })}
                </span>
                <ArrowLeft className="size-4 rotate-180 rtl:rotate-0" aria-hidden />
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {prediction && (
        <div
          className={cn(
            "flex items-center justify-between rounded-2xl border p-4",
            "border-accent/40 bg-accent/5"
          )}
        >
          <p className="text-sm font-semibold">{t("yourPrediction")}</p>
          <p className="font-display text-xl font-bold tabular-nums">
            {prediction.homeGoals} : {prediction.awayGoals}
          </p>
        </div>
      )}

      {!hasKickedOff(match.t) && <PredictionForm match={match} />}

      {feeders.length > 0 && (
        <section aria-label={t("qualifiedVia")}>
          <h2 className="mb-3 font-display text-lg font-bold">{t("qualifiedVia")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {feeders.map((m) => (
              <MatchCard key={m.n} match={resolved.get(m.n)!} showActions={false} />
            ))}
          </div>
        </section>
      )}

      {groupMeetings.length > 0 && (
        <section aria-label={t("headToHead")}>
          <h2 className="mb-3 font-display text-lg font-bold">{t("headToHead")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {groupMeetings.map((m) => (
              <MatchCard key={m.n} match={resolved.get(m.n)!} showActions={false} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
