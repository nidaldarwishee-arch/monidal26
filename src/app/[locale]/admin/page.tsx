import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin-dashboard";
import { getCurrentProfile, localizedPath, requireUser } from "@/lib/supabase/auth";
import { isSupabaseConfiguredServer } from "@/lib/supabase/server";
import type { UserProfile } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: t("title"), robots: { index: false } };
}

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Demo mode keeps local-state admin tools; with Supabase configured only
  // signed-in admins reach this page.
  if (isSupabaseConfiguredServer()) {
    const user = await requireUser(locale, localizedPath(locale, "/admin"));
    const profile = await getCurrentProfile();
    if (profile?.role !== "admin") {
      redirect(localizedPath(locale, "/dashboard"));
    }

    const initialUser: UserProfile = {
      id: user.id,
      name: profile?.display_name ?? user.email ?? "Admin",
      email: user.email ?? "",
      role: "admin",
    };

    return <AdminDashboard initialUser={initialUser} />;
  }

  return <AdminDashboard />;
}
