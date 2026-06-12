alter table public.profiles
  add column if not exists country text,
  add column if not exists favorite_team_id text references public.teams(id) on update cascade,
  add column if not exists preferred_language text not null default 'en' check (preferred_language in ('en', 'ar')),
  add column if not exists last_login_at timestamptz;

alter table public.user_favorite_teams
  add column if not exists notifications_enabled boolean not null default true;

create table if not exists public.user_saved_matches (
  user_id uuid not null references public.profiles(id) on delete cascade,
  match_n integer not null references public.matches(match_n) on delete cascade,
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (user_id, match_n)
);

create table if not exists public.user_notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  match_reminders boolean not null default true,
  team_news boolean not null default true,
  prediction_reminders boolean not null default true,
  result_alerts boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_dashboard_stats (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  matches_viewed integer not null default 0 check (matches_viewed >= 0),
  pages_viewed integer not null default 0 check (pages_viewed >= 0),
  time_spent_seconds integer not null default 0 check (time_spent_seconds >= 0),
  favorite_team_activity integer not null default 0 check (favorite_team_activity >= 0),
  prediction_submissions integer not null default 0 check (prediction_submissions >= 0),
  calendar_exports integer not null default 0 check (calendar_exports >= 0),
  language_changes integer not null default 0 check (language_changes >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_key text not null check (
    achievement_key in (
      'first_prediction',
      'ten_correct_predictions',
      'group_stage_expert',
      'knockout_expert',
      'world_champion_predictor'
    )
  ),
  progress jsonb,
  unlocked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, achievement_key)
);

create index if not exists profiles_favorite_team_id_idx on public.profiles(favorite_team_id);
create index if not exists user_saved_matches_user_id_idx on public.user_saved_matches(user_id);
create index if not exists user_saved_matches_match_n_idx on public.user_saved_matches(match_n);
create index if not exists user_achievements_user_id_idx on public.user_achievements(user_id);

drop trigger if exists user_notification_preferences_set_updated_at on public.user_notification_preferences;
create trigger user_notification_preferences_set_updated_at
before update on public.user_notification_preferences
for each row execute function app_private.set_updated_at();

drop trigger if exists user_dashboard_stats_set_updated_at on public.user_dashboard_stats;
create trigger user_dashboard_stats_set_updated_at
before update on public.user_dashboard_stats
for each row execute function app_private.set_updated_at();

alter table public.user_saved_matches enable row level security;
alter table public.user_notification_preferences enable row level security;
alter table public.user_dashboard_stats enable row level security;
alter table public.user_achievements enable row level security;

grant select, insert, update, delete on public.user_saved_matches, public.user_notification_preferences, public.user_dashboard_stats, public.user_achievements to authenticated;

drop policy if exists "favorite_teams_update_own" on public.user_favorite_teams;
create policy "favorite_teams_update_own"
on public.user_favorite_teams for update
to authenticated
using (user_id = auth.uid() or app_private.is_admin())
with check (user_id = auth.uid() or app_private.is_admin());

drop policy if exists "saved_matches_select_own" on public.user_saved_matches;
create policy "saved_matches_select_own"
on public.user_saved_matches for select
to authenticated
using (user_id = auth.uid() or app_private.is_admin());

drop policy if exists "saved_matches_insert_own" on public.user_saved_matches;
create policy "saved_matches_insert_own"
on public.user_saved_matches for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "saved_matches_update_own" on public.user_saved_matches;
create policy "saved_matches_update_own"
on public.user_saved_matches for update
to authenticated
using (user_id = auth.uid() or app_private.is_admin())
with check (user_id = auth.uid() or app_private.is_admin());

drop policy if exists "saved_matches_delete_own" on public.user_saved_matches;
create policy "saved_matches_delete_own"
on public.user_saved_matches for delete
to authenticated
using (user_id = auth.uid() or app_private.is_admin());

drop policy if exists "notification_preferences_select_own" on public.user_notification_preferences;
create policy "notification_preferences_select_own"
on public.user_notification_preferences for select
to authenticated
using (user_id = auth.uid() or app_private.is_admin());

drop policy if exists "notification_preferences_insert_own" on public.user_notification_preferences;
create policy "notification_preferences_insert_own"
on public.user_notification_preferences for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "notification_preferences_update_own" on public.user_notification_preferences;
create policy "notification_preferences_update_own"
on public.user_notification_preferences for update
to authenticated
using (user_id = auth.uid() or app_private.is_admin())
with check (user_id = auth.uid() or app_private.is_admin());

drop policy if exists "dashboard_stats_select_own" on public.user_dashboard_stats;
create policy "dashboard_stats_select_own"
on public.user_dashboard_stats for select
to authenticated
using (user_id = auth.uid() or app_private.is_admin());

drop policy if exists "dashboard_stats_insert_own" on public.user_dashboard_stats;
create policy "dashboard_stats_insert_own"
on public.user_dashboard_stats for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "dashboard_stats_update_own" on public.user_dashboard_stats;
create policy "dashboard_stats_update_own"
on public.user_dashboard_stats for update
to authenticated
using (user_id = auth.uid() or app_private.is_admin())
with check (user_id = auth.uid() or app_private.is_admin());

drop policy if exists "achievements_select_own" on public.user_achievements;
create policy "achievements_select_own"
on public.user_achievements for select
to authenticated
using (user_id = auth.uid() or app_private.is_admin());

drop policy if exists "achievements_insert_own" on public.user_achievements;
create policy "achievements_insert_own"
on public.user_achievements for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "achievements_update_admin" on public.user_achievements;
create policy "achievements_update_admin"
on public.user_achievements for update
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());
