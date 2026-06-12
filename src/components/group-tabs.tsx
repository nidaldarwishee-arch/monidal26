"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MATCHES } from "@/data/matches";
import { TEAM_MAP } from "@/data/teams";
import { GROUPS, type GroupId } from "@/lib/types";
import { computeGroupStandings } from "@/lib/standings";
import { useOfficialResults } from "@/lib/hooks";
import { useLocalState } from "@/lib/store";
import { useResolvedMatches } from "@/lib/use-resolved";
import { MatchCard } from "@/components/match-card";
import { TeamFlag } from "@/components/team-flag";
import { cn } from "@/lib/utils";

/** Standings table for one group. */
export function GroupTable({ group }: { group: GroupId }) {
  const t = useTranslations("groups");
  const locale = useLocale();
  const results = useOfficialResults();
  const rows = useMemo(() => computeGroupStandings(group, results), [group, results]);

  return (
    <div className="overflow-x-auto rounded-2xl border bg-card">
      <table className="w-full min-w-105 text-sm">
        <caption className="sr-only">{t("groupTab", { g: group })}</caption>
        <thead>
          <tr className="border-b text-xs text-muted-foreground">
            <th scope="col" className="px-3 py-2.5 text-start">{t("pos")}</th>
            <th scope="col" className="px-3 py-2.5 text-start">{t("team")}</th>
            <th scope="col" className="px-2 py-2.5 text-center">{t("played")}</th>
            <th scope="col" className="px-2 py-2.5 text-center">{t("won")}</th>
            <th scope="col" className="px-2 py-2.5 text-center">{t("drawn")}</th>
            <th scope="col" className="px-2 py-2.5 text-center">{t("lost")}</th>
            <th scope="col" className="hidden px-2 py-2.5 text-center sm:table-cell">{t("gf")}</th>
            <th scope="col" className="hidden px-2 py-2.5 text-center sm:table-cell">{t("ga")}</th>
            <th scope="col" className="px-2 py-2.5 text-center">{t("gd")}</th>
            <th scope="col" className="px-3 py-2.5 text-center font-bold">{t("pts")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const team = TEAM_MAP[row.teamId];
            return (
              <tr
                key={row.teamId}
                className={cn(
                  "border-b last:border-0",
                  row.pos <= 2 && "bg-primary/5",
                  row.pos === 3 && "bg-accent/5"
                )}
              >
                <td className="px-3 py-3">
                  <span
                    className={cn(
                      "grid size-6 place-items-center rounded-full text-xs font-bold",
                      row.pos <= 2
                        ? "bg-primary/20 text-primary"
                        : row.pos === 3
                          ? "bg-accent/20 text-accent"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {row.pos}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span className="flex items-center gap-2.5 font-semibold">
                    <TeamFlag teamId={row.teamId} size={24} />
                    {locale === "ar" ? team.nameAr : team.nameEn}
                  </span>
                </td>
                <td className="px-2 py-3 text-center tabular-nums">{row.played}</td>
                <td className="px-2 py-3 text-center tabular-nums">{row.won}</td>
                <td className="px-2 py-3 text-center tabular-nums">{row.drawn}</td>
                <td className="px-2 py-3 text-center tabular-nums">{row.lost}</td>
                <td className="hidden px-2 py-3 text-center tabular-nums sm:table-cell">{row.gf}</td>
                <td className="hidden px-2 py-3 text-center tabular-nums sm:table-cell">{row.ga}</td>
                <td className="px-2 py-3 text-center tabular-nums">
                  {row.gd > 0 ? `+${row.gd}` : row.gd}
                </td>
                <td className="px-3 py-3 text-center font-display text-base font-bold text-primary">
                  {row.pts}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="border-t px-3 py-2 text-xs text-muted-foreground">{t("qualifiedHint")}</p>
    </div>
  );
}

/** 12 group tabs with standings + fixtures. */
export function GroupTabs({ initial = "A" }: { initial?: GroupId }) {
  const t = useTranslations("groups");
  const [active, setActive] = useState<GroupId>(initial);
  const { resolved } = useResolvedMatches();
  const local = useLocalState();
  const groupMatches = MATCHES.filter((m) => m.r === "GS" && m.g === active);
  const favoriteGroups = new Set(
    local.favorites.map((id) => TEAM_MAP[id]?.group).filter(Boolean)
  );

  return (
    <div className="space-y-5">
      <div
        role="tablist"
        aria-label={t("title")}
        className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
      >
        {GROUPS.map((g) => (
          <button
            key={g}
            role="tab"
            aria-selected={active === g}
            onClick={() => setActive(g)}
            className={cn(
              "shrink-0 cursor-pointer rounded-xl border px-4 py-2 text-sm font-bold transition-colors duration-200",
              active === g
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              favoriteGroups.has(g) && active !== g && "border-accent/50"
            )}
          >
            {g}
          </button>
        ))}
      </div>

      <div role="tabpanel" aria-label={t("groupTab", { g: active })} className="space-y-5">
        <section aria-label={t("standings")}>
          <h2 className="mb-3 font-display text-lg font-bold">{t("standings")}</h2>
          <GroupTable group={active} />
        </section>

        <section aria-label={t("fixtures")}>
          <h2 className="mb-3 font-display text-lg font-bold">{t("fixtures")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groupMatches.map((m) => (
              <MatchCard key={m.n} match={resolved.get(m.n)!} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
