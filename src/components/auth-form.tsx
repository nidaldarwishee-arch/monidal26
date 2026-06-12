import { KeyRound, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { signInAction, signUpAction } from "@/lib/supabase/actions";
import { localizedPath } from "@/lib/supabase/auth";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthMode = "login" | "register";

function statusText(
  t: ReturnType<typeof useTranslations<"auth">>,
  error?: string,
  message?: string
) {
  if (error === "invalid") return { kind: "error" as const, text: t("errors.invalid") };
  if (error === "config") return { kind: "error" as const, text: t("errors.config") };
  if (error) return { kind: "error" as const, text: t("errors.generic") };
  if (message === "verify") return { kind: "message" as const, text: t("verifySent") };
  return null;
}

export function AuthForm({
  mode,
  locale,
  next,
  error,
  message,
}: {
  mode: AuthMode;
  locale: string;
  next: string;
  error?: string;
  message?: string;
}) {
  const t = useTranslations("auth");
  const status = statusText(t, error, message);
  const isRegister = mode === "register";

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <UserRound className="size-5 text-primary" aria-hidden />
            {isRegister ? t("registerTitle") : t("signInTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={isRegister ? signUpAction : signInAction} className="space-y-4">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="next" value={next} />

            {isRegister && (
              <div className="space-y-1.5">
                <Label htmlFor="auth-name">{t("name")}</Label>
                <Input id="auth-name" name="name" autoComplete="name" required />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="auth-email">{t("email")}</Label>
              <Input id="auth-email" name="email" type="email" autoComplete="email" required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="auth-password">{t("password")}</Label>
              <Input
                id="auth-password"
                name="password"
                type="password"
                autoComplete={isRegister ? "new-password" : "current-password"}
                minLength={8}
                required
              />
            </div>

            {status && (
              <p
                role={status.kind === "error" ? "alert" : "status"}
                className={
                  status.kind === "error"
                    ? "rounded-xl bg-live/10 px-3 py-2 text-sm font-medium text-live"
                    : "rounded-xl bg-primary/10 px-3 py-2 text-sm font-medium text-primary"
                }
              >
                {status.text}
              </p>
            )}

            <Button type="submit" className="w-full">
              <KeyRound aria-hidden />
              {isRegister ? t("register") : t("signIn")}
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs font-medium text-muted-foreground">
            <span aria-hidden className="h-px flex-1 bg-border" />
            {t("orDivider")}
            <span aria-hidden className="h-px flex-1 bg-border" />
          </div>

          <GoogleSignInButton next={next} />

          <Link
            href={isRegister ? "/login" : "/register"}
            className="mt-4 block text-center text-sm font-semibold text-primary hover:underline"
          >
            {isRegister ? t("switchToSignIn") : t("switchToRegister")}
          </Link>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            {t("redirectNotice", { path: localizedPath(locale, "/dashboard") })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
