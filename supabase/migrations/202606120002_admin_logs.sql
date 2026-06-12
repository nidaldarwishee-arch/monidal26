create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_logs enable row level security;

grant select, insert, update, delete on public.admin_logs to authenticated;

create policy "admin_logs_admin_select"
on public.admin_logs for select
to authenticated
using (app_private.is_admin());

create policy "admin_logs_admin_insert"
on public.admin_logs for insert
to authenticated
with check (app_private.is_admin());
