"use client";

import { useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import type { ResolvedMatch } from "@/lib/types";
import type { Database } from "@/lib/supabase/database.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useSlotName } from "@/components/team-label";
import { cn } from "@/lib/utils";

type MatchEvent = Database["public"]["Tables"]["match_events"]["Row"];

const EVENT_TYPES = [
  { id: "goal", label: "Goal" },
  { id: "own_goal", label: "Own goal" },
  { id: "penalty_goal", label: "Penalty goal" },
  { id: "penalty_miss", label: "Penalty miss" },
  { id: "yellow_card", label: "Yellow card" },
  { id: "red_card", label: "Red card" },
  { id: "substitution", label: "Substitution" },
  { id: "var", label: "VAR" },
  { id: "other", label: "Other" },
] as const;

const EVENT_LABELS = new Map<string, string>(EVENT_TYPES.map((t) => [t.id, t.label]));

/** Collapsible manual match-event editor backed by the admin events API. */
export function AdminMatchEvents({ match }: { match: ResolvedMatch }) {
  const slotName = useSlotName();
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [eventType, setEventType] = useState("goal");
  const [teamId, setTeamId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [minute, setMinute] = useState(1);

  const teamOptions = [match.home, match.away]
    .filter((slot) => slot.teamId)
    .map((slot) => ({ id: slot.teamId!, label: slotName(slot) }));
  const teamNames = new Map(teamOptions.map((t) => [t.id, t.label]));

  const load = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/matches/${match.n}/events`);
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Failed to load events.");
      setEvents(body?.events ?? []);
      setLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events.");
    } finally {
      setBusy(false);
    }
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !loaded && !busy) void load();
  };

  const add = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/matches/${match.n}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType,
          teamId: teamId || undefined,
          playerName: playerName.trim() || undefined,
          minute,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Failed to add event.");
      setEvents((prev) =>
        [...prev, body.event as MatchEvent].sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0))
      );
      setPlayerName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add event.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (eventId: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/matches/${match.n}/events/${eventId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to delete event.");
      }
      setEvents((prev) => prev.filter((event) => event.id !== eventId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 border-t pt-3">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronDown
          aria-hidden
          className={cn("size-3.5 transition-transform", open && "rotate-180")}
        />
        Match events
        {loaded && <Badge variant="muted">{events.length}</Badge>}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {error && <p className="text-xs font-medium text-live">{error}</p>}

          {loaded && events.length === 0 && (
            <p className="text-xs text-muted-foreground">No events recorded.</p>
          )}

          {events.length > 0 && (
            <ul className="space-y-1.5">
              {events.map((event) => (
                <li
                  key={event.id}
                  className="flex items-center gap-2 rounded-xl border bg-background px-3 py-1.5 text-xs"
                >
                  <span className="w-9 shrink-0 font-bold tabular-nums">
                    {event.minute ?? "—"}&apos;
                    {event.extra_minute ? `+${event.extra_minute}` : ""}
                  </span>
                  <span className="font-semibold">
                    {EVENT_LABELS.get(event.event_type) ?? event.event_type}
                  </span>
                  <span className="truncate text-muted-foreground">
                    {[
                      event.team_id ? (teamNames.get(event.team_id) ?? event.team_id) : null,
                      event.player_name,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="ms-auto h-7 w-7"
                    onClick={() => remove(event.id)}
                    disabled={busy}
                    aria-label="Delete event"
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-32 space-y-1">
              <Label htmlFor={`adm-evt-type-${match.n}`} className="text-xs">
                Type
              </Label>
              <Select
                id={`adm-evt-type-${match.n}`}
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="h-9 text-xs"
              >
                {EVENT_TYPES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="min-w-32 space-y-1">
              <Label htmlFor={`adm-evt-team-${match.n}`} className="text-xs">
                Team
              </Label>
              <Select
                id={`adm-evt-team-${match.n}`}
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="h-9 text-xs"
              >
                <option value="">—</option>
                {teamOptions.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="min-w-28 flex-1 space-y-1">
              <Label htmlFor={`adm-evt-player-${match.n}`} className="text-xs">
                Player
              </Label>
              <Input
                id={`adm-evt-player-${match.n}`}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Optional"
                className="h-9 text-xs"
              />
            </div>
            <div className="w-16 space-y-1">
              <Label htmlFor={`adm-evt-min-${match.n}`} className="text-xs">
                Min
              </Label>
              <Input
                id={`adm-evt-min-${match.n}`}
                type="number"
                inputMode="numeric"
                min={0}
                max={130}
                value={minute}
                onChange={(e) =>
                  setMinute(Math.max(0, Math.min(130, Number(e.target.value) || 0)))
                }
                className="h-9 text-center text-xs tabular-nums"
              />
            </div>
            <Button size="sm" onClick={add} disabled={busy}>
              <Plus aria-hidden />
              Add
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
