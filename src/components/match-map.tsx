"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import L from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "@/i18n/navigation";
import { MATCHES } from "@/data/matches";
import { TEAMS } from "@/data/teams";
import { VENUES, VENUE_MAP } from "@/data/venues";
import { GROUPS, type GroupId } from "@/lib/types";
import { nextMatchOf, teamJourney } from "@/lib/bracket";
import { formatDate } from "@/lib/time";
import { useResolvedMatches } from "@/lib/use-resolved";
import { useSlotName } from "@/components/team-label";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Mode = "none" | "group" | "knockout" | "team";

const COUNTRY_LABEL: Record<string, { en: string; ar: string }> = {
  USA: { en: "United States", ar: "الولايات المتحدة" },
  Canada: { en: "Canada", ar: "كندا" },
  Mexico: { en: "Mexico", ar: "المكسيك" },
};

function venueIcon(country: string): L.DivIcon {
  const letter = country === "USA" ? "U" : country === "Canada" ? "C" : "M";
  return L.divIcon({
    className: "",
    html: `<span class="venue-marker">${letter}</span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16],
  });
}

/** Interactive venue map with group / knockout / team-journey connections. */
export function MatchMap() {
  const t = useTranslations("map");
  const locale = useLocale();
  const { resolvedTheme } = useTheme();
  const { resolved } = useResolvedMatches();
  const slotName = useSlotName();
  const [mode, setMode] = useState<Mode>("group");
  const [group, setGroup] = useState<GroupId>("A");
  const [team, setTeam] = useState("MEX");

  const ar = locale === "ar";

  const lines = useMemo((): { points: [number, number][]; key: string; dashed?: boolean }[] => {
    const coords = (v: string): [number, number] => [VENUE_MAP[v].lat, VENUE_MAP[v].lng];

    if (mode === "group") {
      const ms = MATCHES.filter((m) => m.r === "GS" && m.g === group).sort(
        (a, b) => a.t.localeCompare(b.t)
      );
      return ms.slice(0, -1).map((m, i) => ({
        key: `g-${m.n}`,
        points: [coords(m.v), coords(ms[i + 1].v)],
      }));
    }

    if (mode === "knockout") {
      return MATCHES.filter((m) => m.r !== "GS" && m.r !== "F" && m.r !== "3P").flatMap(
        (m) => {
          const { winnerTo } = nextMatchOf(m.n);
          if (!winnerTo) return [];
          const target = MATCHES.find((x) => x.n === winnerTo)!;
          return [
            {
              key: `k-${m.n}`,
              points: [coords(m.v), coords(target.v)] as [number, number][],
              dashed: true,
            },
          ];
        }
      );
    }

    if (mode === "team") {
      const journey = teamJourney(team, resolved);
      return journey.slice(0, -1).map((m, i) => ({
        key: `t-${m.n}`,
        points: [coords(m.v), coords(journey[i + 1].v)],
      }));
    }

    return [];
  }, [mode, group, team, resolved]);

  const tiles =
    resolvedTheme === "light"
      ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="map-mode">{t("legend")}</Label>
          <Select
            id="map-mode"
            value={mode}
            onChange={(e) => setMode(e.target.value as Mode)}
          >
            <option value="none">{t("modeNone")}</option>
            <option value="group">{t("modeGroup")}</option>
            <option value="knockout">{t("modeKnockout")}</option>
            <option value="team">{t("modeTeam")}</option>
          </Select>
        </div>
        <div className={cn("space-y-1", mode !== "group" && "opacity-50")}>
          <Label htmlFor="map-group">{t("selectGroup")}</Label>
          <Select
            id="map-group"
            value={group}
            disabled={mode !== "group"}
            onChange={(e) => setGroup(e.target.value as GroupId)}
          >
            {GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        </div>
        <div className={cn("space-y-1", mode !== "team" && "opacity-50")}>
          <Label htmlFor="map-team">{t("selectTeam")}</Label>
          <Select
            id="map-team"
            value={team}
            disabled={mode !== "team"}
            onChange={(e) => setTeam(e.target.value)}
          >
            {[...TEAMS]
              .sort((a, b) =>
                (ar ? a.nameAr : a.nameEn).localeCompare(ar ? b.nameAr : b.nameEn, locale)
              )
              .map((tm) => (
                <option key={tm.id} value={tm.id}>
                  {ar ? tm.nameAr : tm.nameEn}
                </option>
              ))}
          </Select>
        </div>
      </div>

      <div className="h-[60vh] min-h-96 overflow-hidden rounded-2xl border">
        <MapContainer
          center={[38.5, -96]}
          zoom={4}
          minZoom={3}
          scrollWheelZoom
          className="z-0"
        >
          <TileLayer
            url={tiles}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          {lines.map((l) => (
            <Polyline
              key={l.key}
              positions={l.points}
              pathOptions={{
                color: "#22c55e",
                weight: 2.5,
                opacity: 0.75,
                dashArray: l.dashed ? "6 8" : undefined,
              }}
            />
          ))}

          {VENUES.map((v) => {
            const venueMatches = MATCHES.filter((m) => m.v === v.id);
            return (
              <Marker key={v.id} position={[v.lat, v.lng]} icon={venueIcon(v.country)}>
                <Popup maxWidth={300} minWidth={240}>
                  <div className="space-y-2 py-1">
                    <p className="font-display text-base font-bold">
                      {ar ? v.nameAr : v.nameEn}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ar ? v.cityAr : v.cityEn} ·{" "}
                      {ar ? COUNTRY_LABEL[v.country].ar : COUNTRY_LABEL[v.country].en} ·{" "}
                      {t("capacity")}: {v.capacity.toLocaleString(ar ? "ar" : "en-US")}
                    </p>
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      {t("matchesHere")} ({venueMatches.length})
                    </p>
                    <ul className="max-h-44 space-y-1 overflow-y-auto pe-1">
                      {venueMatches.map((m) => {
                        const rm = resolved.get(m.n)!;
                        return (
                          <li key={m.n}>
                            <Link
                              href={`/matches/${m.n}`}
                              className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors duration-200 hover:bg-muted"
                            >
                              <span className="truncate">
                                {slotName(rm.home)} – {slotName(rm.away)}
                              </span>
                              <span className="shrink-0 text-muted-foreground">
                                {formatDate(m.t, locale)}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
