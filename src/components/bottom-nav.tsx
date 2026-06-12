"use client";

import { useTranslations } from "next-intl";
import { CalendarDays, Home, LayoutGrid, ListTodo, UserRound } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", key: "home", icon: Home },
  { href: "/matches", key: "matches", icon: ListTodo },
  { href: "/groups", key: "groups", icon: LayoutGrid },
  { href: "/calendar", key: "calendar", icon: CalendarDays },
  { href: "/dashboard", key: "dashboard", icon: UserRound },
] as const;

/** Sticky bottom navigation on mobile. */
export function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <div className="grid h-16 grid-cols-5">
        {ITEMS.map(({ href, key, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={key}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors duration-200",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-5" aria-hidden />
              <span>{t(key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
