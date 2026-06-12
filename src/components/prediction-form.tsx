"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Lock, Target } from "lucide-react";
import type { ResolvedMatch } from "@/lib/types";
import { hasKickedOff } from "@/lib/time";
import { useLocalState } from "@/lib/store";
import { useSavePrediction, useUser } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { TeamLabel, useSlotName } from "@/components/team-label";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

function GoalsInput({
  id,
  value,
  onChange,
  label,
}: {
  id: string;
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Label htmlFor={id} className="sr-only">
        {label}
      </Label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        max={20}
        value={value}
        onChange={(e) => onChange(Math.max(0, Math.min(20, Number(e.target.value) || 0)))}
        className="h-14 w-16 rounded-xl border bg-background text-center font-display text-2xl font-bold tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}

/** Score prediction form — open until kickoff, knockout draws need a winner. */
export function PredictionForm({ match }: { match: ResolvedMatch }) {
  const t = useTranslations("prediction");
  const local = useLocalState();
  const { user } = useUser();
  const save = useSavePrediction();
  const slotName = useSlotName();
  const existing = local.predictions[match.n];

  const [home, setHome] = useState(existing?.homeGoals ?? 0);
  const [away, setAway] = useState(existing?.awayGoals ?? 0);
  const [winner, setWinner] = useState<string | undefined>(existing?.winner);
  const [saved, setSaved] = useState(false);

  const locked = hasKickedOff(match.t);
  const isKnockout = match.r !== "GS";
  const needsWinner = isKnockout && home === away;
  const bothKnown = Boolean(match.home.teamId && match.away.teamId);

  if (locked) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-muted p-4 text-sm text-muted-foreground">
        <Lock className="size-4 shrink-0" aria-hidden />
        {t("locked")}
      </div>
    );
  }

  return (
    <Card id="predict">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="size-5 text-primary" aria-hidden />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center gap-4">
          <TeamLabel slot={match.home} flagSize={26} className="flex-1 justify-end" />
          <GoalsInput
            id={`predict-home-${match.n}`}
            value={home}
            onChange={setHome}
            label={slotName(match.home)}
          />
          <span className="text-xl font-bold text-muted-foreground">:</span>
          <GoalsInput
            id={`predict-away-${match.n}`}
            value={away}
            onChange={setAway}
            label={slotName(match.away)}
          />
          <TeamLabel slot={match.away} flagSize={26} className="flex-1" />
        </div>

        {needsWinner && bothKnown && (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-muted-foreground">
              {t("pickWinner")}
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {[match.home, match.away].map((slot) => (
                <button
                  key={slot.teamId}
                  type="button"
                  aria-pressed={winner === slot.teamId}
                  onClick={() => setWinner(slot.teamId)}
                  className={cn(
                    "cursor-pointer rounded-xl border p-2.5 transition-colors duration-200",
                    winner === slot.teamId
                      ? "border-primary bg-primary/10"
                      : "hover:bg-muted"
                  )}
                >
                  <TeamLabel slot={slot} flagSize={22} />
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <Button
          className="w-full"
          disabled={needsWinner && bothKnown && !winner}
          onClick={async () => {
            await save({
              matchN: match.n,
              homeGoals: home,
              awayGoals: away,
              winner: needsWinner ? winner : undefined,
              updatedAt: new Date().toISOString(),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
          }}
        >
          {saved ? <Check aria-hidden /> : null}
          {saved ? t("saved") : t("save")}
        </Button>

        {!user && (
          <p className="text-center text-xs text-muted-foreground">
            <Link href="/login" className="font-semibold text-primary hover:underline">
              {t("signIn")}
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
