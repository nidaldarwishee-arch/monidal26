import type { Team } from "@/lib/types";

/**
 * The 48 qualified teams of the FIFA World Cup 2026, in their final groups
 * after the Final Draw (Washington D.C., 5 Dec 2025) and the intercontinental
 * and UEFA play-offs (March 2026).
 */
export const TEAMS: Team[] = [
  // Group A
  { id: "MEX", iso: "mx", nameEn: "Mexico", nameAr: "المكسيك", group: "A", host: true },
  { id: "RSA", iso: "za", nameEn: "South Africa", nameAr: "جنوب أفريقيا", group: "A" },
  { id: "KOR", iso: "kr", nameEn: "South Korea", nameAr: "كوريا الجنوبية", group: "A" },
  { id: "CZE", iso: "cz", nameEn: "Czechia", nameAr: "التشيك", group: "A" },
  // Group B
  { id: "CAN", iso: "ca", nameEn: "Canada", nameAr: "كندا", group: "B", host: true },
  { id: "BIH", iso: "ba", nameEn: "Bosnia and Herzegovina", nameAr: "البوسنة والهرسك", group: "B" },
  { id: "QAT", iso: "qa", nameEn: "Qatar", nameAr: "قطر", group: "B" },
  { id: "SUI", iso: "ch", nameEn: "Switzerland", nameAr: "سويسرا", group: "B" },
  // Group C
  { id: "BRA", iso: "br", nameEn: "Brazil", nameAr: "البرازيل", group: "C" },
  { id: "MAR", iso: "ma", nameEn: "Morocco", nameAr: "المغرب", group: "C" },
  { id: "HAI", iso: "ht", nameEn: "Haiti", nameAr: "هايتي", group: "C" },
  { id: "SCO", iso: "gb-sct", nameEn: "Scotland", nameAr: "اسكتلندا", group: "C" },
  // Group D
  { id: "USA", iso: "us", nameEn: "United States", nameAr: "الولايات المتحدة", group: "D", host: true },
  { id: "PAR", iso: "py", nameEn: "Paraguay", nameAr: "باراغواي", group: "D" },
  { id: "AUS", iso: "au", nameEn: "Australia", nameAr: "أستراليا", group: "D" },
  { id: "TUR", iso: "tr", nameEn: "Türkiye", nameAr: "تركيا", group: "D" },
  // Group E
  { id: "GER", iso: "de", nameEn: "Germany", nameAr: "ألمانيا", group: "E" },
  { id: "CUW", iso: "cw", nameEn: "Curaçao", nameAr: "كوراساو", group: "E" },
  { id: "CIV", iso: "ci", nameEn: "Ivory Coast", nameAr: "ساحل العاج", group: "E" },
  { id: "ECU", iso: "ec", nameEn: "Ecuador", nameAr: "الإكوادور", group: "E" },
  // Group F
  { id: "NED", iso: "nl", nameEn: "Netherlands", nameAr: "هولندا", group: "F" },
  { id: "JPN", iso: "jp", nameEn: "Japan", nameAr: "اليابان", group: "F" },
  { id: "SWE", iso: "se", nameEn: "Sweden", nameAr: "السويد", group: "F" },
  { id: "TUN", iso: "tn", nameEn: "Tunisia", nameAr: "تونس", group: "F" },
  // Group G
  { id: "BEL", iso: "be", nameEn: "Belgium", nameAr: "بلجيكا", group: "G" },
  { id: "EGY", iso: "eg", nameEn: "Egypt", nameAr: "مصر", group: "G" },
  { id: "IRN", iso: "ir", nameEn: "Iran", nameAr: "إيران", group: "G" },
  { id: "NZL", iso: "nz", nameEn: "New Zealand", nameAr: "نيوزيلندا", group: "G" },
  // Group H
  { id: "ESP", iso: "es", nameEn: "Spain", nameAr: "إسبانيا", group: "H" },
  { id: "CPV", iso: "cv", nameEn: "Cape Verde", nameAr: "الرأس الأخضر", group: "H" },
  { id: "KSA", iso: "sa", nameEn: "Saudi Arabia", nameAr: "السعودية", group: "H" },
  { id: "URU", iso: "uy", nameEn: "Uruguay", nameAr: "الأوروغواي", group: "H" },
  // Group I
  { id: "FRA", iso: "fr", nameEn: "France", nameAr: "فرنسا", group: "I" },
  { id: "SEN", iso: "sn", nameEn: "Senegal", nameAr: "السنغال", group: "I" },
  { id: "IRQ", iso: "iq", nameEn: "Iraq", nameAr: "العراق", group: "I" },
  { id: "NOR", iso: "no", nameEn: "Norway", nameAr: "النرويج", group: "I" },
  // Group J
  { id: "ARG", iso: "ar", nameEn: "Argentina", nameAr: "الأرجنتين", group: "J" },
  { id: "ALG", iso: "dz", nameEn: "Algeria", nameAr: "الجزائر", group: "J" },
  { id: "AUT", iso: "at", nameEn: "Austria", nameAr: "النمسا", group: "J" },
  { id: "JOR", iso: "jo", nameEn: "Jordan", nameAr: "الأردن", group: "J" },
  // Group K
  { id: "POR", iso: "pt", nameEn: "Portugal", nameAr: "البرتغال", group: "K" },
  { id: "COD", iso: "cd", nameEn: "DR Congo", nameAr: "الكونغو الديمقراطية", group: "K" },
  { id: "UZB", iso: "uz", nameEn: "Uzbekistan", nameAr: "أوزبكستان", group: "K" },
  { id: "COL", iso: "co", nameEn: "Colombia", nameAr: "كولومبيا", group: "K" },
  // Group L
  { id: "ENG", iso: "gb-eng", nameEn: "England", nameAr: "إنجلترا", group: "L" },
  { id: "CRO", iso: "hr", nameEn: "Croatia", nameAr: "كرواتيا", group: "L" },
  { id: "GHA", iso: "gh", nameEn: "Ghana", nameAr: "غانا", group: "L" },
  { id: "PAN", iso: "pa", nameEn: "Panama", nameAr: "بنما", group: "L" },
];

export const TEAM_MAP: Record<string, Team> = Object.fromEntries(
  TEAMS.map((t) => [t.id, t])
);

export function flagUrl(teamId: string, width: 40 | 80 | 160 = 80): string {
  const team = TEAM_MAP[teamId];
  if (!team) return "";
  return `https://flagcdn.com/w${width}/${team.iso}.png`;
}
