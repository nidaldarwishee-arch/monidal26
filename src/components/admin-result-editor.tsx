"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Trash2 } from "lucide-react";
import type { ResolvedMatch } from "@/lib/types";
import { VENUE_MAP } from "@/data/venues";
import { formatDate, formatTime } from "@/lib/time";
import { store } from "@/lib/store";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TeamLabel, useSlotName } from "@/components/team-label";
import { cn } from "@/lib/utils";

/** Inline editor for one match's official result. */
export function AdminResultEditor({ match }: { match: ResolvedMatch }) {
  const t = useTranslations("admin");
  const tr = useTranslations("rounds");
  const tm = useTranslations("match");
  const locale = useLocale();
  const slotName = useSlotName();
  const existing = match.result;

  const [home, setHome] = useState(existing?.homeGoals ?? 0);
  const [away, setAway] = useState(existing?.awayGoals ?? 0);
  const [winner, setWinner] = useState<string | undefined>(existing?.winner);
  const [saved, setSaved] = useState(false);

  const venue = VENUE_MAP[match.v];
  const isKnockout = match.r !== "GS";
  const needsWinner = isKnockout && home === away;
  const bothKnown = Boolean(match.home.teamId && match.away.teamId);

  const publish = async () => {
    const result = {
      matchN: match.n,
      homeGoals: home,
      awayGoals: away,
      winner: needsWinner ? winner : undefined,
      status: "played" as const,
    };
    store.setLocalResult(result);

    const supabase = getSupabaseBrowser();
    if (supabase) {
      await supabase.from("match_results").upsert(
        {
          match_n: match.n,
          home_goals: home,
          away_goals: away,
          winner_team_id: result.winner ?? null,
          status: "played",
          official: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "match_n" }
      );
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const remove = async () => {
    store.removeLocalResult(match.n);
    const supabase = getSupabaseBrowser();
    if (supabase) {
      await supabase.from("match_results").delete().eq("match_n", match.n);
    }
  };

  return (
    <article className="rounded-2xl border bg-card p-4">
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <Badge variant="muted">M{match.n}</Badge>
        <Badge>{match.g ? tm("group", { g: match.g }) : tr(match.r)}</Badge>
        {existing && <Badge variant="accent">{t("published")}</Badge>}
        <span className="ms-auto font-medium text-muted-foreground">
          {formatDate(match.t, locale)} · {formatTime(match.t, locale)} ·{" "}
          {locale === "ar" ? venue.cityAr : venue.cityEn}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto_auto_auto_1fr] items-center gap-2">
        <TeamLabel slot={match.home} flagSize={24} className="justify-end text-sm" />
        <div>
          <Label htmlFor={`adm-h-${match.n}`} className="sr-only">
            {t("homeGoals")} — {slotName(match.home)}
          </Label>
          <input
            id={`adm-h-${match.n}`}
            type="number"
            inputMode="numeric"
            min={0}
            max={20}
            value={home}
            onChange={(e) => setHome(Math.max(0, Math.min(20, Number(e.target.value) || 0)))}
            className="h-11 w-13 rounded-xl border bg-background text-center font-display text-lg font-bold tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <span className="font-bold text-muted-foreground">:</span>
        <div>
          <Label htmlFor={`adm-a-${match.n}`} className="sr-only">
            {t("awayGoals")} — {slotName(match.away)}
          </Label>
          <input
            id={`adm-a-${match.n}`}
            type="number"
            inputMode="numeric"
            min={0}
            max={20}
            value={away}
            onChange={(e) => setAway(Math.max(0, Math.min(20, Number(e.target.value) || 0)))}
            className="h-11 w-13 rounded-xl border bg-background text-center font-display text-lg font-bold tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <TeamLabel slot={match.away} flagSize={24} className="text-sm" />
      </div>

      {needsWinner && bothKnown && (
        <fieldset className="mt-3">
          <legend className="mb-1.5 text-xs font-medium text-muted-foreground">
            {t("winnerNeeded")}
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {[match.home, match.away].map((slot) => (
              <button
                key={slot.teamId}
                type="button"
                aria-pressed={winner === slot.teamId}
                onClick={() => setWinner(slot.teamId)}
                className={cn(
                  "cursor-pointer rounded-xl border p-2 transition-colors duration-200",
                  winner === slot.teamId ? "border-primary bg-primary/10" : "hover:bg-muted"
                )}
              >
                <TeamLabel slot={slot} flagSize={20} className="text-xs" />
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="mt-3 flex items-center gap-2">
        <Button
          size="sm"
          onClick={publish}
          disabled={(needsWinner && bothKnown && !winner) || !bothKnown}
        >
          {saved ? <Check aria-hidden /> : null}
          {existing ? t("update") : t("publish")}
        </Button>
        {existing && (
          <Button size="sm" variant="ghost" onClick={remove}>
            <Trash2 aria-hidden />
            {t("remove")}
          </Button>
        )}
      </div>
    </article>
  );
}
