create extension if not exists "pgcrypto";

create schema if not exists app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to authenticated;

create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.groups (
  id text primary key check (id in ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L')),
  name_en text not null,
  name_ar text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teams (
  id text primary key,
  group_id text not null references public.groups(id) on update cascade,
  iso text not null,
  name_en text not null,
  name_ar text not null,
  host boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.venues (
  id text primary key,
  name_en text not null,
  name_ar text not null,
  city_en text not null,
  city_ar text not null,
  country text not null check (country in ('USA', 'Canada', 'Mexico')),
  lat numeric(9, 6) not null,
  lng numeric(9, 6) not null,
  tz text not null,
  capacity integer not null check (capacity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.matches (
  match_n integer primary key check (match_n between 1 and 104),
  round text not null check (round in ('GS', 'R32', 'R16', 'QF', 'SF', '3P', 'F')),
  group_id text references public.groups(id) on update cascade,
  home_slot text not null,
  away_slot text not null,
  kickoff_at timestamptz not null,
  venue_id text not null references public.venues(id) on update cascade,
  status text not null default 'scheduled' check (status in ('scheduled', 'live', 'played', 'postponed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint group_stage_group_required check ((round = 'GS' and group_id is not null) or (round <> 'GS'))
);

create table if not exists public.match_results (
  match_n integer primary key references public.matches(match_n) on delete cascade,
  home_goals integer not null check (home_goals between 0 and 20),
  away_goals integer not null check (away_goals between 0 and 20),
  winner_team_id text references public.teams(id) on update cascade,
  status text not null default 'played' check (status in ('live', 'played')),
  official boolean not null default true,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  match_n integer not null references public.matches(match_n) on delete cascade,
  home_goals integer not null check (home_goals between 0 and 20),
  away_goals integer not null check (away_goals between 0 and 20),
  winner_team_id text references public.teams(id) on update cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, match_n)
);

create table if not exists public.user_favorite_teams (
  user_id uuid not null references public.profiles(id) on delete cascade,
  team_id text not null references public.teams(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, team_id)
);

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  scope text not null check (scope in ('all', 'match', 'team', 'teams', 'group', 'saved', 'favorites')),
  match_n integer references public.matches(match_n) on delete cascade,
  team_id text references public.teams(id) on delete cascade,
  group_id text references public.groups(id) on delete cascade,
  title text not null,
  locale text not null default 'en' check (locale in ('en', 'ar')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bracket_nodes (
  id uuid primary key default gen_random_uuid(),
  match_n integer not null unique references public.matches(match_n) on delete cascade,
  round text not null check (round in ('R32', 'R16', 'QF', 'SF', '3P', 'F')),
  column_index integer not null check (column_index >= 0),
  row_index integer not null check (row_index >= 0),
  label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bracket_connections (
  id uuid primary key default gen_random_uuid(),
  from_match_n integer not null references public.matches(match_n) on delete cascade,
  to_match_n integer not null references public.matches(match_n) on delete cascade,
  connection_type text not null check (connection_type in ('winner', 'loser')),
  created_at timestamptz not null default now(),
  unique (from_match_n, to_match_n, connection_type)
);

create index if not exists teams_group_id_idx on public.teams(group_id);
create index if not exists matches_round_idx on public.matches(round);
create index if not exists matches_group_id_idx on public.matches(group_id);
create index if not exists matches_venue_id_idx on public.matches(venue_id);
create index if not exists matches_kickoff_at_idx on public.matches(kickoff_at);
create index if not exists user_predictions_user_id_idx on public.user_predictions(user_id);
create index if not exists user_predictions_match_n_idx on public.user_predictions(match_n);
create index if not exists calendar_events_user_id_idx on public.calendar_events(user_id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function app_private.set_updated_at();

drop trigger if exists groups_set_updated_at on public.groups;
create trigger groups_set_updated_at
before update on public.groups
for each row execute function app_private.set_updated_at();

drop trigger if exists teams_set_updated_at on public.teams;
create trigger teams_set_updated_at
before update on public.teams
for each row execute function app_private.set_updated_at();

drop trigger if exists venues_set_updated_at on public.venues;
create trigger venues_set_updated_at
before update on public.venues
for each row execute function app_private.set_updated_at();

drop trigger if exists matches_set_updated_at on public.matches;
create trigger matches_set_updated_at
before update on public.matches
for each row execute function app_private.set_updated_at();

drop trigger if exists match_results_set_updated_at on public.match_results;
create trigger match_results_set_updated_at
before update on public.match_results
for each row execute function app_private.set_updated_at();

drop trigger if exists user_predictions_set_updated_at on public.user_predictions;
create trigger user_predictions_set_updated_at
before update on public.user_predictions
for each row execute function app_private.set_updated_at();

drop trigger if exists calendar_events_set_updated_at on public.calendar_events;
create trigger calendar_events_set_updated_at
before update on public.calendar_events
for each row execute function app_private.set_updated_at();

drop trigger if exists bracket_nodes_set_updated_at on public.bracket_nodes;
create trigger bracket_nodes_set_updated_at
before update on public.bracket_nodes
for each row execute function app_private.set_updated_at();

create or replace function app_private.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function app_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1))
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function app_private.handle_new_user();

grant execute on function app_private.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.teams enable row level security;
alter table public.venues enable row level security;
alter table public.matches enable row level security;
alter table public.match_results enable row level security;
alter table public.user_predictions enable row level security;
alter table public.user_favorite_teams enable row level security;
alter table public.calendar_events enable row level security;
alter table public.bracket_nodes enable row level security;
alter table public.bracket_connections enable row level security;

grant usage on schema public to anon, authenticated;

grant select on public.groups, public.teams, public.venues, public.matches, public.match_results, public.bracket_nodes, public.bracket_connections to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.groups, public.teams, public.venues, public.matches, public.match_results, public.user_predictions, public.user_favorite_teams, public.calendar_events, public.bracket_nodes, public.bracket_connections to authenticated;

create policy "profiles_select_own_or_admin"
on public.profiles for select
to authenticated
using (id = auth.uid() or app_private.is_admin());

create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (id = auth.uid() and role = 'user');

create policy "profiles_update_own_user_fields"
on public.profiles for update
to authenticated
using (id = auth.uid() and role = 'user')
with check (id = auth.uid() and role = 'user');

create policy "profiles_admin_manage"
on public.profiles for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "groups_public_select"
on public.groups for select
to anon, authenticated
using (true);

create policy "groups_admin_manage"
on public.groups for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "teams_public_select"
on public.teams for select
to anon, authenticated
using (true);

create policy "teams_admin_manage"
on public.teams for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "venues_public_select"
on public.venues for select
to anon, authenticated
using (true);

create policy "venues_admin_manage"
on public.venues for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "matches_public_select"
on public.matches for select
to anon, authenticated
using (true);

create policy "matches_admin_manage"
on public.matches for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "match_results_public_select"
on public.match_results for select
to anon, authenticated
using (true);

create policy "match_results_admin_manage"
on public.match_results for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "user_predictions_select_own"
on public.user_predictions for select
to authenticated
using (user_id = auth.uid() or app_private.is_admin());

create policy "user_predictions_insert_own"
on public.user_predictions for insert
to authenticated
with check (user_id = auth.uid());

create policy "user_predictions_update_own"
on public.user_predictions for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "user_predictions_delete_own"
on public.user_predictions for delete
to authenticated
using (user_id = auth.uid() or app_private.is_admin());

create policy "favorite_teams_select_own"
on public.user_favorite_teams for select
to authenticated
using (user_id = auth.uid() or app_private.is_admin());

create policy "favorite_teams_insert_own"
on public.user_favorite_teams for insert
to authenticated
with check (user_id = auth.uid());

create policy "favorite_teams_delete_own"
on public.user_favorite_teams for delete
to authenticated
using (user_id = auth.uid() or app_private.is_admin());

create policy "calendar_events_select_own"
on public.calendar_events for select
to authenticated
using (user_id = auth.uid() or app_private.is_admin());

create policy "calendar_events_insert_own"
on public.calendar_events for insert
to authenticated
with check (user_id = auth.uid());

create policy "calendar_events_update_own"
on public.calendar_events for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "calendar_events_delete_own"
on public.calendar_events for delete
to authenticated
using (user_id = auth.uid() or app_private.is_admin());

create policy "bracket_nodes_public_select"
on public.bracket_nodes for select
to anon, authenticated
using (true);

create policy "bracket_nodes_admin_manage"
on public.bracket_nodes for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "bracket_connections_public_select"
on public.bracket_connections for select
to anon, authenticated
using (true);

create policy "bracket_connections_admin_manage"
on public.bracket_connections for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());
