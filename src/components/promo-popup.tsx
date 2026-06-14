"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { X, KeyRound, Trophy } from "lucide-react";
import { useUser } from "@/lib/hooks";
import { signInAction } from "@/lib/supabase/actions";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";

const FIRST_DELAY_MS = 4_000;   // 4 s → centered modal
const REPEAT_DELAY_MS = 20_000; // 20 s after dismiss → corner widget

type Phase = "hidden" | "center" | "corner";

export function PromoPopup() {
  const { user, loading } = useUser();
  const [phase, setPhase] = useState<Phase>("hidden");
  const t = useTranslations("promo");
  const tAuth = useTranslations("auth");
  const locale = useLocale();
  const repeatRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (loading || user) return;

    const first = setTimeout(() => setPhase("center"), FIRST_DELAY_MS);
    return () => clearTimeout(first);
  }, [user, loading]);

  const dismissCenter = () => {
    setPhase("hidden");
    repeatRef.current = setTimeout(() => setPhase("corner"), REPEAT_DELAY_MS);
  };

  const dismissCorner = () => {
    setPhase("hidden");
  };

  // Clean up repeat timer if user logs in
  useEffect(() => {
    if (user && repeatRef.current) {
      clearTimeout(repeatRef.current);
      setPhase("hidden");
    }
  }, [user]);

  if (phase === "hidden") return null;

  const next = locale === "ar" ? "/ar/dashboard" : "/dashboard";

  /* ── centered full-screen modal ── */
  if (phase === "center") {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("title")}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={dismissCenter}
          aria-hidden="true"
        />

        {/* Card */}
        <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl shadow-2xl">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/legends-bg.jpeg')" }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/65 to-black/80" aria-hidden="true" />

          <div className="relative px-6 pb-7 pt-6 text-white">
            <button
              onClick={dismissCenter}
              aria-label={t("close")}
              className="absolute right-4 top-4 rounded-full p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="size-5" aria-hidden />
            </button>

            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 grid size-12 place-items-center rounded-xl bg-primary shadow-lg shadow-primary/40">
                <Trophy className="size-6 text-primary-foreground" aria-hidden />
              </div>
              <h2 className="font-display text-2xl font-bold tracking-tight">{t("title")}</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/80">{t("subtitle")}</p>
            </div>

            <form action={signInAction} className="space-y-3">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="next" value={next} />

              <div className="space-y-1.5">
                <Label htmlFor="promo-email" className="text-sm text-white/90">{tAuth("email")}</Label>
                <Input
                  id="promo-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="border-white/20 bg-white/10 text-white placeholder:text-white/40 focus-visible:ring-primary"
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="promo-password" className="text-sm text-white/90">{tAuth("password")}</Label>
                <Input
                  id="promo-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  minLength={8}
                  required
                  className="border-white/20 bg-white/10 text-white placeholder:text-white/40 focus-visible:ring-primary"
                  placeholder="••••••••"
                />
              </div>

              <Button type="submit" className="mt-1 w-full shadow-md">
                <KeyRound aria-hidden />
                {tAuth("signIn")}
              </Button>
            </form>

            <div className="my-4 flex items-center gap-3 text-xs font-medium text-white/50">
              <span className="h-px flex-1 bg-white/20" aria-hidden />
              {tAuth("orDivider")}
              <span className="h-px flex-1 bg-white/20" aria-hidden />
            </div>

            <GoogleSignInButton next={next} />

            <p className="mt-4 text-center text-sm text-white/70">
              {t("noAccount")}{" "}
              <Link
                href="/register"
                onClick={dismissCenter}
                className="font-semibold text-primary underline-offset-2 hover:underline"
              >
                {t("registerFree")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ── corner widget (bottom-right) ── */
  return (
    <div
      role="dialog"
      aria-label={t("title")}
      className="fixed bottom-20 right-4 z-[100] w-72 overflow-hidden rounded-2xl shadow-2xl md:bottom-6"
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/legends-bg.jpeg')" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/65 to-black/80" aria-hidden="true" />

      <div className="relative px-4 pb-5 pt-4 text-white">
        <button
          onClick={dismissCorner}
          aria-label={t("close")}
          className="absolute right-3 top-3 rounded-full p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="size-4" aria-hidden />
        </button>

        <div className="mb-3 flex items-center gap-2">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary shadow shadow-primary/40">
            <Trophy className="size-4 text-primary-foreground" aria-hidden />
          </div>
          <div>
            <p className="text-xs font-bold leading-tight">{t("title")}</p>
            <p className="text-[11px] leading-tight text-white/70">{t("subtitle")}</p>
          </div>
        </div>

        <form action={signInAction} className="space-y-2">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="next" value={next} />

          <Input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="h-8 border-white/20 bg-white/10 text-xs text-white placeholder:text-white/40 focus-visible:ring-primary"
            placeholder={tAuth("email")}
          />
          <Input
            name="password"
            type="password"
            autoComplete="current-password"
            minLength={8}
            required
            className="h-8 border-white/20 bg-white/10 text-xs text-white placeholder:text-white/40 focus-visible:ring-primary"
            placeholder={tAuth("password")}
          />
          <Button type="submit" size="sm" className="w-full text-xs">
            <KeyRound className="size-3" aria-hidden />
            {tAuth("signIn")}
          </Button>
        </form>

        <div className="my-2 flex items-center gap-2 text-[11px] text-white/50">
          <span className="h-px flex-1 bg-white/20" aria-hidden />
          {tAuth("orDivider")}
          <span className="h-px flex-1 bg-white/20" aria-hidden />
        </div>

        <GoogleSignInButton next={next} />

        <p className="mt-2 text-center text-[11px] text-white/60">
          {t("noAccount")}{" "}
          <Link
            href="/register"
            onClick={dismissCorner}
            className="font-semibold text-primary hover:underline"
          >
            {t("registerFree")}
          </Link>
        </p>
      </div>
    </div>
  );
}
