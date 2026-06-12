"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FilterX } from "lucide-react";
import { MATCHES } from "@/data/matches";
import { TEAMS } from "@/data/teams";
import { VENUES } from "@/data/venues";
import { GROUPS, ROUND_ORDER, type RoundId } from "@/lib/types";
import { localDateKey } from "@/lib/time";
import { useResolvedMatches } from "@/lib/use-resolved";
import { MatchCard } from "@/components/match-card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface Filters {
  date: string;
  group: string;
  team: string;
  venue: string;
  round: string;
}

const EMPTY: Filters = { date: "", group: "", team: "", venue: "", round: "" };

/** All 104 matches with date / group / team / venue / round filters. */
export function MatchesExplorer() {
  const t = useTranslations("matches");
  const tr = useTranslations("rounds");
  const locale = useLocale();
  const { resolved } = useResolvedMatches();
  const [f, setF] = useState<Filters>(EMPTY);

  const dates = useMemo(() => {
    const set = new Set(MATCHES.map((m) => localDateKey(m.t)));
    return [...set].sort();
  }, []);

  const filtered = useMemo(() => {
    return MATCHES.filter((m) => {
      const rm = resolved.get(m.n)!;
      if (f.date && localDateKey(m.t) !== f.date) return false;
      if (f.group && m.g !== f.group) return false;
      if (f.round && m.r !== f.round) return false;
      if (f.venue && m.v !== f.venue) return false;
      if (f.team && rm.home.teamId !== f.team && rm.away.teamId !== f.team) return false;
      return true;
    });
  }, [f, resolved]);

  const active = Object.values(f).some(Boolean);
  const dateLabel = (key: string) =>
    new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(new Date(`${key}T12:00:00Z`));

  const set = (k: keyof Filters) => (e: React.ChangeEvent<HTMLSelectElement>) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="space-y-1">
          <Label htmlFor="f-date">{t("filterDate")}</Label>
          <Select id="f-date" value={f.date} onChange={set("date")}>
            <option value="">{t("all")}</option>
            {dates.map((d) => (
              <option key={d} value={d}>
                {dateLabel(d)}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="f-round">{t("filterRound")}</Label>
          <Select id="f-round" value={f.round} onChange={set("round")}>
            <option value="">{t("all")}</option>
            {ROUND_ORDER.map((r) => (
              <option key={r} value={r}>
                {tr(r as RoundId)}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="f-group">{t("filterGroup")}</Label>
          <Select id="f-group" value={f.group} onChange={set("group")}>
            <option value="">{t("all")}</option>
            {GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="f-team">{t("filterTeam")}</Label>
          <Select id="f-team" value={f.team} onChange={set("team")}>
            <option value="">{t("all")}</option>
            {[...TEAMS]
              .sort((a, b) =>
                (locale === "ar" ? a.nameAr : a.nameEn).localeCompare(
                  locale === "ar" ? b.nameAr : b.nameEn,
                  locale
                )
              )
              .map((team) => (
                <option key={team.id} value={team.id}>
                  {locale === "ar" ? team.nameAr : team.nameEn}
                </option>
              ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="f-venue">{t("filterVenue")}</Label>
          <Select id="f-venue" value={f.venue} onChange={set("venue")}>
            <option value="">{t("all")}</option>
            {VENUES.map((v) => (
              <option key={v.id} value={v.id}>
                {locale === "ar"
                  ? `${v.nameAr} — ${v.cityAr}`
                  : `${v.nameEn} — ${v.cityEn}`}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">
          {t("showing", { count: filtered.length })}
        </p>
        {active && (
          <Button variant="ghost" size="sm" onClick={() => setF(EMPTY)}>
            <FilterX aria-hidden />
            {t("clearFilters")}
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          {t("noResults")}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <MatchCard key={m.n} match={resolved.get(m.n)!} />
          ))}
        </div>
      )}
    </div>
  );
}
