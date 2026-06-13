import { setRequestLocale, getTranslations } from "next-intl/server";
import {
  CalendarDays,
  LayoutGrid,
  Map as MapIcon,
  Network,
  UserRound,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { HomeLive } from "@/components/home-live";
import { HeroLegends } from "@/components/hero-legends";
import { Badge } from "@/components/ui/badge";

const QUICK = [
  { href: "/groups", key: "quickGroups", icon: LayoutGrid },
  { href: "/calendar", key: "quickCalendar", icon: CalendarDays },
  { href: "/map", key: "quickMap", icon: MapIcon },
  { href: "/rounds", key: "quickBracket", icon: Network },
  { href: "/dashboard", key: "quickDashboard", icon: UserRound },
] as const;

const STATS = [
  { value: "104", key: "statsMatches" },
  { value: "48", key: "statsTeams" },
  { value: "16", key: "statsStadiums" },
  { value: "16", key: "statsCities" },
] as const;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <div className="space-y-10">
      <section
        className="pitch-grid relative -mt-6 flex min-h-[calc(100svh-4rem)] flex-col justify-between overflow-hidden px-4 pb-12 pt-12 text-center md:pb-16 md:pt-20"
        style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)", marginRight: "calc(-50vw + 50%)" }}
      >
        <HeroLegends />

        {/* Title block — top of hero */}
        <div className="relative z-10">
          <Badge className="mx-auto">{t("heroBadge")}</Badge>
          <h1 className="mx-auto mt-4 max-w-3xl font-display text-4xl font-bold leading-tight md:text-6xl">
            {t("heroTitle")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {t("heroSubtitle")}
          </p>
        </div>

        {/* Quick links + stats — pinned to bottom of hero */}
        <div className="relative z-10 space-y-6">
          <nav
            aria-label="Quick links"
            className="mx-auto grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-5"
          >
            {QUICK.map(({ href, key, icon: Icon }) => (
              <Link
                key={key}
                href={href}
                className="group flex cursor-pointer flex-col items-center gap-2 rounded-2xl border bg-card/80 p-4 backdrop-blur-sm transition-colors duration-200 hover:border-primary/50 hover:bg-primary/5"
              >
                <Icon
                  className="size-6 text-primary transition-transform duration-200 group-hover:-translate-y-0.5"
                  aria-hidden
                />
                <span className="text-sm font-semibold">{t(key)}</span>
              </Link>
            ))}
          </nav>

          <dl className="mx-auto grid max-w-2xl grid-cols-4 gap-3">
            {STATS.map((s) => (
              <div key={s.key} className="rounded-xl bg-muted/60 p-3 backdrop-blur-sm">
                <dt className="sr-only">{t(s.key)}</dt>
                <dd className="font-display text-2xl font-bold text-primary">{s.value}</dd>
                <dd className="text-xs font-medium text-muted-foreground">{t(s.key)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <HomeLive />
    </div>
  );
}
