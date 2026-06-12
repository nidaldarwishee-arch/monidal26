"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Activity,
  BarChart3,
  CalendarClock,
  CircleAlert,
  Database,
  FileText,
  Gauge,
  Lock,
  Medal,
  RefreshCw,
  ShieldCheck,
  Trophy,
  UserCheck,
  Users,
} from "lucide-react";
import { MATCHES } from "@/data/matches";
import { ROUND_ORDER, type ResolvedMatch, type RoundId } from "@/lib/types";
import { useUser } from "@/lib/hooks";
import { useResolvedMatches } from "@/lib/use-resolved";
import type {
  AdminUserRow,
  BreakdownPoint,
  CountPoint,
  SuperAdminDashboardData,
} from "@/lib/admin/super-dashboard";
import { AdminResultEditor } from "@/components/admin-result-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type TabId = "analytics" | "users" | "predictions" | "matches" | "content" | "monitoring";
type ArticleRow = SuperAdminDashboardData["content"]["latest"][number];

const TABS: { id: TabId; label: string; icon: typeof BarChart3 }[] = [
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "users", label: "Users", icon: Users },
  { id: "predictions", label: "Predictions", icon: Trophy },
  { id: "matches", label: "Matches", icon: CalendarClock },
  { id: "content", label: "Content", icon: FileText },
  { id: "monitoring", label: "Live", icon: Activity },
];

const EMPTY_ARTICLE = {
  slug: "",
  content_type: "news",
  status: "draft",
  title_en: "",
  excerpt_en: "",
  body_en: "",
};

function numberFormat(value: number) {
  return new Intl.NumberFormat("en").format(value);
}

function formatDateTime(value: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest ? `${minutes}m ${rest}s` : `${minutes}m`;
}

async function readApiError(response: Response) {
  const body = await response.json().catch(() => null);
  if (body && typeof body.error === "string") return body.error;
  if (body && Array.isArray(body.issues)) {
    return body.issues.map((issue: { message?: string }) => issue.message).filter(Boolean).join(" ");
  }
  return "Request failed.";
}

function Metric({
  label,
  value,
  detail,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon: typeof BarChart3;
  tone?: "primary" | "accent" | "live" | "muted";
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
        </div>
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-lg",
            tone === "primary" && "bg-primary/10 text-primary",
            tone === "accent" && "bg-accent/10 text-accent",
            tone === "live" && "bg-live/10 text-live",
            tone === "muted" && "bg-muted text-muted-foreground"
          )}
        >
          <Icon aria-hidden className="size-4" />
        </span>
      </div>
      {detail && <p className="mt-3 text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}

function Panel({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-card">
      <header className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <h2 className="text-sm font-bold">{title}</h2>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function CountBars({ items, empty = "No data yet." }: { items: CountPoint[]; empty?: string }) {
  const max = Math.max(1, ...items.map((item) => item.count));
  if (!items.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="grid grid-cols-[minmax(0,1fr)_4rem] items-center gap-3">
          <div className="min-w-0">
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-semibold">{item.label}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(item.count / max) * 100}%` }} />
            </div>
          </div>
          <span className="text-end text-sm font-bold">{numberFormat(item.count)}</span>
        </div>
      ))}
    </div>
  );
}

function BreakdownList({ items }: { items: BreakdownPoint[] }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">No data yet.</p>;
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-xs">
            <span className="truncate font-semibold">{item.label}</span>
            <span className="text-muted-foreground">{item.percentage}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-accent" style={{ width: `${item.percentage}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant = status === "active" || status === "published" || status === "success" ? "default" : status === "suspended" || status === "error" ? "live" : "muted";
  return <Badge variant={variant}>{status}</Badge>;
}

export function AdminDashboard() {
  const t = useTranslations("admin");
  const tr = useTranslations("rounds");
  const { user, demoMode, loading: userLoading } = useUser();
  const { resolved } = useResolvedMatches();
  const [dashboard, setDashboard] = useState<SuperAdminDashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("analytics");
  const [round, setRound] = useState<RoundId | "">("GS");
  const [pendingOnly, setPendingOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [articleForm, setArticleForm] = useState(EMPTY_ARTICLE);

  const visibleMatches = useMemo(() => {
    return MATCHES.filter((match) => {
      if (round && match.r !== round) return false;
      if (pendingOnly && resolved.get(match.n)?.result) return false;
      return true;
    });
  }, [pendingOnly, resolved, round]);
  const visibleResolvedMatches = useMemo(() => {
    return visibleMatches.flatMap((match) => {
      const item = resolved.get(match.n);
      return item ? [item] : [];
    });
  }, [resolved, visibleMatches]);

  const refresh = useCallback(async () => {
    if (demoMode || !user || user.role !== "admin") return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/overview", { cache: "no-store" });
      if (!response.ok) throw new Error(await readApiError(response));
      const body = (await response.json()) as { dashboard: SuperAdminDashboardData };
      setDashboard(body.dashboard);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin dashboard.");
    } finally {
      setLoading(false);
    }
  }, [demoMode, user]);

  useEffect(() => {
    if (!userLoading) void refresh();
  }, [refresh, userLoading]);

  async function adminPatch(path: string, payload: Record<string, unknown>, key: string) {
    setBusyKey(key);
    setError(null);
    try {
      const response = await fetch(path, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await readApiError(response));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setBusyKey(null);
    }
  }

  async function deleteItem(path: string, key: string, message: string) {
    if (!window.confirm(message)) return;
    setBusyKey(key);
    setError(null);
    try {
      const response = await fetch(path, { method: "DELETE" });
      if (!response.ok) throw new Error(await readApiError(response));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBusyKey(null);
    }
  }

  async function createArticle() {
    setBusyKey("content:create");
    setError(null);
    try {
      const response = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(articleForm),
      });
      if (!response.ok) throw new Error(await readApiError(response));
      setArticleForm(EMPTY_ARTICLE);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save content.");
    } finally {
      setBusyKey(null);
    }
  }

  if (!demoMode) {
    if (userLoading) return null;
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
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">Super admin</p>
          <h1 className="font-display text-3xl font-bold">Tournament command center</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Operational view for World Cup 2026.
          </p>
        </div>
        <Button onClick={refresh} disabled={loading || demoMode} variant="outline">
          <RefreshCw className={cn(loading && "animate-spin")} aria-hidden />
          Refresh
        </Button>
      </header>

      {demoMode && (
        <p className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
          Supabase is required for the super admin dashboard. Local result entry remains available below.
        </p>
      )}

      {error && (
        <p className="flex items-start gap-2 rounded-lg border border-live/30 bg-live/10 px-4 py-3 text-sm text-live">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Visitors" value={numberFormat(dashboard?.analytics.totalVisitors ?? 0)} detail="All tracked visitors" icon={BarChart3} />
        <Metric label="Users" value={numberFormat(dashboard?.users.total ?? 0)} detail={`${dashboard?.users.admins ?? 0} admins`} icon={Users} tone="accent" />
        <Metric label="Predictions" value={numberFormat(dashboard?.predictions.total ?? 0)} detail={`${dashboard?.predictions.usersWithPredictions ?? 0} users`} icon={Trophy} />
        <Metric label="Live status" value={numberFormat(dashboard?.monitoring.activeMatches ?? 0)} detail="Active matches" icon={Activity} tone="live" />
      </div>

      <div className="flex gap-2 overflow-x-auto rounded-lg border bg-card p-1 scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "inline-flex h-10 cursor-pointer items-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors duration-200",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4" aria-hidden />
              {tab.label}
            </button>
          );
        })}
      </div>

      {!dashboard && !demoMode && !error && (
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          Loading admin data...
        </div>
      )}

      {(dashboard || demoMode) && (
        <>
          {activeTab === "analytics" && dashboard && <AnalyticsTab dashboard={dashboard} />}
          {activeTab === "users" && dashboard && (
            <UsersTab
              users={dashboard.users.rows}
              busyKey={busyKey}
              onPatch={(id, payload, key) => adminPatch(`/api/admin/users/${encodeURIComponent(id)}`, payload, key)}
              onDelete={(id) =>
                deleteItem(
                  `/api/admin/users/${encodeURIComponent(id)}`,
                  `user:delete:${id}`,
                  "Delete this user account?"
                )
              }
            />
          )}
          {activeTab === "predictions" && dashboard && <PredictionsTab dashboard={dashboard} />}
          {activeTab === "matches" && (
            <MatchesTab
              dashboard={dashboard}
              round={round}
              setRound={setRound}
              pendingOnly={pendingOnly}
              setPendingOnly={setPendingOnly}
              visibleMatches={visibleResolvedMatches}
              tr={tr}
            />
          )}
          {activeTab === "content" && dashboard && (
            <ContentTab
              articles={dashboard.content.latest}
              form={articleForm}
              setForm={setArticleForm}
              busyKey={busyKey}
              onCreate={createArticle}
              onPatch={(article, payload, key) =>
                adminPatch(`/api/admin/content/${encodeURIComponent(article.id)}`, payload, key)
              }
              onDelete={(article) =>
                deleteItem(
                  `/api/admin/content/${encodeURIComponent(article.id)}`,
                  `content:delete:${article.id}`,
                  "Delete this article?"
                )
              }
            />
          )}
          {activeTab === "monitoring" && dashboard && <MonitoringTab dashboard={dashboard} />}
        </>
      )}
    </div>
  );
}

function AnalyticsTab({ dashboard }: { dashboard: SuperAdminDashboardData }) {
  const analytics = dashboard.analytics;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Today" value={numberFormat(analytics.visitorsToday)} detail="Visitors" icon={Gauge} />
        <Metric label="This week" value={numberFormat(analytics.visitorsThisWeek)} detail="Visitors" icon={BarChart3} />
        <Metric label="This month" value={numberFormat(analytics.visitorsThisMonth)} detail="Visitors" icon={BarChart3} />
        <Metric label="Bounce rate" value={`${analytics.bounceRate}%`} detail={`${formatDuration(analytics.averageSessionDuration)} avg session`} icon={Activity} tone="accent" />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Daily visitors">
          <CountBars items={analytics.dailyVisitors} />
        </Panel>
        <Panel title="Weekly visitors">
          <CountBars items={analytics.weeklyVisitors} />
        </Panel>
        <Panel title="Monthly visitors">
          <CountBars items={analytics.monthlyVisitors} />
        </Panel>
      </div>
      <div className="grid gap-4 lg:grid-cols-4">
        <Panel title="Devices">
          <BreakdownList items={analytics.devices} />
        </Panel>
        <Panel title="Browsers">
          <BreakdownList items={analytics.browsers} />
        </Panel>
        <Panel title="Countries">
          <BreakdownList items={analytics.countries} />
        </Panel>
        <Panel title="Languages">
          <BreakdownList items={analytics.languages} />
        </Panel>
      </div>
    </div>
  );
}

function UsersTab({
  users,
  busyKey,
  onPatch,
  onDelete,
}: {
  users: AdminUserRow[];
  busyKey: string | null;
  onPatch: (id: string, payload: Record<string, unknown>, key: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Panel title="User management">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Score</th>
              <th className="px-3 py-2">Last login</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((item) => (
              <tr key={item.id}>
                <td className="px-3 py-3">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.email ?? item.id}</p>
                </td>
                <td className="px-3 py-3">
                  <StatusBadge status={item.role} />
                </td>
                <td className="px-3 py-3">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-3 py-3">
                  <span className="font-semibold">{item.predictionScore}</span>
                  <span className="ms-2 text-xs text-muted-foreground">{item.rank ? `#${item.rank}` : "Unranked"}</span>
                </td>
                <td className="px-3 py-3 text-muted-foreground">{formatDateTime(item.lastLogin)}</td>
                <td className="px-3 py-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyKey === `user:role:${item.id}`}
                      onClick={() =>
                        onPatch(
                          item.id,
                          { role: item.role === "admin" ? "user" : "admin" },
                          `user:role:${item.id}`
                        )
                      }
                    >
                      <ShieldCheck aria-hidden />
                      {item.role === "admin" ? "User" : "Admin"}
                    </Button>
                    <Button
                      size="sm"
                      variant={item.status === "suspended" ? "secondary" : "outline"}
                      disabled={busyKey === `user:status:${item.id}`}
                      onClick={() =>
                        onPatch(
                          item.id,
                          { status: item.status === "suspended" ? "active" : "suspended" },
                          `user:status:${item.id}`
                        )
                      }
                    >
                      <UserCheck aria-hidden />
                      {item.status === "suspended" ? "Activate" : "Suspend"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={busyKey === `user:delete:${item.id}`}
                      onClick={() => onDelete(item.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!users.length && <p className="py-8 text-center text-sm text-muted-foreground">No users found.</p>}
      </div>
    </Panel>
  );
}

function PredictionsTab({ dashboard }: { dashboard: SuperAdminDashboardData }) {
  const predictions = dashboard.predictions;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Predictions" value={numberFormat(predictions.total)} detail="Submitted picks" icon={Trophy} />
        <Metric label="Predictors" value={numberFormat(predictions.usersWithPredictions)} detail="Users with picks" icon={Users} />
        <Metric label="Average accuracy" value={`${predictions.averageAccuracy}%`} detail="Scored users only" icon={Gauge} tone="accent" />
        <Metric
          label="Top predictor"
          value={predictions.mostSuccessfulPredictor?.points ?? 0}
          detail={predictions.mostSuccessfulPredictor?.displayName ?? "No scored predictions"}
          icon={Medal}
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Most predicted matches">
          <CountBars items={predictions.byMatch} />
        </Panel>
        <Panel title="Winner picks">
          <CountBars items={predictions.teamPopularity} />
        </Panel>
        <Panel title="Highlights">
          <div className="space-y-3 text-sm">
            <p>
              <span className="font-semibold">Most predicted match:</span>{" "}
              {predictions.mostPredictedMatch
                ? `${predictions.mostPredictedMatch.label} (${predictions.mostPredictedMatch.count})`
                : "No data yet"}
            </p>
            <p>
              <span className="font-semibold">Most picked winner:</span>{" "}
              {predictions.mostPredictedTeam
                ? `${predictions.mostPredictedTeam.label} (${predictions.mostPredictedTeam.count})`
                : "No winner picks yet"}
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function MatchesTab({
  dashboard,
  round,
  setRound,
  pendingOnly,
  setPendingOnly,
  visibleMatches,
  tr,
}: {
  dashboard: SuperAdminDashboardData | null;
  round: RoundId | "";
  setRound: (round: RoundId | "") => void;
  pendingOnly: boolean;
  setPendingOnly: (value: boolean) => void;
  visibleMatches: ResolvedMatch[];
  tr: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Scheduled" value={dashboard?.matches.scheduled ?? 0} detail="Awaiting kickoff" icon={CalendarClock} />
        <Metric label="Live" value={(dashboard?.matches.live ?? 0) + (dashboard?.matches.halftime ?? 0)} detail="Including halftime" icon={Activity} tone="live" />
        <Metric label="Finished" value={dashboard?.matches.finished ?? 0} detail="Official or played" icon={Trophy} />
        <Metric label="Prediction locks" value={dashboard?.matches.predictionLocks ?? 0} detail="Kickoff passed" icon={Lock} tone="accent" />
      </div>

      <Panel
        title="Result operations"
        action={
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3.5" aria-hidden />
            Predictions lock at kickoff
          </p>
        }
      >
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="min-w-44 space-y-1">
            <Label htmlFor="adm-round">{tr("title")}</Label>
            <Select
              id="adm-round"
              value={round}
              onChange={(event) => setRound(event.target.value as RoundId | "")}
            >
              {ROUND_ORDER.map((item) => (
                <option key={item} value={item}>
                  {tr(item)}
                </option>
              ))}
            </Select>
          </div>
          <Button
            variant={pendingOnly ? "default" : "outline"}
            onClick={() => setPendingOnly(!pendingOnly)}
            aria-pressed={pendingOnly}
          >
            Pending only
          </Button>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {visibleMatches.map((match) => (
            <AdminResultEditor key={match.n} match={match} />
          ))}
        </div>
      </Panel>
    </div>
  );
}

function ContentTab({
  articles,
  form,
  setForm,
  busyKey,
  onCreate,
  onPatch,
  onDelete,
}: {
  articles: ArticleRow[];
  form: typeof EMPTY_ARTICLE;
  setForm: (form: typeof EMPTY_ARTICLE) => void;
  busyKey: string | null;
  onCreate: () => void;
  onPatch: (article: ArticleRow, payload: Record<string, unknown>, key: string) => void;
  onDelete: (article: ArticleRow) => void;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <Panel title="Create article">
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="content-slug">Slug</Label>
              <Input
                id="content-slug"
                value={form.slug}
                onChange={(event) => setForm({ ...form, slug: event.target.value })}
                placeholder="matchday-one-preview"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="content-type">Type</Label>
              <Select
                id="content-type"
                value={form.content_type}
                onChange={(event) => setForm({ ...form, content_type: event.target.value })}
              >
                <option value="news">News</option>
                <option value="match">Match</option>
                <option value="team">Team</option>
                <option value="stadium">Stadium</option>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="content-title">Title</Label>
            <Input
              id="content-title"
              value={form.title_en}
              onChange={(event) => setForm({ ...form, title_en: event.target.value })}
              placeholder="Opening match preview"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="content-excerpt">Excerpt</Label>
            <Input
              id="content-excerpt"
              value={form.excerpt_en}
              onChange={(event) => setForm({ ...form, excerpt_en: event.target.value })}
              placeholder="Short summary"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="content-body">Body</Label>
            <textarea
              id="content-body"
              value={form.body_en}
              onChange={(event) => setForm({ ...form, body_en: event.target.value })}
              className="min-h-36 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Select
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
              className="max-w-40"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </Select>
            <Button onClick={onCreate} disabled={busyKey === "content:create"}>
              <FileText aria-hidden />
              Save
            </Button>
          </div>
        </div>
      </Panel>

      <Panel title="Content inventory">
        <div className="space-y-3">
          {articles.map((article) => (
            <div key={article.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{article.title_en}</p>
                  <p className="text-xs text-muted-foreground">{article.slug}</p>
                </div>
                <StatusBadge status={article.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyKey === `content:publish:${article.id}`}
                  onClick={() =>
                    onPatch(
                      article,
                      { status: article.status === "published" ? "draft" : "published" },
                      `content:publish:${article.id}`
                    )
                  }
                >
                  {article.status === "published" ? "Draft" : "Publish"}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={busyKey === `content:delete:${article.id}`}
                  onClick={() => onDelete(article)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
          {!articles.length && <p className="py-8 text-center text-sm text-muted-foreground">No articles found.</p>}
        </div>
      </Panel>
    </div>
  );
}

function MonitoringTab({ dashboard }: { dashboard: SuperAdminDashboardData }) {
  const monitoring = dashboard.monitoring;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Online users" value={monitoring.onlineUsers} detail="Last 5 minutes" icon={Users} tone="accent" />
        <Metric label="Page views" value={monitoring.livePageViews} detail="Last 5 minutes" icon={Activity} />
        <Metric label="Live predictions" value={monitoring.livePredictions} detail="Last 5 minutes" icon={Trophy} />
        <Metric label="Active matches" value={monitoring.activeMatches} detail="Live or halftime" icon={Gauge} tone="live" />
      </div>
      <Panel title="Latest sync status">
        {monitoring.latestSync ? (
          <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <p>
              <span className="block text-xs uppercase text-muted-foreground">Provider</span>
              <span className="font-semibold">{monitoring.latestSync.provider}</span>
            </p>
            <p>
              <span className="block text-xs uppercase text-muted-foreground">Sync</span>
              <span className="font-semibold">{monitoring.latestSync.syncType}</span>
            </p>
            <p>
              <span className="block text-xs uppercase text-muted-foreground">Status</span>
              <StatusBadge status={monitoring.latestSync.status} />
            </p>
            <p>
              <span className="block text-xs uppercase text-muted-foreground">Finished</span>
              <span className="font-semibold">{formatDateTime(monitoring.latestSync.finishedAt)}</span>
            </p>
            {monitoring.latestSync.message && (
              <p className="sm:col-span-2 lg:col-span-4 text-muted-foreground">{monitoring.latestSync.message}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No sync runs recorded yet.</p>
        )}
      </Panel>
      <p className="flex items-start gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        <Database className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          Live monitoring uses Supabase analytics, presence, live-score sync logs, and prediction updates.
        </span>
      </p>
    </div>
  );
}
