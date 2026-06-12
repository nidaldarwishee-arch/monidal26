import { resolveBracket, toResultsMap } from "@/lib/bracket";
import { getOfficialResultsServer } from "@/lib/supabase/server";
import type { ResolvedMatch } from "@/lib/types";

/** Server-side resolved tournament state (seed + database results). */
export async function getResolvedServer(): Promise<Map<number, ResolvedMatch>> {
  const results = await getOfficialResultsServer();
  return resolveBracket(toResultsMap(results));
}
