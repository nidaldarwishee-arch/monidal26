import type {
  GroupId,
  Match,
  MatchResult,
  ResolvedMatch,
  ResolvedSlot,
  SlotPlaceholder,
  StandingRow,
} from "@/lib/types";
import { GROUPS } from "@/lib/types";
import { MATCHES, MATCH_MAP } from "@/data/matches";
import {
  computeGroupStandings,
  isGroupComplete,
  rankThirdPlaced,
  type ResultsMap,
} from "@/lib/standings";

/** Parses a TeamSlot string into an i18n-ready placeholder. */
export function parseSlot(slot: string): SlotPlaceholder {
  if (/^[12][A-L]$/.test(slot)) {
    const group = slot[1] as GroupId;
    return slot[0] === "1"
      ? { kind: "winner-group", group }
      : { kind: "runner-up-group", group };
  }
  if (slot.startsWith("3:")) return { kind: "third-place", groups: slot.slice(2) };
  if (/^W\d+$/.test(slot)) return { kind: "winner-match", match: Number(slot.slice(1)) };
  if (/^L\d+$/.test(slot)) return { kind: "loser-match", match: Number(slot.slice(1)) };
  return { kind: "team", teamId: slot };
}

/** Winner team id of a finished match, or undefined. */
export function matchWinner(m: Match, r: MatchResult | undefined, home?: string, away?: string): string | undefined {
  if (!r || r.status !== "played") return undefined;
  const h = home ?? m.h;
  const a = away ?? m.a;
  if (r.homeGoals > r.awayGoals) return h;
  if (r.awayGoals > r.homeGoals) return a;
  return r.winner; // knockout draw decided in extra time / penalties
}

export function matchLoser(m: Match, r: MatchResult | undefined, home?: string, away?: string): string | undefined {
  const w = matchWinner(m, r, home, away);
  if (!w) return undefined;
  const h = home ?? m.h;
  const a = away ?? m.a;
  return w === h ? a : h;
}

/**
 * Assigns the 8 qualified third-placed teams to the Round-of-32 slots whose
 * allowed group sets contain them (FIFA allocation). Solved with simple
 * backtracking over the 8 slots, most-constrained slot first.
 */
function allocateThirdPlaces(
  qualified: { teamId: string; group: GroupId }[]
): Map<string, string> {
  const slots = MATCHES.filter((m) => m.r === "R32" && m.a.startsWith("3:")).map(
    (m) => ({
      key: m.a,
      matchN: m.n,
      allowed: new Set(m.a.slice(2).split("") as GroupId[]),
    })
  );
  const byGroup = new Map(qualified.map((q) => [q.group, q.teamId]));

  const ordered = [...slots].sort(
    (a, b) =>
      [...a.allowed].filter((g) => byGroup.has(g)).length -
      [...b.allowed].filter((g) => byGroup.has(g)).length
  );

  const assignment = new Map<number, string>(); // matchN -> teamId
  const used = new Set<GroupId>();

  function solve(i: number): boolean {
    if (i === ordered.length) return true;
    const slot = ordered[i];
    for (const g of slot.allowed) {
      if (used.has(g) || !byGroup.has(g)) continue;
      used.add(g);
      assignment.set(slot.matchN, byGroup.get(g)!);
      if (solve(i + 1)) return true;
      used.delete(g);
      assignment.delete(slot.matchN);
    }
    return false;
  }

  solve(0);
  const out = new Map<string, string>();
  for (const [matchN, teamId] of assignment) out.set(String(matchN), teamId);
  return out;
}

/**
 * Resolves every match slot from the given results: group winners/runners-up
 * once a group is complete, third-place allocation once all groups are
 * complete, and knockout winners/losers as results arrive.
 *
 * Pass official results to render the real bracket, or a user's predictions
 * to preview how their results would propagate through the tournament.
 */
export function resolveBracket(results: ResultsMap): Map<number, ResolvedMatch> {
  const standings = new Map<GroupId, StandingRow[]>();
  const complete = new Map<GroupId, boolean>();
  for (const g of GROUPS) {
    standings.set(g, computeGroupStandings(g, results));
    complete.set(g, isGroupComplete(g, results));
  }

  const allGroupsComplete = GROUPS.every((g) => complete.get(g));
  const thirdAlloc = allGroupsComplete
    ? allocateThirdPlaces(
        rankThirdPlaced(standings).map(({ teamId, group }) => ({ teamId, group }))
      )
    : new Map<string, string>();

  const resolved = new Map<number, ResolvedMatch>();

  const resolveSlot = (slot: string, matchN: number): ResolvedSlot => {
    const placeholder = parseSlot(slot);
    switch (placeholder.kind) {
      case "team":
        return { teamId: placeholder.teamId, placeholder };
      case "winner-group":
      case "runner-up-group": {
        if (!complete.get(placeholder.group)) return { placeholder };
        const rows = standings.get(placeholder.group)!;
        const row = placeholder.kind === "winner-group" ? rows[0] : rows[1];
        return { teamId: row?.teamId, placeholder };
      }
      case "third-place": {
        const teamId = thirdAlloc.get(String(matchN));
        return { teamId, placeholder };
      }
      case "winner-match":
      case "loser-match": {
        const src = resolved.get(
          placeholder.kind === "winner-match" ? placeholder.match : placeholder.match
        );
        if (!src) return { placeholder };
        const r = results.get(src.n);
        const teamId =
          placeholder.kind === "winner-match"
            ? matchWinner(src, r, src.home.teamId, src.away.teamId)
            : matchLoser(src, r, src.home.teamId, src.away.teamId);
        return { teamId, placeholder };
      }
    }
  };

  // MATCHES is ordered 1..104, so source matches resolve before dependents
  for (const m of MATCHES) {
    resolved.set(m.n, {
      ...m,
      home: resolveSlot(m.h, m.n),
      away: resolveSlot(m.a, m.n),
      result: results.get(m.n),
    });
  }
  return resolved;
}

/** The knockout match the winner (and loser) of match `n` advances to. */
export function nextMatchOf(n: number): { winnerTo?: number; loserTo?: number } {
  let winnerTo: number | undefined;
  let loserTo: number | undefined;
  for (const m of MATCHES) {
    if (m.h === `W${n}` || m.a === `W${n}`) winnerTo = m.n;
    if (m.h === `L${n}` || m.a === `L${n}`) loserTo = m.n;
  }
  return { winnerTo, loserTo };
}

/** All matches a team is known to play, given a resolved bracket. */
export function teamJourney(
  teamId: string,
  resolved: Map<number, ResolvedMatch>
): ResolvedMatch[] {
  return [...resolved.values()]
    .filter((m) => m.home.teamId === teamId || m.away.teamId === teamId)
    .sort((a, b) => a.n - b.n);
}

/** Builds a ResultsMap from any list of results/predictions. */
export function toResultsMap(
  list: { matchN: number; homeGoals: number; awayGoals: number; winner?: string; status?: string }[]
): ResultsMap {
  const map: ResultsMap = new Map();
  for (const r of list) {
    map.set(r.matchN, {
      matchN: r.matchN,
      homeGoals: r.homeGoals,
      awayGoals: r.awayGoals,
      winner: r.winner,
      status: (r.status as MatchResult["status"]) ?? "played",
    });
  }
  return map;
}

/** Group matches preceding a knockout path, used for "related matches". */
export function relatedMatches(m: Match): Match[] {
  const related: Match[] = [];
  for (const slot of [m.h, m.a]) {
    const p = parseSlot(slot);
    if (p.kind === "winner-match" || p.kind === "loser-match") {
      const src = MATCH_MAP[p.match];
      if (src) related.push(src);
    }
  }
  return related;
}
