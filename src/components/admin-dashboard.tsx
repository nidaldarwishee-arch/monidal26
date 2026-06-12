"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Database, Lock, ShieldCheck } from "lucide-react";
import { MATCHES } from "@/data/matches";
import { ROUND_ORDER, type RoundId } from "@/lib/types";
import { useUser } from "@/lib/hooks";
import { useResolvedMatches } from "@/lib/use-resolved";
import { AdminResultEditor } from "@/components/admin-result-editor";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Admin result entry. With Supabase configured this is gated to profiles with
 * role = 'admin' (RLS enforces writes server-side too); in demo mode it is
 * open and writes to this browser only.
 */
export function AdminDashboard() {
  const t = useTranslations("admin");
  const tr = useTranslations("rounds");
  const { user, demoMode, loading } = useUser();
  const { resolved } = useResolvedMatches();
  const [round, setRound] = useState<RoundId | "">("GS");
  const [pendingOnly, setPendingOnly] = useState(false);

  const visible = useMemo(() => {
    return MATCHES.filter((m) => {
      if (round && m.r !== round) return false;
      if (pendingOnly && resolved.get(m.n)?.result) return false;
      return true;
    });
  }, [round, pendingOnly, resolved]);

  if (!demoMode) {
    if (loading) return null;
    if (!user || user.role !== "admin") {
      return (
        <div className="mx-auto max-w-md space-y-3 py-16 text-center">
          <ShieldCheck className="mx-auto size-12 text-muted-foreground" aria-hidden />
          <p className="text-muted-foreground">{t("denied")}</p>
        </div>
      );
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">{t("title")}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{t("subtitle")}</p>
      </header>

      {demoMode && (
        <p className="rounded-xl bg-accent/10 px-4 py-3 text-sm text-accent">
          {t("deniedDemo")}
        </p>
      )}

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border bg-card p-4">
        <div className="min-w-44 space-y-1">
          <Label htmlFor="adm-round">{tr("title")}</Label>
          <Select
            id="adm-round"
            value={round}
            onChange={(e) => setRound(e.target.value as RoundId | "")}
          >
            {ROUND_ORDER.map((r) => (
              <option key={r} value={r}>
                {tr(r)}
              </option>
            ))}
          </Select>
        </div>
        <button
          aria-pressed={pendingOnly}
          onClick={() => setPendingOnly((v) => !v)}
          className={cn(
            "h-11 cursor-pointer rounded-xl border px-4 text-sm font-semibold transition-colors duration-200",
            pendingOnly
              ? "border-primary bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t("filterPending")}
        </button>
        <p className="ms-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="size-3.5" aria-hidden />
          {t("lockedAt")}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {visible.map((m) => (
          <AdminResultEditor key={m.n} match={resolved.get(m.n)!} />
        ))}
      </div>

      <p className="flex items-start gap-2 rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
        <Database className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          <strong className="font-semibold text-foreground">{t("importTitle")}: </strong>
          {t("importHint")}
        </span>
      </p>
    </div>
  );
}
