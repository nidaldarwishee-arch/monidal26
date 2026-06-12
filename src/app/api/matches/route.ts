import { NextRequest, NextResponse } from "next/server";
import { getResolvedServer } from "@/lib/server-data";
import { localDateKey } from "@/lib/time";

/**
 * GET /api/matches
 * Optional filters: ?round=GS|R32|R16|QF|SF|3P|F  ?group=A..L  ?team=MEX
 *                   ?venue=azteca  ?date=2026-06-11 (UTC date)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const round = searchParams.get("round");
  const group = searchParams.get("group");
  const team = searchParams.get("team");
  const venue = searchParams.get("venue");
  const date = searchParams.get("date");

  const resolved = await getResolvedServer();
  let list = [...resolved.values()];

  if (round) list = list.filter((m) => m.r === round);
  if (group) list = list.filter((m) => m.g === group);
  if (venue) list = list.filter((m) => m.v === venue);
  if (date) list = list.filter((m) => localDateKey(m.t, "UTC") === date);
  if (team)
    list = list.filter(
      (m) => m.home.teamId === team || m.away.teamId === team
    );

  return NextResponse.json(
    { count: list.length, matches: list },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
