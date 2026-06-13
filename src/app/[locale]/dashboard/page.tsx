import { setRequestLocale, getTranslations } from "next-intl/server";
import { UserDashboard } from "@/components/user-dashboard";
import { localizedPath, requireUser, getCurrentProfile } from "@/lib/supabase/auth";
import type { UserProfile } from "@/lib/types";

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

  // Server-side auth check: redirect to login if not signed in.
  // We also pass the confirmed user to the client so it can render
  // immediately without waiting for the browser-side auth SDK.
  const user = await requireUser(locale, localizedPath(locale, "/dashboard"));
  const profile = await getCurrentProfile();

  const initialUser: UserProfile = {
    id: user.id,
    name: profile?.display_name ?? user.email ?? "User",
    email: user.email ?? "",
    role: profile?.role === "admin" ? "admin" : "user",
  };

  return <UserDashboard initialUser={initialUser} />;
}
