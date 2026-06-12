/**
 * Timezone-aware date formatting. Matches are stored in UTC; users see them
 * in their own timezone by default, with the stadium-local time available on
 * match details.
 */

export function formatKickoff(
  iso: string,
  locale: string,
  opts: { tz?: string; dateStyle?: "full" | "long" | "medium" | "short"; withTime?: boolean } = {}
): string {
  const { tz, dateStyle = "medium", withTime = true } = opts;
  const d = new Date(iso);
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-US", {
    dateStyle,
    ...(withTime ? { timeStyle: "short" } : {}),
    timeZone: tz,
  }).format(d);
}

export function formatTime(iso: string, locale: string, tz?: string): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz,
  }).format(new Date(iso));
}

export function formatDate(iso: string, locale: string, tz?: string): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: tz,
  }).format(new Date(iso));
}

/** Local calendar date (YYYY-MM-DD) of a UTC instant in the user's timezone. */
export function localDateKey(iso: string, tz?: string): string {
  const d = new Date(iso);
  const fmt = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: tz,
  });
  return fmt.format(d);
}

export function isSameLocalDay(iso: string, date: Date): boolean {
  return localDateKey(iso) === localDateKey(date.toISOString());
}

export function hasKickedOff(iso: string, now: Date = new Date()): boolean {
  return new Date(iso).getTime() <= now.getTime();
}

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export function countdownTo(iso: string, now: Date = new Date()): CountdownParts {
  const total = Math.max(0, new Date(iso).getTime() - now.getTime());
  const seconds = Math.floor(total / 1000) % 60;
  const minutes = Math.floor(total / 60000) % 60;
  const hours = Math.floor(total / 3600000) % 24;
  const days = Math.floor(total / 86400000);
  return { days, hours, minutes, seconds, total };
}
