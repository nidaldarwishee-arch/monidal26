import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient, getSupabaseServer } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type AppLocale = "en" | "ar";
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function localizedPath(locale: string, path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return locale === "ar" ? `/ar${cleanPath === "/" ? "" : cleanPath}` : cleanPath;
}

export function normalizeNextPath(value: FormDataEntryValue | string | null | undefined, locale: string): string {
  const fallback = localizedPath(locale, "/dashboard");
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }
  return value;
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await getSupabaseServer();
  if (!supabase) return null;

  // getUser() validates the JWT server-side with Supabase auth servers.
  // Removed getClaims() (local JWT parse) — it can return false negatives when
  // claims structure varies and is redundant with the getUser() network call.
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export async function requireUser(locale: string, nextPath?: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    const next = encodeURIComponent(nextPath ?? localizedPath(locale, "/dashboard"));
    redirect(`${localizedPath(locale, "/login")}?next=${next}`);
  }
  return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return data;
}
