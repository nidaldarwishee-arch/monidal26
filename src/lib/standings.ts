import type {
  GroupId,
  Match,
  MatchResult,
  StandingRow,
} from "@/lib/types";
import { MATCHES } from "@/data/matches";
import { TEAMS } from "@/data/teams";

export type ResultsMap = Map<number, MatchResult>;

interface Tally {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
}

function emptyTally(teamId: string): Tally {
  return { teamId, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0 };
}

function applyMatch(t: Tally, scored: number, conceded: number) {
  t.played += 1;
  t.gf += scored;
  t.ga += conceded;
  if (scored > conceded) t.won += 1;
  else if (scored === conceded) t.drawn += 1;
  else t.lost += 1;
}

const pts = (t: Tally) => t.won * 3 + t.drawn;
const gd = (t: Tally) => t.gf - t.ga;

/**
 * Sorts tallies using FIFA group tiebreakers:
 * points → goal difference → goals for → head-to-head points → head-to-head
 * GD → head-to-head GF → alphabetical (stand-in for drawing of lots).
 */
function sortTallies(tallies: Tally[], groupMatches: Match[], results: ResultsMap): Tally[] {
  const overall = (a: Tally, b: Tally) =>
    pts(b) - pts(a) || gd(b) - gd(a) || b.gf - a.gf;

  const sorted = [...tallies].sort(overall);

  // Resolve remaining ties with head-to-head mini-tables
  const out: Tally[] = [];
  let i = 0;
  while (i < sorted.length) {
    let j = i + 1;
    while (j < sorted.length && overall(sorted[i], sorted[j]) === 0) j++;
    const tied = sorted.slice(i, j);
    if (tied.length > 1) {
      const ids = new Set(tied.map((t) => t.teamId));
      const mini = new Map(tied.map((t) => [t.teamId, emptyTally(t.teamId)]));
      for (const m of groupMatches) {
        const r = results.get(m.n);
        if (!r || !ids.has(m.h) || !ids.has(m.a)) continue;
        applyMatch(mini.get(m.h)!, r.homeGoals, r.awayGoals);
        applyMatch(mini.get(m.a)!, r.awayGoals, r.homeGoals);
      }
      tied.sort((a, b) => {
        const ma = mini.get(a.teamId)!;
        const mb = mini.get(b.teamId)!;
        return (
          pts(mb) - pts(ma) ||
          gd(mb) - gd(ma) ||
          mb.gf - ma.gf ||
          a.teamId.localeCompare(b.teamId)
        );
      });
    }
    out.push(...tied);
    i = j;
  }
  return out;
}

/** Computes the standings table for one group from the given results. */
export function computeGroupStandings(
  group: GroupId,
  results: ResultsMap
): StandingRow[] {
  const groupMatches = MATCHES.filter((m) => m.r === "GS" && m.g === group);
  const tallies = new Map<string, Tally>(
    TEAMS.filter((t) => t.group === group).map((t) => [t.id, emptyTally(t.id)])
  );
  for (const m of groupMatches) {
    const r = results.get(m.n);
    if (!r) continue;
    applyMatch(tallies.get(m.h)!, r.homeGoals, r.awayGoals);
    applyMatch(tallies.get(m.a)!, r.awayGoals, r.homeGoals);
  }
  const sorted = sortTallies([...tallies.values()], groupMatches, results);
  return sorted.map((t, idx) => ({
    teamId: t.teamId,
    played: t.played,
    won: t.won,
    drawn: t.drawn,
    lost: t.lost,
    gf: t.gf,
    ga: t.ga,
    gd: gd(t),
    pts: pts(t),
    pos: idx + 1,
  }));
}

/** True when all six matches of a group have a result. */
export function isGroupComplete(group: GroupId, results: ResultsMap): boolean {
  return MATCHES.filter((m) => m.r === "GS" && m.g === group).every((m) =>
    results.has(m.n)
  );
}

/**
 * Ranks the 12 third-placed teams and returns the 8 qualified ones in ranking
 * order. Only meaningful once every group is complete.
 */
export function rankThirdPlaced(
  standingsByGroup: Map<GroupId, StandingRow[]>
): { teamId: string; group: GroupId; row: StandingRow }[] {
  const thirds: { teamId: string; group: GroupId; row: StandingRow }[] = [];
  for (const [group, rows] of standingsByGroup) {
    const third = rows[2];
    if (third) thirds.push({ teamId: third.teamId, group, row: third });
  }
  thirds.sort(
    (a, b) =>
      b.row.pts - a.row.pts ||
      b.row.gd - a.row.gd ||
      b.row.gf - a.row.gf ||
      a.teamId.localeCompare(b.teamId)
  );
  return thirds.slice(0, 8);
}
