alter table public.matches
  drop constraint if exists matches_status_check;

alter table public.matches
  add constraint matches_status_check
  check (status in ('scheduled', 'live', 'halftime', 'finished', 'played', 'postponed', 'cancelled'));

alter table public.matches
  add column if not exists live_minute integer check (live_minute is null or live_minute between 0 and 130),
  add column if not exists last_synced_at timestamptz,
  add column if not exists external_provider text,
  add column if not exists external_match_id text;

alter table public.match_results
  drop constraint if exists match_results_status_check;

alter table public.match_results
  add constraint match_results_status_check
  check (status in ('scheduled', 'live', 'halftime', 'finished', 'played', 'postponed', 'cancelled'));

alter table public.match_results
  add column if not exists home_score integer check (home_score is null or home_score between 0 and 20),
  add column if not exists away_score integer check (away_score is null or away_score between 0 and 20),
  add column if not exists halftime_home_score integer check (halftime_home_score is null or halftime_home_score between 0 and 20),
  add column if not exists halftime_away_score integer check (halftime_away_score is null or halftime_away_score between 0 and 20),
  add column if not exists extra_time_home_score integer check (extra_time_home_score is null or extra_time_home_score between 0 and 20),
  add column if not exists extra_time_away_score integer check (extra_time_away_score is null or extra_time_away_score between 0 and 20),
  add column if not exists penalty_home_score integer check (penalty_home_score is null or penalty_home_score between 0 and 20),
  add column if not exists penalty_away_score integer check (penalty_away_score is null or penalty_away_score between 0 and 20),
  add column if not exists live_minute integer check (live_minute is null or live_minute between 0 and 130),
  add column if not exists last_synced_at timestamptz,
  add column if not exists external_provider text,
  add column if not exists external_match_id text,
  add column if not exists locked boolean not null default false;

update public.match_results
set
  home_score = coalesce(home_score, home_goals),
  away_score = coalesce(away_score, away_goals)
where home_score is null or away_score is null;

create unique index if not exists matches_external_provider_match_id_idx
on public.matches (external_provider, external_match_id)
where external_provider is not null and external_match_id is not null;

create index if not exists matches_live_status_idx
on public.matches (status, kickoff_at);

create index if not exists match_results_status_idx
on public.match_results (status);

create table if not exists public.live_score_cache (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  cache_key text not null,
  response jsonb not null,
  status_code integer,
  error text,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, cache_key)
);

create table if not exists public.live_score_sync_logs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  sync_type text not null check (sync_type in ('fixtures', 'live', 'results', 'standings', 'bracket', 'predictions', 'manual')),
  status text not null check (status in ('success', 'error', 'skipped', 'rate_limited')),
  message text,
  matches_checked integer not null default 0 check (matches_checked >= 0),
  matches_updated integer not null default 0 check (matches_updated >= 0),
  detail jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.match_events (
  id uuid primary key default gen_random_uuid(),
  match_n integer not null references public.matches(match_n) on delete cascade,
  event_type text not null check (event_type in ('goal', 'own_goal', 'penalty_goal', 'penalty_miss', 'yellow_card', 'red_card', 'substitution', 'var', 'other')),
  team_id text references public.teams(id) on update cascade,
  player_name text,
  minute integer check (minute is null or minute between 0 and 130),
  extra_minute integer check (extra_minute is null or extra_minute between 0 and 30),
  detail jsonb,
  source text not null default 'manual',
  external_event_id text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists live_score_cache_lookup_idx
on public.live_score_cache (provider, cache_key, expires_at);

create index if not exists live_score_sync_logs_created_at_idx
on public.live_score_sync_logs (created_at desc);

create index if not exists match_events_match_n_idx
on public.match_events (match_n, minute);

drop trigger if exists live_score_cache_set_updated_at on public.live_score_cache;
create trigger live_score_cache_set_updated_at
before update on public.live_score_cache
for each row execute function app_private.set_updated_at();

drop trigger if exists match_events_set_updated_at on public.match_events;
create trigger match_events_set_updated_at
before update on public.match_events
for each row execute function app_private.set_updated_at();

alter table public.live_score_cache enable row level security;
alter table public.live_score_sync_logs enable row level security;
alter table public.match_events enable row level security;

grant select, insert, update, delete on public.live_score_cache, public.live_score_sync_logs to authenticated;
grant select on public.match_events to anon, authenticated;
grant select, insert, update, delete on public.match_events to authenticated;

drop policy if exists "live_score_cache_admin_manage" on public.live_score_cache;
create policy "live_score_cache_admin_manage"
on public.live_score_cache for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

drop policy if exists "live_score_sync_logs_admin_manage" on public.live_score_sync_logs;
create policy "live_score_sync_logs_admin_manage"
on public.live_score_sync_logs for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

drop policy if exists "match_events_public_select" on public.match_events;
create policy "match_events_public_select"
on public.match_events for select
to anon, authenticated
using (true);

drop policy if exists "match_events_admin_manage" on public.match_events;
create policy "match_events_admin_manage"
on public.match_events for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());
