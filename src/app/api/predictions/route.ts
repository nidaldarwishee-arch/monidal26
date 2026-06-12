import { NextRequest, NextResponse } from "next/server";
import { MATCH_MAP } from "@/data/matches";
import { hasKickedOff } from "@/lib/time";
import { getSupabaseServer } from "@/lib/supabase/server";

/** GET /api/predictions — the signed-in user's predictions. */
export async function GET() {
  const supabase = await getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured. Demo mode stores predictions in the browser." },
      { status: 501 }
    );
  }
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { data, error } = await supabase
    .from("user_predictions")
    .select("match_n, home_goals, away_goals, winner_team, updated_at")
    .eq("user_id", auth.user.id)
    .order("match_n");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ predictions: data });
}

/**
 * POST /api/predictions
 * Body: { matchN, homeGoals, awayGoals, winner? }
 * Editing closes at kickoff (also enforced by RLS).
 */
export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured. Demo mode stores predictions in the browser." },
      { status: 501 }
    );
  }
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const matchN = Number(body?.matchN);
  const homeGoals = Number(body?.homeGoals);
  const awayGoals = Number(body?.awayGoals);
  const winner = typeof body?.winner === "string" ? body.winner : null;

  const match = MATCH_MAP[matchN];
  if (!match || !Number.isInteger(homeGoals) || !Number.isInteger(awayGoals)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (homeGoals < 0 || homeGoals > 20 || awayGoals < 0 || awayGoals > 20) {
    return NextResponse.json({ error: "Goals out of range" }, { status: 400 });
  }
  if (hasKickedOff(match.t)) {
    return NextResponse.json(
      { error: "Predictions are locked at kickoff" },
      { status: 403 }
    );
  }

  const { error } = await supabase.from("user_predictions").upsert(
    {
      user_id: auth.user.id,
      match_n: matchN,
      home_goals: homeGoals,
      away_goals: awayGoals,
      winner_team: winner,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,match_n" }
  );
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
