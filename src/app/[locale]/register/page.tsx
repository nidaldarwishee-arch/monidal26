import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthForm } from "@/components/auth-form";
import { normalizeNextPath } from "@/lib/supabase/auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("registerTitle") };
}

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { locale } = await params;
  const search = await searchParams;
  setRequestLocale(locale);

  return (
    <AuthForm
      mode="register"
      locale={locale}
      next={normalizeNextPath(search.next, locale)}
      error={search.error}
    />
  );
}
