"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarDays, ChevronLeft, ChevronRight, Download, List } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { MATCHES } from "@/data/matches";
import { GROUPS, type GroupId } from "@/lib/types";
import { localDateKey } from "@/lib/time";
import { useLocalState } from "@/lib/store";
import { useResolvedMatches } from "@/lib/use-resolved";
import { useSlotName } from "@/components/team-label";
import { MatchCard } from "@/components/match-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type View = "month" | "list";

/** Month grid + list calendar with one-click ICS export options. */
export function CalendarExplorer() {
  const t = useTranslations("calendar");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { resolved } = useResolvedMatches();
  const local = useLocalState();
  const slotName = useSlotName();
  const [view, setView] = useState<View>("month");
  const [month, setMonth] = useState(5); // 0-based: 5 = June, 6 = July
  const [exportGroup, setExportGroup] = useState<GroupId>("A");

  const byDay = useMemo(() => {
    const map = new Map<string, number[]>();
    for (const m of MATCHES) {
      const key = localDateKey(m.t);
      map.set(key, [...(map.get(key) ?? []), m.n]);
    }
    return map;
  }, []);

  const monthDays = useMemo(() => {
    const year = 2026;
    const first = new Date(year, month, 1);
    const startWeekday = first.getDay(); // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (string | null)[] = Array(startWeekday).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(
        `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
      );
    }
    return cells;
  }, [month]);

  const weekdays = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-US", {
      weekday: "short",
    });
    // 2026-06-07 was a Sunday
    return Array.from({ length: 7 }, (_, i) =>
      fmt.format(new Date(Date.UTC(2026, 5, 7 + i, 12)))
    );
  }, [locale]);

  const monthName = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(2026, month, 15));

  const todayKey = localDateKey(new Date().toISOString());
  const icsHref = (scope: string) =>
    `/api/calendar/ics?scope=${encodeURIComponent(scope)}&locale=${locale}`;

  const sortedDays = useMemo(() => [...byDay.keys()].sort(), [byDay]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="size-5 text-primary" aria-hidden />
            {t("exportTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <a
              href={icsHref("all")}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border bg-background px-4 py-3 text-sm font-semibold transition-colors duration-200 hover:border-primary/50 hover:bg-primary/5"
            >
              <CalendarDays className="size-4 text-primary" aria-hidden />
              {t("exportAll")}
            </a>

            {local.favorites.length > 0 ? (
              <a
                href={icsHref(`teams:${local.favorites.join(",")}`)}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border bg-background px-4 py-3 text-sm font-semibold transition-colors duration-200 hover:border-primary/50 hover:bg-primary/5"
              >
                <CalendarDays className="size-4 text-primary" aria-hidden />
                {t("exportFavorites")}
              </a>
            ) : (
              <p className="flex items-center justify-center rounded-xl border border-dashed px-4 py-3 text-center text-xs text-muted-foreground">
                {t("noFavorites")}
              </p>
            )}

            <div className="flex items-stretch gap-2">
              <Select
                aria-label={t("exportGroup")}
                value={exportGroup}
                onChange={(e) => setExportGroup(e.target.value as GroupId)}
                className="h-auto"
              >
                {GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {t("exportGroup")} — {g}
                  </option>
                ))}
              </Select>
              <a
                href={icsHref(`group:${exportGroup}`)}
                aria-label={`${t("exportGroup")} ${exportGroup}`}
                className="grid cursor-pointer place-items-center rounded-xl border bg-background px-3 transition-colors duration-200 hover:border-primary/50 hover:bg-primary/5"
              >
                <Download className="size-4 text-primary" aria-hidden />
              </a>
            </div>

            {local.saved.length > 0 ? (
              <a
                href={icsHref(`matches:${local.saved.join(",")}`)}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border bg-background px-4 py-3 text-sm font-semibold transition-colors duration-200 hover:border-primary/50 hover:bg-primary/5"
              >
                <CalendarDays className="size-4 text-primary" aria-hidden />
                {t("exportSaved")}
              </a>
            ) : (
              <p className="flex items-center justify-center rounded-xl border border-dashed px-4 py-3 text-center text-xs text-muted-foreground">
                {t("noSaved")}
              </p>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{t("icsHint")}</p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant={view === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("month")}
            aria-pressed={view === "month"}
          >
            <CalendarDays aria-hidden />
            {t("month")}
          </Button>
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("list")}
            aria-pressed={view === "list"}
          >
            <List aria-hidden />
            {t("list")}
          </Button>
        </div>

        {view === "month" && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous month"
              disabled={month === 5}
              onClick={() => setMonth(5)}
            >
              <ChevronLeft className="rtl:rotate-180" aria-hidden />
            </Button>
            <span className="min-w-36 text-center font-display font-bold">{monthName}</span>
            <Button
              variant="outline"
              size="icon"
              aria-label="Next month"
              disabled={month === 6}
              onClick={() => setMonth(6)}
            >
              <ChevronRight className="rtl:rotate-180" aria-hidden />
            </Button>
          </div>
        )}
      </div>

      {view === "month" ? (
        <div className="overflow-x-auto rounded-2xl border bg-card p-3">
          <div className="grid min-w-150 grid-cols-7 gap-1.5">
            {weekdays.map((d) => (
              <p
                key={d}
                className="pb-1 text-center text-xs font-bold uppercase tracking-wide text-muted-foreground"
              >
                {d}
              </p>
            ))}
            {monthDays.map((day, i) =>
              day === null ? (
                <div key={`pad-${i}`} aria-hidden />
              ) : (
                <div
                  key={day}
                  className={cn(
                    "min-h-20 rounded-xl border p-1.5",
                    day === todayKey && "border-primary bg-primary/5"
                  )}
                >
                  <p
                    className={cn(
                      "mb-1 text-xs font-bold",
                      day === todayKey ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {Number(day.slice(8))}
                  </p>
                  <div className="space-y-1">
                    {(byDay.get(day) ?? []).map((n) => {
                      const rm = resolved.get(n)!;
                      return (
                        <Link
                          key={n}
                          href={`/matches/${n}`}
                          className="block truncate rounded-md bg-muted px-1.5 py-1 text-[11px] font-medium transition-colors duration-200 hover:bg-primary/15 hover:text-primary"
                          title={`${slotName(rm.home)} – ${slotName(rm.away)}`}
                        >
                          {slotName(rm.home)} – {slotName(rm.away)}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDays.map((day) => (
            <section key={day} aria-label={day}>
              <h2
                className={cn(
                  "mb-3 font-display text-base font-bold",
                  day === todayKey && "text-primary"
                )}
              >
                {new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-US", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                }).format(new Date(`${day}T12:00:00`))}
                {day === todayKey && ` · ${tc("today")}`}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(byDay.get(day) ?? []).map((n) => (
                  <MatchCard key={n} match={resolved.get(n)!} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
