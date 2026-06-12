"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { countdownTo } from "@/lib/time";

/** Live countdown to an instant; renders nothing until mounted (hydration-safe). */
export function Countdown({ to }: { to: string }) {
  const t = useTranslations("home");
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) {
    return <div className="h-20" aria-hidden />;
  }

  const c = countdownTo(to, now);
  const parts = [
    { value: c.days, label: t("days") },
    { value: c.hours, label: t("hours") },
    { value: c.minutes, label: t("minutes") },
    { value: c.seconds, label: t("seconds") },
  ];

  return (
    <div className="flex gap-3" role="timer" aria-live="off">
      {parts.map((p) => (
        <div
          key={p.label}
          className="flex min-w-16 flex-col items-center rounded-xl border bg-card px-3 py-2"
        >
          <span className="font-display text-2xl font-bold tabular-nums text-primary">
            {String(p.value).padStart(2, "0")}
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">{p.label}</span>
        </div>
      ))}
    </div>
  );
}
