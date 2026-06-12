import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { MATCH_MAP, MATCHES } from "@/data/matches";
import { TEAM_MAP } from "@/data/teams";
import { VENUE_MAP } from "@/data/venues";
import { routing } from "@/i18n/routing";
import { MatchDetail } from "@/components/match-detail";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    MATCHES.map((m) => ({ locale, n: String(m.n) }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; n: string }>;
}) {
  const { locale, n } = await params;
  const match = MATCH_MAP[Number(n)];
  if (!match) return {};
  const t = await getTranslations({ locale, namespace: "match" });
  const ar = locale === "ar";
  const name = (slot: string) => {
    const team = TEAM_MAP[slot];
    return team ? (ar ? team.nameAr : team.nameEn) : slot;
  };
  const venue = VENUE_MAP[match.v];
  return {
    title: `${name(match.h)} ${ar ? "ضد" : "vs"} ${name(match.a)} — ${t("matchN", { n: match.n })}`,
    description: `${ar ? venue.nameAr : venue.nameEn}, ${ar ? venue.cityAr : venue.cityEn} — FIFA World Cup 2026`,
  };
}

export default async function MatchPage({
  params,
}: {
  params: Promise<{ locale: string; n: string }>;
}) {
  const { locale, n } = await params;
  setRequestLocale(locale);
  const match = MATCH_MAP[Number(n)];
  if (!match) notFound();

  return <MatchDetail matchN={match.n} />;
}
