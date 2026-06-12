import type { MatchStage } from "@/lib/types";

/** Ordered FIFA World Cup 2026 match stages used by database seeds/imports. */
export const MATCH_STAGES: MatchStage[] = [
  {
    id: "GS",
    nameEn: "Group Stage",
    nameAr: "\u062f\u0648\u0631 \u0627\u0644\u0645\u062c\u0645\u0648\u0639\u0627\u062a",
    stageOrder: 10,
    isKnockout: false,
  },
  {
    id: "R32",
    nameEn: "Round of 32",
    nameAr: "\u062f\u0648\u0631 \u0627\u0644\u0640 32",
    stageOrder: 20,
    isKnockout: true,
  },
  {
    id: "R16",
    nameEn: "Round of 16",
    nameAr: "\u062f\u0648\u0631 \u0627\u0644\u0640 16",
    stageOrder: 30,
    isKnockout: true,
  },
  {
    id: "QF",
    nameEn: "Quarter-finals",
    nameAr: "\u0631\u0628\u0639 \u0627\u0644\u0646\u0647\u0627\u0626\u064a",
    stageOrder: 40,
    isKnockout: true,
  },
  {
    id: "SF",
    nameEn: "Semi-finals",
    nameAr: "\u0646\u0635\u0641 \u0627\u0644\u0646\u0647\u0627\u0626\u064a",
    stageOrder: 50,
    isKnockout: true,
  },
  {
    id: "3P",
    nameEn: "Third-place match",
    nameAr: "\u0645\u0628\u0627\u0631\u0627\u0629 \u0627\u0644\u0645\u0631\u0643\u0632 \u0627\u0644\u062b\u0627\u0644\u062b",
    stageOrder: 60,
    isKnockout: true,
  },
  {
    id: "F",
    nameEn: "Final",
    nameAr: "\u0627\u0644\u0646\u0647\u0627\u0626\u064a",
    stageOrder: 70,
    isKnockout: true,
  },
];

export const MATCH_STAGE_MAP: Record<string, MatchStage> = Object.fromEntries(
  MATCH_STAGES.map((stage) => [stage.id, stage])
);
