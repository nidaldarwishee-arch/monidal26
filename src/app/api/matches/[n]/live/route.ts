import { NextRequest, NextResponse } from "next/server";
import { parseMatchNumberParam } from "@/lib/api/params";
import { getLiveMatchSnapshot } from "@/lib/live-scores/service";

/** GET /api/matches/[n]/live - one match's current live/result snapshot. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ n: string }> }
) {
  const { n } = await params;
  const matchN = parseMatchNumberParam(n);
  if (!matchN) return NextResponse.json({ error: "Invalid match number." }, { status: 400 });

  const live = await getLiveMatchSnapshot(matchN);
  if (!live) return NextResponse.json({ error: "Match not found." }, { status: 404 });

  return NextResponse.json(
    { live },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
  );
}
