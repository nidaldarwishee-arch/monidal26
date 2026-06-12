import { NextResponse } from "next/server";
import { MATCHES } from "@/data/matches";
import { nextMatchOf } from "@/lib/bracket";
import { getResolvedServer } from "@/lib/server-data";

/** GET /api/bracket — resolved knockout matches + progression connections. */
export async function GET() {
  const resolved = await getResolvedServer();
  const knockout = [...resolved.values()].filter((m) => m.r !== "GS");

  const connections = MATCHES.filter((m) => m.r !== "GS" && m.r !== "F").map((m) => {
    const { winnerTo, loserTo } = nextMatchOf(m.n);
    return { from: m.n, winnerTo: winnerTo ?? null, loserTo: loserTo ?? null };
  });

  return NextResponse.json(
    { knockout, connections },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
