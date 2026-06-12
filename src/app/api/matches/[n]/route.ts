import { NextRequest, NextResponse } from "next/server";
import { MATCH_MAP } from "@/data/matches";
import { nextMatchOf, relatedMatches } from "@/lib/bracket";
import { getResolvedServer } from "@/lib/server-data";

/** GET /api/matches/[n] — one match with progression links. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ n: string }> }
) {
  const { n } = await params;
  const num = Number(n);
  const match = MATCH_MAP[num];
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  const resolved = await getResolvedServer();
  const { winnerTo, loserTo } = nextMatchOf(num);

  return NextResponse.json(
    {
      match: resolved.get(num),
      winnerTo,
      loserTo,
      feeders: relatedMatches(match).map((m) => resolved.get(m.n)),
    },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
