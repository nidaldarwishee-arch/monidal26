"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { KeyRound, Mail, Sparkles, UserRound } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";
import { store } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "signin" | "register";

/** Email/password + magic-link auth with a localStorage fallback in demo mode. */
export function AuthPanel() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const supabaseMode = isSupabaseConfigured();

  const localSignIn = () => {
    store.setProfile({
      id: `local-${Date.now()}`,
      name: name || email.split("@")[0] || "Fan",
      email,
      role: "user",
    });
    router.push("/dashboard");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!supabaseMode) {
      localSignIn();
      return;
    }

    const supabase = getSupabaseBrowser()!;
    setBusy(true);
    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name } },
        });
        if (error) throw error;
        setMessage(t("verifySent"));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setError(t("errors.invalid"));
          return;
        }
        router.push("/dashboard");
      }
    } catch {
      setError(t("errors.generic"));
    } finally {
      setBusy(false);
    }
  };

  const magicLink = async () => {
    if (!supabaseMode || !email) return;
    setBusy(true);
    setError(null);
    try {
      const { error } = await getSupabaseBrowser()!.auth.signInWithOtp({ email });
      if (error) throw error;
      setMessage(t("magicLinkSent"));
    } catch {
      setError(t("errors.generic"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <UserRound className="size-5 text-primary" aria-hidden />
            {mode === "signin" ? t("signInTitle") : t("registerTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-1.5">
                <Label htmlFor="auth-name">{t("name")}</Label>
                <Input
                  id="auth-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="auth-email">{t("email")}</Label>
              <Input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            {supabaseMode && (
              <div className="space-y-1.5">
                <Label htmlFor="auth-password">{t("password")}</Label>
                <Input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  minLength={8}
                  required
                />
              </div>
            )}

            {error && (
              <p role="alert" className="rounded-xl bg-live/10 px-3 py-2 text-sm font-medium text-live">
                {error}
              </p>
            )}
            {message && (
              <p role="status" className="rounded-xl bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
                {message}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={busy}>
              <KeyRound aria-hidden />
              {mode === "signin" ? t("signIn") : t("register")}
            </Button>

            {supabaseMode && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={busy || !email}
                onClick={magicLink}
              >
                <Mail aria-hidden />
                {t("magicLink")}
              </Button>
            )}
          </form>

          <button
            className="mt-4 w-full cursor-pointer text-center text-sm font-semibold text-primary hover:underline"
            onClick={() => setMode(mode === "signin" ? "register" : "signin")}
          >
            {mode === "signin" ? t("switchToRegister") : t("switchToSignIn")}
          </button>
        </CardContent>
      </Card>

      {!supabaseMode && (
        <Card className="border-accent/40">
          <CardContent className="space-y-2 p-5">
            <p className="flex items-center gap-2 font-display font-bold">
              <Sparkles className="size-4 text-accent" aria-hidden />
              {t("demoTitle")}
            </p>
            <p className="text-sm text-muted-foreground">{t("demoNote")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
