import { NextResponse } from "next/server";
import { TEAMS } from "@/data/teams";
import { MATCHES } from "@/data/matches";
import { GROUPS } from "@/lib/types";

/** GET /api/groups — groups with their teams and fixtures. */
export async function GET() {
  const groups = GROUPS.map((g) => ({
    id: g,
    teams: TEAMS.filter((t) => t.group === g),
    matchNumbers: MATCHES.filter((m) => m.g === g).map((m) => m.n),
  }));

  return NextResponse.json(
    { groups },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
  );
}
