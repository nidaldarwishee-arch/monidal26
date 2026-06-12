import { NextRequest, NextResponse } from "next/server";
import { MATCHES } from "@/data/matches";
import { TEAM_MAP } from "@/data/teams";
import { buildICS } from "@/lib/ics";
import { getResolvedServer } from "@/lib/server-data";
import type { Match } from "@/lib/types";

/**
 * GET /api/calendar/ics?scope=...&locale=en|ar
 * Scopes:
 *   all                — every match
 *   matches:1,7,104    — specific match numbers
 *   team:MEX           — one team's group matches (+ resolved knockouts)
 *   teams:MEX,EGY      — several teams
 *   group:A            — one group's six matches
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const scope = searchParams.get("scope") ?? "all";
  const locale = searchParams.get("locale") === "ar" ? "ar" : "en";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  let matches: Match[] = [];
  let name = "world-cup-2026";

  if (scope === "all") {
    matches = MATCHES;
  } else if (scope.startsWith("matches:")) {
    const ns = new Set(
      scope
        .slice(8)
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isInteger(n))
    );
    matches = MATCHES.filter((m) => ns.has(m.n));
    name = "world-cup-2026-selection";
  } else if (scope.startsWith("team:") || scope.startsWith("teams:")) {
    const ids = scope
      .slice(scope.indexOf(":") + 1)
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter((id) => TEAM_MAP[id]);
    if (ids.length === 0) {
      return NextResponse.json({ error: "Unknown team" }, { status: 400 });
    }
    // Resolve the bracket so knockout matches a team has reached are included,
    // materializing resolved team ids into the slots for correct event titles.
    const resolved = await getResolvedServer();
    matches = [...resolved.values()]
      .filter(
        (m) =>
          (m.home.teamId && ids.includes(m.home.teamId)) ||
          (m.away.teamId && ids.includes(m.away.teamId))
      )
      .map((m) => ({ ...m, h: m.home.teamId ?? m.h, a: m.away.teamId ?? m.a }));
    name = `world-cup-2026-${ids.join("-").toLowerCase()}`;
  } else if (scope.startsWith("group:")) {
    const g = scope.slice(6).toUpperCase();
    matches = MATCHES.filter((m) => m.g === g);
    if (matches.length === 0) {
      return NextResponse.json({ error: "Unknown group" }, { status: 400 });
    }
    name = `world-cup-2026-group-${g.toLowerCase()}`;
  } else {
    return NextResponse.json({ error: "Unknown scope" }, { status: 400 });
  }

  if (matches.length === 0) {
    return NextResponse.json({ error: "No matches in scope" }, { status: 404 });
  }

  const ics = buildICS(matches, locale, siteUrl);
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}.ics"`,
      "Cache-Control": "public, s-maxage=300",
    },
  });
}
