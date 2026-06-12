import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin-dashboard";
import { getCurrentProfile, localizedPath, requireUser } from "@/lib/supabase/auth";
import { isSupabaseConfiguredServer } from "@/lib/supabase/server";

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

  // Demo mode (no Supabase) keeps the local-state admin tools; with Supabase
  // configured, only signed-in admins may load the page at all.
  if (isSupabaseConfiguredServer()) {
    await requireUser(locale, localizedPath(locale, "/admin"));
    const profile = await getCurrentProfile();
    if (profile?.role !== "admin") {
      redirect(localizedPath(locale, "/dashboard"));
    }
  }

  return <AdminDashboard />;
}
