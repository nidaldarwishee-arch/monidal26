"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarPlus, ExternalLink } from "lucide-react";
import type { Match } from "@/lib/types";
import { googleCalendarUrl } from "@/lib/ics";
import { Button } from "@/components/ui/button";

/**
 * One-click "Add to calendar": downloads an .ics for the given scope, with a
 * Google Calendar deep link for single matches.
 */
export function CalendarExportButton({
  scope,
  match,
  label,
  variant = "outline",
  size = "sm",
  className,
}: {
  /** ics API scope string, e.g. "all", "team:MEX", "group:A", "matches:1,7" */
  scope: string;
  /** When exporting a single match, also offer Google Calendar */
  match?: Match;
  label?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}) {
  const t = useTranslations("match");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const icsHref = `/api/calendar/ics?scope=${encodeURIComponent(scope)}&locale=${locale}`;

  if (!match) {
    return (
      <Button variant={variant} size={size} className={className}
        onClick={() => (window.location.href = icsHref)}>
        <CalendarPlus aria-hidden />
        {label ?? t("addToCalendar")}
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        variant={variant}
        size={size}
        className={className}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <CalendarPlus aria-hidden />
        {label ?? t("addToCalendar")}
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" aria-hidden onClick={() => setOpen(false)} />
          <div className="absolute end-0 z-50 mt-2 w-52 animate-fade-up rounded-xl border bg-card p-1.5 shadow-lg">
            <a
              href={icsHref}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              <CalendarPlus className="size-4 text-primary" aria-hidden />
              {t("downloadIcs")}
            </a>
            <a
              href={googleCalendarUrl(
                match,
                locale,
                process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              <ExternalLink className="size-4 text-primary" aria-hidden />
              {t("googleCalendar")}
            </a>
          </div>
        </>
      )}
    </div>
  );
}
