"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

/** Leaflet touches `window`, so the map loads client-side only. */
const MatchMap = dynamic(
  () => import("@/components/match-map").then((m) => m.MatchMap),
  {
    ssr: false,
    loading: () => <MapSkeleton />,
  }
);

function MapSkeleton() {
  const t = useTranslations("common");
  return (
    <div
      className="grid h-[60vh] min-h-96 animate-pulse place-items-center rounded-2xl border bg-muted"
      aria-busy="true"
    >
      <p className="text-sm text-muted-foreground">{t("loading")}</p>
    </div>
  );
}

export function MapSection() {
  return <MatchMap />;
}
