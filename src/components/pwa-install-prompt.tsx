"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "wc26:install-dismissed";

export function PWAInstallPrompt() {
  const t = useTranslations("pwa");
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      if (window.localStorage.getItem(DISMISS_KEY)) return;
      setEvent(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible || !event) return null;

  return (
    <div
      role="dialog"
      aria-label={t("install")}
      className="fixed inset-x-4 bottom-20 z-50 mx-auto max-w-md animate-fade-up rounded-2xl border bg-card p-4 shadow-xl md:bottom-6"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
          <Download className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display font-bold">{t("install")}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{t("installHint")}</p>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              onClick={async () => {
                await event.prompt();
                setVisible(false);
              }}
            >
              {t("install")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                window.localStorage.setItem(DISMISS_KEY, "1");
                setVisible(false);
              }}
            >
              {t("dismiss")}
            </Button>
          </div>
        </div>
        <button
          aria-label={t("dismiss")}
          className="cursor-pointer rounded-lg p-1 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
          onClick={() => setVisible(false)}
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
