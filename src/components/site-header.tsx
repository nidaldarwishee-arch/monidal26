"use client";

import { useTranslations } from "next-intl";
import { CircleUserRound, Trophy } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { useUser } from "@/lib/hooks";

const NAV = [
  { href: "/", key: "home" },
  { href: "/matches", key: "matches" },
  { href: "/groups", key: "groups" },
  { href: "/rounds", key: "rounds" },
  { href: "/map", key: "map" },
  { href: "/calendar", key: "calendar" },
] as const;

export function SiteHeader() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/65">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Trophy className="size-5" aria-hidden />
          </span>
          <span className="hidden sm:inline">
            WC<span className="text-primary">2026</span>
          </span>
        </Link>

        <nav aria-label="Main" className="ms-4 hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        <div className="ms-auto flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
          <Link
            href={user ? "/dashboard" : "/auth"}
            aria-label={user ? t("dashboard") : t("signIn")}
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors duration-200 hover:bg-muted"
          >
            <CircleUserRound className="size-5 text-primary" aria-hidden />
            <span className="hidden lg:inline">
              {user ? user.name.split(" ")[0] : t("signIn")}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
