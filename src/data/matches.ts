import type { Match } from "@/lib/types";

/**
 * The complete 104-match schedule of the FIFA World Cup 2026.
 *
 * Kickoff times are stored in UTC (converted from the official local kickoff
 * times). Knockout slots use the placeholder notation documented in
 * `TeamSlot` ("1A" group winner, "2A" runner-up, "3:ABCDF" best third from a
 * group set, "W73"/"L101" winner/loser of a match).
 */
export const MATCHES: Match[] = [
  // ───────────────────────── Group stage — Matchday 1 ─────────────────────────
  // June 11
  { n: 1, r: "GS", g: "A", h: "MEX", a: "RSA", t: "2026-06-11T19:00:00Z", v: "azteca" },
  { n: 2, r: "GS", g: "A", h: "KOR", a: "CZE", t: "2026-06-12T02:00:00Z", v: "akron" },
  // June 12
  { n: 3, r: "GS", g: "B", h: "CAN", a: "BIH", t: "2026-06-12T19:00:00Z", v: "bmo" },
  { n: 4, r: "GS", g: "D", h: "USA", a: "PAR", t: "2026-06-13T01:00:00Z", v: "sofi" },
  // June 13
  { n: 5, r: "GS", g: "C", h: "HAI", a: "SCO", t: "2026-06-14T01:00:00Z", v: "gillette" },
  { n: 6, r: "GS", g: "D", h: "AUS", a: "TUR", t: "2026-06-14T04:00:00Z", v: "bcplace" },
  { n: 7, r: "GS", g: "C", h: "BRA", a: "MAR", t: "2026-06-13T22:00:00Z", v: "metlife" },
  { n: 8, r: "GS", g: "B", h: "QAT", a: "SUI", t: "2026-06-13T19:00:00Z", v: "levis" },
  // June 14
  { n: 9, r: "GS", g: "E", h: "CIV", a: "ECU", t: "2026-06-14T23:00:00Z", v: "lincoln" },
  { n: 10, r: "GS", g: "E", h: "GER", a: "CUW", t: "2026-06-14T17:00:00Z", v: "nrg" },
  { n: 11, r: "GS", g: "F", h: "NED", a: "JPN", t: "2026-06-14T20:00:00Z", v: "att" },
  { n: 12, r: "GS", g: "F", h: "SWE", a: "TUN", t: "2026-06-15T02:00:00Z", v: "bbva" },
  // June 15
  { n: 13, r: "GS", g: "H", h: "KSA", a: "URU", t: "2026-06-15T22:00:00Z", v: "hardrock" },
  { n: 14, r: "GS", g: "H", h: "ESP", a: "CPV", t: "2026-06-15T16:00:00Z", v: "mercedes" },
  { n: 15, r: "GS", g: "G", h: "IRN", a: "NZL", t: "2026-06-16T01:00:00Z", v: "sofi" },
  { n: 16, r: "GS", g: "G", h: "BEL", a: "EGY", t: "2026-06-15T19:00:00Z", v: "lumen" },
  // June 16
  { n: 17, r: "GS", g: "I", h: "FRA", a: "SEN", t: "2026-06-16T19:00:00Z", v: "metlife" },
  { n: 18, r: "GS", g: "I", h: "IRQ", a: "NOR", t: "2026-06-16T22:00:00Z", v: "gillette" },
  { n: 19, r: "GS", g: "J", h: "ARG", a: "ALG", t: "2026-06-17T01:00:00Z", v: "arrowhead" },
  { n: 20, r: "GS", g: "J", h: "AUT", a: "JOR", t: "2026-06-17T04:00:00Z", v: "levis" },
  // June 17
  { n: 21, r: "GS", g: "L", h: "ENG", a: "CRO", t: "2026-06-17T20:00:00Z", v: "att" },
  { n: 22, r: "GS", g: "L", h: "GHA", a: "PAN", t: "2026-06-17T23:00:00Z", v: "bmo" },
  { n: 23, r: "GS", g: "K", h: "POR", a: "COD", t: "2026-06-17T17:00:00Z", v: "nrg" },
  { n: 24, r: "GS", g: "K", h: "UZB", a: "COL", t: "2026-06-18T02:00:00Z", v: "azteca" },

  // ───────────────────────── Group stage — Matchday 2 ─────────────────────────
  // June 18
  { n: 25, r: "GS", g: "A", h: "CZE", a: "RSA", t: "2026-06-18T16:00:00Z", v: "mercedes" },
  { n: 26, r: "GS", g: "B", h: "SUI", a: "BIH", t: "2026-06-18T19:00:00Z", v: "sofi" },
  { n: 27, r: "GS", g: "B", h: "CAN", a: "QAT", t: "2026-06-18T22:00:00Z", v: "bcplace" },
  { n: 28, r: "GS", g: "A", h: "MEX", a: "KOR", t: "2026-06-19T01:00:00Z", v: "akron" },
  // June 19
  { n: 29, r: "GS", g: "C", h: "BRA", a: "HAI", t: "2026-06-20T00:30:00Z", v: "lincoln" },
  { n: 30, r: "GS", g: "C", h: "SCO", a: "MAR", t: "2026-06-19T22:00:00Z", v: "gillette" },
  { n: 31, r: "GS", g: "D", h: "TUR", a: "PAR", t: "2026-06-20T03:00:00Z", v: "levis" },
  { n: 32, r: "GS", g: "D", h: "USA", a: "AUS", t: "2026-06-19T19:00:00Z", v: "lumen" },
  // June 20
  { n: 33, r: "GS", g: "E", h: "GER", a: "CIV", t: "2026-06-20T20:00:00Z", v: "bmo" },
  { n: 34, r: "GS", g: "E", h: "ECU", a: "CUW", t: "2026-06-21T00:00:00Z", v: "arrowhead" },
  { n: 35, r: "GS", g: "F", h: "NED", a: "SWE", t: "2026-06-20T17:00:00Z", v: "nrg" },
  { n: 36, r: "GS", g: "F", h: "TUN", a: "JPN", t: "2026-06-21T04:00:00Z", v: "bbva" },
  // June 21
  { n: 37, r: "GS", g: "H", h: "URU", a: "CPV", t: "2026-06-21T22:00:00Z", v: "hardrock" },
  { n: 38, r: "GS", g: "H", h: "ESP", a: "KSA", t: "2026-06-21T16:00:00Z", v: "mercedes" },
  { n: 39, r: "GS", g: "G", h: "BEL", a: "IRN", t: "2026-06-21T19:00:00Z", v: "sofi" },
  { n: 40, r: "GS", g: "G", h: "NZL", a: "EGY", t: "2026-06-22T01:00:00Z", v: "bcplace" },
  // June 22
  { n: 41, r: "GS", g: "I", h: "NOR", a: "SEN", t: "2026-06-23T00:00:00Z", v: "metlife" },
  { n: 42, r: "GS", g: "I", h: "FRA", a: "IRQ", t: "2026-06-22T21:00:00Z", v: "lincoln" },
  { n: 43, r: "GS", g: "J", h: "ARG", a: "AUT", t: "2026-06-22T17:00:00Z", v: "att" },
  { n: 44, r: "GS", g: "J", h: "JOR", a: "ALG", t: "2026-06-23T03:00:00Z", v: "levis" },
  // June 23
  { n: 45, r: "GS", g: "L", h: "ENG", a: "GHA", t: "2026-06-23T20:00:00Z", v: "gillette" },
  { n: 46, r: "GS", g: "L", h: "PAN", a: "CRO", t: "2026-06-23T23:00:00Z", v: "bmo" },
  { n: 47, r: "GS", g: "K", h: "POR", a: "UZB", t: "2026-06-23T17:00:00Z", v: "nrg" },
  { n: 48, r: "GS", g: "K", h: "COL", a: "COD", t: "2026-06-24T02:00:00Z", v: "akron" },

  // ───────────────────────── Group stage — Matchday 3 ─────────────────────────
  // June 24 (simultaneous kickoffs per group)
  { n: 49, r: "GS", g: "C", h: "SCO", a: "BRA", t: "2026-06-24T22:00:00Z", v: "hardrock" },
  { n: 50, r: "GS", g: "C", h: "MAR", a: "HAI", t: "2026-06-24T22:00:00Z", v: "mercedes" },
  { n: 51, r: "GS", g: "B", h: "SUI", a: "CAN", t: "2026-06-24T19:00:00Z", v: "bcplace" },
  { n: 52, r: "GS", g: "B", h: "BIH", a: "QAT", t: "2026-06-24T19:00:00Z", v: "lumen" },
  { n: 53, r: "GS", g: "A", h: "CZE", a: "MEX", t: "2026-06-25T01:00:00Z", v: "azteca" },
  { n: 54, r: "GS", g: "A", h: "RSA", a: "KOR", t: "2026-06-25T01:00:00Z", v: "bbva" },
  // June 25
  { n: 55, r: "GS", g: "E", h: "CUW", a: "CIV", t: "2026-06-25T20:00:00Z", v: "lincoln" },
  { n: 56, r: "GS", g: "E", h: "ECU", a: "GER", t: "2026-06-25T20:00:00Z", v: "metlife" },
  { n: 57, r: "GS", g: "F", h: "JPN", a: "SWE", t: "2026-06-25T23:00:00Z", v: "att" },
  { n: 58, r: "GS", g: "F", h: "TUN", a: "NED", t: "2026-06-25T23:00:00Z", v: "arrowhead" },
  { n: 59, r: "GS", g: "D", h: "TUR", a: "USA", t: "2026-06-26T02:00:00Z", v: "sofi" },
  { n: 60, r: "GS", g: "D", h: "PAR", a: "AUS", t: "2026-06-26T02:00:00Z", v: "levis" },
  // June 26
  { n: 61, r: "GS", g: "I", h: "NOR", a: "FRA", t: "2026-06-26T19:00:00Z", v: "gillette" },
  { n: 62, r: "GS", g: "I", h: "SEN", a: "IRQ", t: "2026-06-26T19:00:00Z", v: "bmo" },
  { n: 63, r: "GS", g: "G", h: "EGY", a: "IRN", t: "2026-06-27T03:00:00Z", v: "lumen" },
  { n: 64, r: "GS", g: "G", h: "NZL", a: "BEL", t: "2026-06-27T03:00:00Z", v: "bcplace" },
  { n: 65, r: "GS", g: "H", h: "CPV", a: "KSA", t: "2026-06-27T00:00:00Z", v: "nrg" },
  { n: 66, r: "GS", g: "H", h: "URU", a: "ESP", t: "2026-06-27T00:00:00Z", v: "akron" },
  // June 27
  { n: 67, r: "GS", g: "L", h: "PAN", a: "ENG", t: "2026-06-27T21:00:00Z", v: "metlife" },
  { n: 68, r: "GS", g: "L", h: "CRO", a: "GHA", t: "2026-06-27T21:00:00Z", v: "lincoln" },
  { n: 69, r: "GS", g: "J", h: "ALG", a: "AUT", t: "2026-06-28T02:00:00Z", v: "arrowhead" },
  { n: 70, r: "GS", g: "J", h: "JOR", a: "ARG", t: "2026-06-28T02:00:00Z", v: "att" },
  { n: 71, r: "GS", g: "K", h: "COL", a: "POR", t: "2026-06-27T23:30:00Z", v: "hardrock" },
  { n: 72, r: "GS", g: "K", h: "COD", a: "UZB", t: "2026-06-27T23:30:00Z", v: "mercedes" },

  // ───────────────────────── Round of 32 ─────────────────────────
  { n: 73, r: "R32", h: "2A", a: "2B", t: "2026-06-28T19:00:00Z", v: "sofi" },
  { n: 74, r: "R32", h: "1E", a: "3:ABCDF", t: "2026-06-29T20:30:00Z", v: "gillette" },
  { n: 75, r: "R32", h: "1F", a: "2C", t: "2026-06-30T01:00:00Z", v: "bbva" },
  { n: 76, r: "R32", h: "1C", a: "2F", t: "2026-06-29T17:00:00Z", v: "nrg" },
  { n: 77, r: "R32", h: "1I", a: "3:CDFGH", t: "2026-06-30T21:00:00Z", v: "metlife" },
  { n: 78, r: "R32", h: "2E", a: "2I", t: "2026-06-30T17:00:00Z", v: "att" },
  { n: 79, r: "R32", h: "1A", a: "3:CEFHI", t: "2026-07-01T01:00:00Z", v: "azteca" },
  { n: 80, r: "R32", h: "1L", a: "3:EHIJK", t: "2026-07-01T16:00:00Z", v: "mercedes" },
  { n: 81, r: "R32", h: "1D", a: "3:BEFIJ", t: "2026-07-02T00:00:00Z", v: "levis" },
  { n: 82, r: "R32", h: "1G", a: "3:AEHIJ", t: "2026-07-01T20:00:00Z", v: "lumen" },
  { n: 83, r: "R32", h: "2K", a: "2L", t: "2026-07-02T23:00:00Z", v: "bmo" },
  { n: 84, r: "R32", h: "1H", a: "2J", t: "2026-07-02T19:00:00Z", v: "sofi" },
  { n: 85, r: "R32", h: "1B", a: "3:EFGIJ", t: "2026-07-03T03:00:00Z", v: "bcplace" },
  { n: 86, r: "R32", h: "1J", a: "2H", t: "2026-07-03T22:00:00Z", v: "hardrock" },
  { n: 87, r: "R32", h: "1K", a: "3:DEIJL", t: "2026-07-04T01:30:00Z", v: "arrowhead" },
  { n: 88, r: "R32", h: "2D", a: "2G", t: "2026-07-03T18:00:00Z", v: "att" },

  // ───────────────────────── Round of 16 ─────────────────────────
  { n: 89, r: "R16", h: "W74", a: "W77", t: "2026-07-04T21:00:00Z", v: "lincoln" },
  { n: 90, r: "R16", h: "W73", a: "W75", t: "2026-07-04T17:00:00Z", v: "nrg" },
  { n: 91, r: "R16", h: "W76", a: "W78", t: "2026-07-05T20:00:00Z", v: "metlife" },
  { n: 92, r: "R16", h: "W79", a: "W80", t: "2026-07-06T00:00:00Z", v: "azteca" },
  { n: 93, r: "R16", h: "W83", a: "W84", t: "2026-07-06T19:00:00Z", v: "att" },
  { n: 94, r: "R16", h: "W81", a: "W82", t: "2026-07-07T00:00:00Z", v: "lumen" },
  { n: 95, r: "R16", h: "W86", a: "W88", t: "2026-07-07T16:00:00Z", v: "mercedes" },
  { n: 96, r: "R16", h: "W85", a: "W87", t: "2026-07-07T20:00:00Z", v: "bcplace" },

  // ───────────────────────── Quarter-finals ─────────────────────────
  { n: 97, r: "QF", h: "W89", a: "W90", t: "2026-07-09T20:00:00Z", v: "gillette" },
  { n: 98, r: "QF", h: "W93", a: "W94", t: "2026-07-10T19:00:00Z", v: "sofi" },
  { n: 99, r: "QF", h: "W91", a: "W92", t: "2026-07-11T21:00:00Z", v: "hardrock" },
  { n: 100, r: "QF", h: "W95", a: "W96", t: "2026-07-12T01:00:00Z", v: "arrowhead" },

  // ───────────────────────── Semi-finals ─────────────────────────
  { n: 101, r: "SF", h: "W97", a: "W98", t: "2026-07-14T19:00:00Z", v: "att" },
  { n: 102, r: "SF", h: "W99", a: "W100", t: "2026-07-15T19:00:00Z", v: "mercedes" },

  // ───────────────────────── Third place & Final ─────────────────────────
  { n: 103, r: "3P", h: "L101", a: "L102", t: "2026-07-18T21:00:00Z", v: "hardrock" },
  { n: 104, r: "F", h: "W101", a: "W102", t: "2026-07-19T19:00:00Z", v: "metlife" },
];

export const MATCH_MAP: Record<number, Match> = Object.fromEntries(
  MATCHES.map((m) => [m.n, m])
);
