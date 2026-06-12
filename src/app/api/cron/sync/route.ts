import { NextRequest, NextResponse } from "next/server";
import { MATCHES } from "@/data/matches";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  recalculatePredictionScores,
  syncFinishedResults,
  syncFixtures,
  syncLiveScores,
  updateBracketAfterResult,
  updateStandingsAfterResult,
} from "@/lib/live-scores/service";

/**
 * GET/POST /api/cron/sync?task=auto|live|results|fixtures
 *
 * Scheduler-driven sync, authorized with `Authorization: Bearer ${CRON_SECRET}`
 * (Vercel Cron sends this header automatically when CRON_SECRET is set).
 *
 * `auto` (default) is designed for a frequent external scheduler: outside a
 * match window it returns without touching the database or any provider, so
 * a one-minute cadence never burns free-tier API quota on idle days. Inside a
 * window it syncs live scores, then final results; standings, bracket and
 * prediction recalculation only run when a final result actually changed.
 */

const LIVE_WINDOW_BEFORE_MS = 10 * 60 * 1000; // start syncing 10 min before kickoff
const LIVE_WINDOW_AFTER_MS = 3.5 * 60 * 60 * 1000; // until ~3.5h after (covers ET + pens)

function liveWindowMatchCount(now: number): number {
  let count = 0;
  for (const m of MATCHES) {
    const kickoff = new Date(m.t).getTime();
    if (now >= kickoff - LIVE_WINDOW_BEFORE_MS && now <= kickoff + LIVE_WINDOW_AFTER_MS) {
      count += 1;
    }
  }
  return count;
}

async function runResultsChain() {
  const results = await syncFinishedResults();
  if (results.updated === 0) return { results };

  const standings = await updateStandingsAfterResult();
  const bracket = await updateBracketAfterResult();
  const predictions = await recalculatePredictionScores();
  return {
    results,
    standings: { groups: Object.keys(standings.standings).length },
    bracket: { knockoutMatches: bracket.knockout.length },
    predictions: { users: predictions.users },
  };
}

async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Cron is not configured. Set CRON_SECRET." }, { status: 501 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 501 });
  }

  const task = req.nextUrl.searchParams.get("task") ?? "auto";

  try {
    switch (task) {
      case "fixtures":
        return NextResponse.json({ task, fixtures: await syncFixtures() });
      case "live":
        return NextResponse.json({ task, live: await syncLiveScores() });
      case "results":
        return NextResponse.json({ task, ...(await runResultsChain()) });
      case "auto": {
        const windowMatches = liveWindowMatchCount(Date.now());
        if (windowMatches === 0) {
          return NextResponse.json({
            task,
            skipped: true,
            message: "No matches in the live window.",
          });
        }
        const live = await syncLiveScores();
        return NextResponse.json({ task, windowMatches, live, ...(await runResultsChain()) });
      }
      default:
        return NextResponse.json({ error: "Unknown task." }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cron sync failed." },
      { status: 500 }
    );
  }
}

export { handle as GET, handle as POST };
