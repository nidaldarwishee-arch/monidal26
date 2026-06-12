import { NextResponse } from "next/server";
import { GROUPS, type GroupId, type StandingRow } from "@/lib/types";
import { computeGroupStandings, rankThirdPlaced } from "@/lib/standings";
import { toResultsMap } from "@/lib/bracket";
import { getOfficialResultsServer } from "@/lib/supabase/server";

/** GET /api/standings — live tables for all 12 groups + third-place ranking. */
export async function GET() {
  const results = toResultsMap(await getOfficialResultsServer());
  const standingsMap = new Map<GroupId, StandingRow[]>(
    GROUPS.map((g) => [g, computeGroupStandings(g, results)])
  );

  return NextResponse.json(
    {
      standings: Object.fromEntries(standingsMap),
      thirdPlaced: rankThirdPlaced(standingsMap),
    },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
