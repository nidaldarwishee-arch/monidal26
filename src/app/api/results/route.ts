import { NextRequest, NextResponse } from "next/server";
import { MATCH_MAP } from "@/data/matches";
import { getSupabaseServer } from "@/lib/supabase/server";

/**
 * POST /api/results — admin only.
 * Body: { matchN, homeGoals, awayGoals, winner?, status? }
 * Publishing a result automatically recalculates standings and the bracket
 * (both are derived on read).
 */
export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured. Demo mode stores results in the browser." },
      { status: 501 }
    );
  }
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin role required" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const matchN = Number(body?.matchN);
  const homeGoals = Number(body?.homeGoals);
  const awayGoals = Number(body?.awayGoals);
  const winner = typeof body?.winner === "string" ? body.winner : null;
  const status = body?.status === "live" ? "live" : "played";

  const match = MATCH_MAP[matchN];
  if (!match || !Number.isInteger(homeGoals) || !Number.isInteger(awayGoals)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (match.r !== "GS" && homeGoals === awayGoals && !winner && status === "played") {
    return NextResponse.json(
      { error: "Knockout draws need a winner (extra time / penalties)" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("match_results").upsert(
    {
      match_n: matchN,
      home_goals: homeGoals,
      away_goals: awayGoals,
      winner_team: winner,
      status,
      official: true,
      updated_by: auth.user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "match_n" }
  );
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("admin_logs").insert({
    user_id: auth.user.id,
    action: "publish_result",
    detail: { matchN, homeGoals, awayGoals, winner, status },
  });

  return NextResponse.json({ ok: true });
}
