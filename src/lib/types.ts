export type GroupId =
  | "A" | "B" | "C" | "D" | "E" | "F"
  | "G" | "H" | "I" | "J" | "K" | "L";

export type RoundId = "GS" | "R32" | "R16" | "QF" | "SF" | "3P" | "F";

export interface Team {
  /** FIFA three-letter code, e.g. "MEX" */
  id: string;
  /** ISO code used for flag images (flagcdn), e.g. "mx", "gb-eng" */
  iso: string;
  nameEn: string;
  nameAr: string;
  group: GroupId;
  /** Host nation flag */
  host?: boolean;
}

export interface Venue {
  id: string;
  nameEn: string;
  nameAr: string;
  cityEn: string;
  cityAr: string;
  country: "USA" | "Canada" | "Mexico";
  lat: number;
  lng: number;
  /** IANA timezone of the venue */
  tz: string;
  capacity: number;
}

/**
 * A team slot in a knockout match before it is resolved.
 *  - "MEX"        → a real team id (group stage)
 *  - "1A" / "2B"  → winner / runner-up of a group
 *  - "3:ABCDF"    → best third-placed team drawn from this group set
 *  - "W73" / "L101" → winner / loser of a match
 */
export type TeamSlot = string;

export interface Match {
  /** Official FIFA match number 1–104 */
  n: number;
  r: RoundId;
  g?: GroupId;
  h: TeamSlot;
  a: TeamSlot;
  /** Kickoff in UTC, ISO 8601 */
  t: string;
  /** Venue id */
  v: string;
}

export interface MatchResult {
  matchN: number;
  homeGoals: number;
  awayGoals: number;
  /** Winner after extra time / penalties when draws are impossible (knockout). Team id. */
  winner?: string;
  status: "played" | "live";
}

export interface Prediction {
  matchN: number;
  homeGoals: number;
  awayGoals: number;
  /** For knockout draws: predicted winner team id */
  winner?: string;
  updatedAt: string;
}

export interface StandingRow {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
  /** 1-based position after tiebreakers */
  pos: number;
}

export interface ResolvedSlot {
  /** Team id when known */
  teamId?: string;
  /** i18n-ready placeholder, e.g. { kind: "winner-group", group: "A" } */
  placeholder: SlotPlaceholder;
}

export type SlotPlaceholder =
  | { kind: "team"; teamId: string }
  | { kind: "winner-group"; group: GroupId }
  | { kind: "runner-up-group"; group: GroupId }
  | { kind: "third-place"; groups: string }
  | { kind: "winner-match"; match: number }
  | { kind: "loser-match"; match: number };

export interface ResolvedMatch extends Match {
  home: ResolvedSlot;
  away: ResolvedSlot;
  result?: MatchResult;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
}

export const ROUND_ORDER: RoundId[] = ["GS", "R32", "R16", "QF", "SF", "3P", "F"];

export const GROUPS: GroupId[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
