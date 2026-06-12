import type { Match } from "@/lib/types";
import { TEAM_MAP } from "@/data/teams";
import { VENUE_MAP } from "@/data/venues";
import { parseSlot } from "@/lib/bracket";

const MATCH_DURATION_MIN = 120;

function icsDate(iso: string): string {
  return iso.replace(/[-:]/g, "").replace(".000", "").replace("Z", "Z");
}

function icsEnd(iso: string): string {
  const end = new Date(new Date(iso).getTime() + MATCH_DURATION_MIN * 60000);
  return icsDate(end.toISOString().replace(".000Z", "Z"));
}

function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** Fold lines at 75 octets per RFC 5545. */
function fold(line: string): string {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 73) {
    out.push(rest.slice(0, 73));
    rest = " " + rest.slice(73);
  }
  out.push(rest);
  return out.join("\r\n");
}

export function slotLabel(slot: string, locale: string): string {
  const p = parseSlot(slot);
  const ar = locale === "ar";
  switch (p.kind) {
    case "team": {
      const t = TEAM_MAP[p.teamId];
      return t ? (ar ? t.nameAr : t.nameEn) : p.teamId;
    }
    case "winner-group":
      return ar ? `أول المجموعة ${p.group}` : `Winner Group ${p.group}`;
    case "runner-up-group":
      return ar ? `ثاني المجموعة ${p.group}` : `Runner-up Group ${p.group}`;
    case "third-place":
      return ar ? `أفضل ثالث (${p.groups})` : `3rd place (${p.groups})`;
    case "winner-match":
      return ar ? `الفائز من المباراة ${p.match}` : `Winner Match ${p.match}`;
    case "loser-match":
      return ar ? `الخاسر من المباراة ${p.match}` : `Loser Match ${p.match}`;
  }
}

const ROUND_LABEL_EN: Record<string, string> = {
  GS: "Group Stage",
  R32: "Round of 32",
  R16: "Round of 16",
  QF: "Quarter-final",
  SF: "Semi-final",
  "3P": "Third place",
  F: "Final",
};

const ROUND_LABEL_AR: Record<string, string> = {
  GS: "دور المجموعات",
  R32: "دور الـ32",
  R16: "دور الـ16",
  QF: "ربع النهائي",
  SF: "نصف النهائي",
  "3P": "المركز الثالث",
  F: "النهائي",
};

/** Builds an RFC 5545 ICS file for a list of matches. */
export function buildICS(matches: Match[], locale: string, siteUrl: string): string {
  const ar = locale === "ar";
  const stamp = icsDate(new Date().toISOString().replace(/\.\d{3}Z/, "Z"));
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Mondial 2026//World Cup 2026 Match Center//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    fold(`X-WR-CALNAME:${escapeText(ar ? "كأس العالم 2026" : "FIFA World Cup 2026")}`),
  ];

  for (const m of matches) {
    const venue = VENUE_MAP[m.v];
    const home = slotLabel(m.h, locale);
    const away = slotLabel(m.a, locale);
    const round = ar ? ROUND_LABEL_AR[m.r] : ROUND_LABEL_EN[m.r];
    const group = m.g ? (ar ? ` — المجموعة ${m.g}` : ` — Group ${m.g}`) : "";
    const summary = ar
      ? `⚽ ${home} ضد ${away} (${round}${group})`
      : `⚽ ${home} vs ${away} (${round}${group})`;
    const location = venue
      ? `${ar ? venue.nameAr : venue.nameEn}, ${ar ? venue.cityAr : venue.cityEn}, ${venue.country}`
      : "";
    const description = ar
      ? `كأس العالم 2026 — المباراة ${m.n}. التفاصيل: ${siteUrl}/ar/matches/${m.n}`
      : `FIFA World Cup 2026 — Match ${m.n}. Details: ${siteUrl}/matches/${m.n}`;

    lines.push(
      "BEGIN:VEVENT",
      fold(`UID:wc2026-match-${m.n}@mondial2026`),
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsDate(m.t)}`,
      `DTEND:${icsEnd(m.t)}`,
      fold(`SUMMARY:${escapeText(summary)}`),
      fold(`LOCATION:${escapeText(location)}`),
      fold(`DESCRIPTION:${escapeText(description)}`),
      fold(`URL:${siteUrl}/matches/${m.n}`),
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      fold(`DESCRIPTION:${escapeText(summary)}`),
      "TRIGGER:-PT1H",
      "END:VALARM",
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

/** Google Calendar "add event" deep link for one match. */
export function googleCalendarUrl(m: Match, locale: string, siteUrl: string): string {
  const venue = VENUE_MAP[m.v];
  const ar = locale === "ar";
  const home = slotLabel(m.h, locale);
  const away = slotLabel(m.a, locale);
  const title = ar ? `${home} ضد ${away} — كأس العالم 2026` : `${home} vs ${away} — World Cup 2026`;
  const dates = `${icsDate(m.t)}/${icsEnd(m.t)}`;
  const location = venue ? `${venue.nameEn}, ${venue.cityEn}, ${venue.country}` : "";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates,
    location,
    details: `${siteUrl}/matches/${m.n}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
