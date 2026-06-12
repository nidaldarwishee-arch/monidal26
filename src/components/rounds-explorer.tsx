"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { MATCHES } from "@/data/matches";
import { GROUPS, ROUND_ORDER, type RoundId } from "@/lib/types";
import { useResolvedMatches } from "@/lib/use-resolved";
import { MatchCard } from "@/components/match-card";
import { RoundTabs } from "@/components/bracket-view";
import { GroupTable } from "@/components/group-tabs";
import { cn } from "@/lib/utils";

/** Round tab menu: group stage shows the 12 tables, knockouts show matches + bracket. */
export function RoundsExplorer() {
  const t = useTranslations("rounds");
  const tg = useTranslations("groups");
  const [round, setRound] = useState<RoundId>("R32");
  const { resolved } = useResolvedMatches();

  const roundMatches = MATCHES.filter((m) => m.r === round);

  return (
    <div className="space-y-8">
      <div
        role="tablist"
        aria-label={t("title")}
        className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
      >
        {ROUND_ORDER.map((r) => (
          <button
            key={r}
            role="tab"
            aria-selected={round === r}
            onClick={() => setRound(r)}
            className={cn(
              "shrink-0 cursor-pointer rounded-xl border px-4 py-2 text-sm font-semibold transition-colors duration-200",
              round === r
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            {t(r)}
          </button>
        ))}
      </div>

      {round === "GS" ? (
        <div role="tabpanel" className="space-y-6">
          <div className="grid gap-5 lg:grid-cols-2">
            {GROUPS.map((g) => (
              <section key={g} aria-label={tg("groupTab", { g })}>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold">
                    {tg("groupTab", { g })}
                  </h2>
                  <Link
                    href="/groups"
                    className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                  >
                    {tg("fixtures")}
                    <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
                  </Link>
                </div>
                <GroupTable group={g} />
              </section>
            ))}
          </div>
        </div>
      ) : (
        <div role="tabpanel" className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roundMatches.map((m) => (
              <MatchCard key={m.n} match={resolved.get(m.n)!} />
            ))}
          </div>
          <RoundTabs />
        </div>
      )}
    </div>
  );
}
