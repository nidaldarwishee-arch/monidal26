import { NextResponse } from "next/server";
import { fetchLiveMatches } from "@/lib/live-scores/service";

/** GET /api/live-scores - current live/halftime scores from provider cache or database fallback. */
export async function GET() {
  const matches = await fetchLiveMatches();
  return NextResponse.json(
    { count: matches.length, matches },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
  );
}
