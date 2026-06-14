"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { X, KeyRound, Trophy } from "lucide-react";
import { useUser } from "@/lib/hooks";
import { signInAction } from "@/lib/supabase/actions";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";

const SESSION_KEY = "wc26:promo-dismissed";
const DELAY_MS = 25_000;

export function PromoPopup() {
  const { user, loading } = useUser();
  const [visible, setVisible] = useState(false);
  const t = useTranslations("promo");
  const tAuth = useTranslations("auth");
  const locale = useLocale();

  useEffect(() => {
    // Wait for auth state to settle before deciding
    if (loading) return;
    if (user) return;
    if (typeof window !== "undefined" && sessionStorage.getItem(SESSION_KEY)) return;

    const timer = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, [user, loading]);

  const dismiss = () => {
    if (typeof window !== "undefined") sessionStorage.setItem(SESSION_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  const next = locale === "ar" ? "/ar/dashboard" : "/dashboard";

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
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl shadow-2xl">
        {/* Hero background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/legends-bg.jpeg')" }}
          aria-hidden="true"
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/65 to-black/80" aria-hidden="true" />

        {/* Content */}
        <div className="relative px-6 pb-7 pt-6 text-white">
          {/* Close button */}
          <button
            onClick={dismiss}
            aria-label={t("close")}
            className="absolute right-4 top-4 rounded-full p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="size-5" aria-hidden />
          </button>

          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 grid size-12 place-items-center rounded-xl bg-primary shadow-lg shadow-primary/40">
              <Trophy className="size-6 text-primary-foreground" aria-hidden />
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight">{t("title")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/80">{t("subtitle")}</p>
          </div>

          {/* Sign-in form */}
          <form action={signInAction} className="space-y-3">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="next" value={next} />

            <div className="space-y-1.5">
              <Label htmlFor="promo-email" className="text-sm text-white/90">
                {tAuth("email")}
              </Label>
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
              <Label htmlFor="promo-password" className="text-sm text-white/90">
                {tAuth("password")}
              </Label>
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

          {/* Divider */}
          <div className="my-4 flex items-center gap-3 text-xs font-medium text-white/50">
            <span className="h-px flex-1 bg-white/20" aria-hidden />
            {tAuth("orDivider")}
            <span className="h-px flex-1 bg-white/20" aria-hidden />
          </div>

          {/* Google sign-in */}
          <GoogleSignInButton next={next} />

          {/* Register link */}
          <p className="mt-4 text-center text-sm text-white/70">
            {t("noAccount")}{" "}
            <Link
              href="/register"
              onClick={dismiss}
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
