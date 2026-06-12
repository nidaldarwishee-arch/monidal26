"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Trophy } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { ResolvedMatch } from "@/lib/types";
import { MATCH_MAP } from "@/data/matches";
import { parseSlot } from "@/lib/bracket";
import { formatDate } from "@/lib/time";
import { useResolvedMatches, usePredictedMatches } from "@/lib/use-resolved";
import { TeamLabel } from "@/components/team-label";
import { cn } from "@/lib/utils";

/** Orders a knockout column so each pair feeds the match beside it. */
function feedersOf(n: number): number[] {
  const m = MATCH_MAP[n];
  const out: number[] = [];
  for (const slot of [m.h, m.a]) {
    const p = parseSlot(slot);
    if (p.kind === "winner-match") out.push(p.match);
  }
  return out;
}

function buildColumns(): number[][] {
  // Final → SF → QF → R16 → R32, then reversed for display
  const columns: number[][] = [[104]];
  for (let i = 0; i < 4; i++) {
    const next = columns[i].flatMap(feedersOf);
    columns.push(next);
  }
  return columns.reverse(); // [R32, R16, QF, SF, F]
}

const COLUMNS = buildColumns();

function BracketCard({ match, highlight }: { match: ResolvedMatch; highlight?: boolean }) {
  const locale = useLocale();
  const r = match.result;

  const row = (side: "home" | "away") => {
    const slot = side === "home" ? match.home : match.away;
    const goals = r ? (side === "home" ? r.homeGoals : r.awayGoals) : undefined;
    const isWinner =
      r &&
      slot.teamId &&
      (r.homeGoals !== r.awayGoals
        ? (r.homeGoals > r.awayGoals) === (side === "home")
        : r.winner === slot.teamId);
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-2 px-3 py-1.5",
          isWinner && "bg-primary/10"
        )}
      >
        <TeamLabel slot={slot} flagSize={20} bold={Boolean(isWinner)} className="text-sm" />
        {goals !== undefined && (
          <span className={cn("text-sm font-bold tabular-nums", isWinner && "text-primary")}>
            {goals}
            {r && r.homeGoals === r.awayGoals && r.winner === slot.teamId && (
              <span className="ms-0.5 text-[10px] text-muted-foreground">*</span>
            )}
          </span>
        )}
      </div>
    );
  };

  return (
    <Link
      href={`/matches/${match.n}`}
      className={cn(
        "block w-56 overflow-hidden rounded-xl border bg-card shadow-sm transition-colors duration-200 hover:border-primary/50",
        highlight && "border-gold"
      )}
    >
      <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-1 text-[11px] font-medium text-muted-foreground">
        <span>M{match.n}</span>
        <span>{formatDate(match.t, locale)}</span>
      </div>
      <div className="divide-y">
        {row("home")}
        {row("away")}
      </div>
    </Link>
  );
}

/** Full knockout tree with CSS elbow connectors (RTL-aware). */
export function BracketTree({ predicted = false }: { predicted?: boolean }) {
  const t = useTranslations("rounds");
  const official = useResolvedMatches();
  const mine = usePredictedMatches();
  const resolved = predicted ? mine.resolved : official.resolved;

  const labels = ["R32", "R16", "QF", "SF", "F"] as const;
  const champion = useMemo(() => {
    const final = resolved.get(104);
    if (!final?.result) return undefined;
    const r = final.result;
    if (r.homeGoals > r.awayGoals) return final.home;
    if (r.awayGoals > r.homeGoals) return final.away;
    return r.winner === final.home.teamId ? final.home : r.winner ? final.away : undefined;
  }, [resolved]);

  return (
    <div className="scrollbar-none -mx-4 overflow-x-auto px-4 pb-4">
      <div className="flex min-w-max items-stretch">
        {COLUMNS.map((col, ci) => (
          <div key={ci} className="flex flex-col">
            <p className="sticky top-0 z-10 pb-3 text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {t(labels[ci])}
            </p>
            <div className="flex flex-1 flex-col">
              {col.map((n) => (
                <div key={n} className="relative flex flex-1 items-center py-2">
                  {/* incoming connector (vertical join + horizontal stub) */}
                  {ci > 0 && (
                    <>
                      <span
                        aria-hidden
                        className="absolute start-0 border-s-2"
                        style={{ top: "25%", bottom: "25%" }}
                      />
                      <span
                        aria-hidden
                        className="absolute start-0 top-1/2 w-5 border-t-2"
                      />
                    </>
                  )}
                  <div className={cn("relative", ci > 0 && "ms-5", ci < 4 && "me-5")}>
                    <BracketCard match={resolved.get(n)!} highlight={n === 104} />
                    {/* outgoing stub */}
                    {ci < 4 && (
                      <span
                        aria-hidden
                        className="absolute -end-5 top-1/2 w-5 border-t-2"
                      />
                    )}
                  </div>
                </div>
              ))}

              {ci === 4 && (
                <div className="mx-auto mt-2 space-y-3 pb-4">
                  {champion?.teamId && (
                    <div className="flex w-56 flex-col items-center gap-2 rounded-xl border border-gold bg-gold/10 p-4 text-center">
                      <Trophy className="size-6 text-gold" aria-hidden />
                      <p className="text-xs font-bold uppercase tracking-wide text-gold">
                        {t("champion")}
                      </p>
                      <TeamLabel slot={champion} flagSize={26} bold />
                    </div>
                  )}
                  <div>
                    <p className="pb-2 text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      {t("3P")}
                    </p>
                    <BracketCard match={resolved.get(103)!} />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Tab strip for every round + bracket / list content. */
export function RoundTabs() {
  const t = useTranslations("rounds");
  const [predicted, setPredicted] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setPredicted(false)}
          aria-pressed={!predicted}
          className={cn(
            "cursor-pointer rounded-xl border px-4 py-2 text-sm font-semibold transition-colors duration-200",
            !predicted
              ? "border-primary bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:text-foreground"
          )}
        >
          {t("officialBracket")}
        </button>
        <button
          onClick={() => setPredicted(true)}
          aria-pressed={predicted}
          className={cn(
            "cursor-pointer rounded-xl border px-4 py-2 text-sm font-semibold transition-colors duration-200",
            predicted
              ? "border-primary bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:text-foreground"
          )}
        >
          {t("myBracket")}
        </button>
      </div>
      {predicted && (
        <p className="rounded-xl bg-accent/10 px-4 py-3 text-sm text-accent">
          {t("previewNote")}
        </p>
      )}
      <BracketTree predicted={predicted} />
    </div>
  );
}
