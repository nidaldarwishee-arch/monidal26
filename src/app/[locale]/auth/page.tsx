import { redirect } from "next/navigation";
import { localizedPath } from "@/lib/supabase/auth";

export default async function AuthPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(localizedPath(locale, "/login"));
}
