"use client";

import { useLocale, useTranslations } from "next-intl";
import type { ResolvedSlot } from "@/lib/types";
import { TEAM_MAP } from "@/data/teams";
import { TeamFlag } from "@/components/team-flag";
import { cn } from "@/lib/utils";

export function useSlotName() {
  const t = useTranslations("slots");
  const locale = useLocale();

  return (slot: ResolvedSlot): string => {
    if (slot.teamId && TEAM_MAP[slot.teamId]) {
      const team = TEAM_MAP[slot.teamId];
      return locale === "ar" ? team.nameAr : team.nameEn;
    }
    const p = slot.placeholder;
    switch (p.kind) {
      case "team":
        return p.teamId;
      case "winner-group":
        return t("winnerGroup", { group: p.group });
      case "runner-up-group":
        return t("runnerUpGroup", { group: p.group });
      case "third-place":
        return t("thirdPlace", { groups: p.groups });
      case "winner-match":
        return t("winnerMatch", { match: p.match });
      case "loser-match":
        return t("loserMatch", { match: p.match });
    }
  };
}

/** Flag + localized team name (or qualification placeholder). */
export function TeamLabel({
  slot,
  flagSize = 28,
  bold = false,
  className,
}: {
  slot: ResolvedSlot;
  flagSize?: number;
  bold?: boolean;
  className?: string;
}) {
  const slotName = useSlotName();
  const resolved = Boolean(slot.teamId);

  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <TeamFlag teamId={slot.teamId} size={flagSize} />
      <span
        className={cn(
          "truncate",
          bold && "font-semibold",
          !resolved && "text-sm text-muted-foreground"
        )}
      >
        {slotName(slot)}
      </span>
    </span>
  );
}
