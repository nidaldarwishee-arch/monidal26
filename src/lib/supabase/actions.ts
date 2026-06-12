"use server";

import { redirect } from "next/navigation";
import { createClient, getSupabaseServer } from "@/lib/supabase/server";
import {
  localizedPath,
  normalizeNextPath,
} from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { touchLastLogin } from "@/lib/dashboard/service";

function normalizeLocale(value: FormDataEntryValue | null): "en" | "ar" {
  return value === "ar" ? "ar" : "en";
}

function authRedirect(
  locale: string,
  route: "/login" | "/register",
  params: Record<string, string>
): never {
  const search = new URLSearchParams(params);
  redirect(`${localizedPath(locale, route)}?${search.toString()}`);
}

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("name") ?? "").trim();
  return { email, password, displayName };
}

export async function signInAction(formData: FormData) {
  const locale = normalizeLocale(formData.get("locale"));
  const next = normalizeNextPath(formData.get("next"), locale);
  const { email, password } = readCredentials(formData);

  if (!isSupabaseConfigured()) {
    authRedirect(locale, "/login", { error: "config", next });
  }

  if (!email || !password) {
    authRedirect(locale, "/login", { error: "invalid", next });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const unconfirmed =
      error.code === "email_not_confirmed" ||
      error.message.toLowerCase().includes("not confirmed");
    authRedirect(locale, "/login", { error: unconfirmed ? "unconfirmed" : "invalid", next });
  }

  if (data.user) {
    await touchLastLogin(supabase, data.user.id);
  }

  redirect(next);
}

export async function signUpAction(formData: FormData) {
  const locale = normalizeLocale(formData.get("locale"));
  const next = normalizeNextPath(formData.get("next"), locale);
  const { email, password, displayName } = readCredentials(formData);

  if (!isSupabaseConfigured()) {
    authRedirect(locale, "/register", { error: "config", next });
  }

  if (!email || password.length < 8) {
    authRedirect(locale, "/register", { error: "invalid", next });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const redirectTo = new URL("/auth/callback", siteUrl);
  redirectTo.searchParams.set("next", next);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: redirectTo.toString(),
    },
  });

  if (error) {
    authRedirect(locale, "/register", { error: "generic", next });
  }

  if (!data.session) {
    authRedirect(locale, "/login", { message: "verify", next });
  }

  if (data.user) {
    await touchLastLogin(supabase, data.user.id);
  }

  redirect(next);
}

export async function signOutAction(formData: FormData) {
  const locale = normalizeLocale(formData.get("locale"));
  const supabase = await getSupabaseServer();
  if (supabase) {
    await supabase.auth.signOut();
  }
  redirect(localizedPath(locale, "/login"));
}
