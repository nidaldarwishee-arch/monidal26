create table if not exists public.match_stages (
  id text primary key check (id in ('GS', 'R32', 'R16', 'QF', 'SF', '3P', 'F')),
  name_en text not null,
  name_ar text not null,
  stage_order integer not null unique check (stage_order > 0),
  is_knockout boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.match_stages (id, name_en, name_ar, stage_order, is_knockout)
values
  ('GS', 'Group Stage', 'دور المجموعات', 10, false),
  ('R32', 'Round of 32', 'دور الـ 32', 20, true),
  ('R16', 'Round of 16', 'دور الـ 16', 30, true),
  ('QF', 'Quarter-finals', 'ربع النهائي', 40, true),
  ('SF', 'Semi-finals', 'نصف النهائي', 50, true),
  ('3P', 'Third-place match', 'مباراة المركز الثالث', 60, true),
  ('F', 'Final', 'النهائي', 70, true)
on conflict (id) do update
set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  stage_order = excluded.stage_order,
  is_knockout = excluded.is_knockout,
  updated_at = now();

drop trigger if exists match_stages_set_updated_at on public.match_stages;
create trigger match_stages_set_updated_at
before update on public.match_stages
for each row execute function app_private.set_updated_at();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'matches_round_fkey'
      and conrelid = 'public.matches'::regclass
  ) then
    alter table public.matches
      add constraint matches_round_fkey
      foreign key (round)
      references public.match_stages(id)
      on update cascade;
  end if;
end;
$$;

alter table public.match_stages enable row level security;

grant select on public.match_stages to anon, authenticated;
grant select, insert, update, delete on public.match_stages to authenticated;

drop policy if exists "match_stages_public_select" on public.match_stages;
create policy "match_stages_public_select"
on public.match_stages for select
to anon, authenticated
using (true);

drop policy if exists "match_stages_admin_manage" on public.match_stages;
create policy "match_stages_admin_manage"
on public.match_stages for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());
