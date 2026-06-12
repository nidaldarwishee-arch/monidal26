import { setRequestLocale, getTranslations } from "next-intl/server";
import { UserDashboard } from "@/components/user-dashboard";
import { localizedPath, requireUser } from "@/lib/supabase/auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return { title: t("title") };
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireUser(locale, localizedPath(locale, "/dashboard"));
  return <UserDashboard />;
}
