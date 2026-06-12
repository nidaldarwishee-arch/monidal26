"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import {
  getRequiredSupabaseConfig,
  getSupabaseConfig,
  isSupabaseConfigured,
} from "@/lib/supabase/env";

export { isSupabaseConfigured };

type BrowserClient = SupabaseClient<Database>;

let client: BrowserClient | null = null;

export function createClient(): BrowserClient {
  if (!client) {
    const { url, key } = getRequiredSupabaseConfig();
    client = createBrowserClient<Database>(url, key) as unknown as BrowserClient;
  }
  return client;
}

/** Browser Supabase client, or null when the app runs in local demo mode. */
export function getSupabaseBrowser(): BrowserClient | null {
  const config = getSupabaseConfig();
  if (!config) return null;
  return createClient();
}
