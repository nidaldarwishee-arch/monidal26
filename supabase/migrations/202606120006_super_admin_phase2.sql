alter table public.profiles
  add column if not exists status text not null default 'active' check (status in ('active', 'suspended', 'deleted')),
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_reason text;

create table if not exists public.analytics_sessions (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  user_id uuid references public.profiles(id) on delete set null,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  page_views integer not null default 1 check (page_views >= 0),
  device_type text not null default 'unknown',
  browser text not null default 'unknown',
  country text,
  language text,
  referrer text,
  entry_path text,
  exit_path text,
  bounced boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.analytics_sessions(id) on delete set null,
  visitor_id text,
  user_id uuid references public.profiles(id) on delete set null,
  event_name text not null,
  path text,
  metadata jsonb,
  device_type text,
  browser text,
  country text,
  language text,
  created_at timestamptz not null default now()
);

create table if not exists public.content_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  content_type text not null check (content_type in ('news', 'match', 'team', 'stadium')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  title_en text not null,
  title_ar text,
  excerpt_en text,
  excerpt_ar text,
  body_en text not null,
  body_ar text,
  match_n integer references public.matches(match_n) on delete set null,
  team_id text references public.teams(id) on delete set null,
  venue_id text references public.venues(id) on delete set null,
  author_id uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_presence (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  current_path text,
  last_seen_at timestamptz not null default now(),
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_status_idx on public.profiles(status);
create index if not exists analytics_sessions_started_at_idx on public.analytics_sessions(started_at desc);
create index if not exists analytics_sessions_visitor_id_idx on public.analytics_sessions(visitor_id);
create index if not exists analytics_sessions_user_id_idx on public.analytics_sessions(user_id);
create index if not exists analytics_events_created_at_idx on public.analytics_events(created_at desc);
create index if not exists analytics_events_event_name_idx on public.analytics_events(event_name);
create index if not exists analytics_events_user_id_idx on public.analytics_events(user_id);
create index if not exists content_articles_status_type_idx on public.content_articles(status, content_type);
create index if not exists content_articles_published_at_idx on public.content_articles(published_at desc);
create index if not exists user_presence_last_seen_at_idx on public.user_presence(last_seen_at desc);

drop trigger if exists analytics_sessions_set_updated_at on public.analytics_sessions;
create trigger analytics_sessions_set_updated_at
before update on public.analytics_sessions
for each row execute function app_private.set_updated_at();

drop trigger if exists content_articles_set_updated_at on public.content_articles;
create trigger content_articles_set_updated_at
before update on public.content_articles
for each row execute function app_private.set_updated_at();

drop trigger if exists user_presence_set_updated_at on public.user_presence;
create trigger user_presence_set_updated_at
before update on public.user_presence
for each row execute function app_private.set_updated_at();

alter table public.analytics_sessions enable row level security;
alter table public.analytics_events enable row level security;
alter table public.content_articles enable row level security;
alter table public.user_presence enable row level security;

grant select, update on public.profiles to authenticated;
grant insert on public.analytics_sessions, public.analytics_events to anon, authenticated;
grant select, insert, update, delete on public.analytics_sessions, public.analytics_events to authenticated;
grant select on public.content_articles to anon, authenticated;
grant select, insert, update, delete on public.content_articles to authenticated;
grant select, insert, update, delete on public.user_presence to authenticated;

drop policy if exists "analytics_sessions_insert_any" on public.analytics_sessions;
create policy "analytics_sessions_insert_any"
on public.analytics_sessions for insert
to anon, authenticated
with check (true);

drop policy if exists "analytics_sessions_admin_manage" on public.analytics_sessions;
create policy "analytics_sessions_admin_manage"
on public.analytics_sessions for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

drop policy if exists "analytics_events_insert_any" on public.analytics_events;
create policy "analytics_events_insert_any"
on public.analytics_events for insert
to anon, authenticated
with check (true);

drop policy if exists "analytics_events_admin_manage" on public.analytics_events;
create policy "analytics_events_admin_manage"
on public.analytics_events for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

drop policy if exists "content_articles_public_select" on public.content_articles;
create policy "content_articles_public_select"
on public.content_articles for select
to anon, authenticated
using (status = 'published');

drop policy if exists "content_articles_admin_manage" on public.content_articles;
create policy "content_articles_admin_manage"
on public.content_articles for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

drop policy if exists "user_presence_select_own_or_admin" on public.user_presence;
create policy "user_presence_select_own_or_admin"
on public.user_presence for select
to authenticated
using (user_id = auth.uid() or app_private.is_admin());

drop policy if exists "user_presence_insert_own" on public.user_presence;
create policy "user_presence_insert_own"
on public.user_presence for insert
to authenticated
with check (user_id = auth.uid() or app_private.is_admin());

drop policy if exists "user_presence_update_own_or_admin" on public.user_presence;
create policy "user_presence_update_own_or_admin"
on public.user_presence for update
to authenticated
using (user_id = auth.uid() or app_private.is_admin())
with check (user_id = auth.uid() or app_private.is_admin());

drop policy if exists "user_presence_delete_own_or_admin" on public.user_presence;
create policy "user_presence_delete_own_or_admin"
on public.user_presence for delete
to authenticated
using (user_id = auth.uid() or app_private.is_admin());
