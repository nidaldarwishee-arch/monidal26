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

// Supabase's initialize() refreshes the token via a network POST. If that
// call hangs (slow network, paused project), initializePromise never resolves,
// onAuthStateChange never fires, and loading stays true forever. A 6-second
// timeout on every Supabase network call prevents this.
function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 6_000);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(id));
}

export function createClient(): BrowserClient {
  if (!client) {
    const { url, key } = getRequiredSupabaseConfig();
    client = createBrowserClient<Database>(url, key, {
      global: { fetch: fetchWithTimeout },
    }) as unknown as BrowserClient;
  }
  return client;
}

/** Browser Supabase client, or null when the app runs in local demo mode. */
export function getSupabaseBrowser(): BrowserClient | null {
  const config = getSupabaseConfig();
  if (!config) return null;
  return createClient();
}
