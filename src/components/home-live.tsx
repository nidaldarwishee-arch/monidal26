"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, CalendarClock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { MATCHES } from "@/data/matches";
import { localDateKey } from "@/lib/time";
import { useResolvedMatches } from "@/lib/use-resolved";
import { Countdown } from "@/components/countdown";
import { MatchCard } from "@/components/match-card";

const FEATURED = [7, 19, 21, 66, 70, 104];

/** Countdown + today's and upcoming matches; client-only to stay timezone-true. */
export function HomeLive() {
  const t = useTranslations("home");
  const { resolved } = useResolvedMatches();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const { next, today, upcoming, featured } = useMemo(() => {
    const now = new Date();
    const todayKey = localDateKey(now.toISOString());
    const next = MATCHES.find((m) => new Date(m.t) > now);
    const today = MATCHES.filter((m) => localDateKey(m.t) === todayKey);
    const upcoming = MATCHES.filter(
      (m) => new Date(m.t) > now && localDateKey(m.t) !== todayKey
    ).slice(0, 6);
    const featured = FEATURED.map((n) => resolved.get(n)!).filter(Boolean);
    return { next, today, upcoming, featured };
  }, [resolved, mounted]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-24 animate-pulse rounded-2xl bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {next && (
        <section className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <CalendarClock className="size-4 text-primary" aria-hidden />
            {t("nextKickoff")}
          </div>
          <Countdown to={next.t} />
        </section>
      )}

      <section aria-labelledby="today-heading">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="today-heading" className="font-display text-xl font-bold">
            {today.length > 0 ? t("todayTitle") : t("upcomingTitle")}
          </h2>
          <Link
            href="/matches"
            className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            {t("viewAll")}
            <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(today.length > 0 ? today : upcoming).map((m) => (
            <MatchCard key={m.n} match={resolved.get(m.n)!} />
          ))}
        </div>
      </section>

      {today.length > 0 && upcoming.length > 0 && (
        <section aria-labelledby="upcoming-heading">
          <h2 id="upcoming-heading" className="mb-4 font-display text-xl font-bold">
            {t("upcomingTitle")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.slice(0, 3).map((m) => (
              <MatchCard key={m.n} match={resolved.get(m.n)!} />
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="featured-heading">
        <h2 id="featured-heading" className="mb-4 font-display text-xl font-bold">
          {t("featuredTitle")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((m) => (
            <MatchCard key={m.n} match={m} />
          ))}
        </div>
      </section>
    </div>
  );
}
