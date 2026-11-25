-- Ahde Vefa routines, habits and todo tracking. Apply after the existing migrations.
begin;

create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '' check (char_length(description) <= 2000),
  kind text not null default 'task' check (kind in ('task','habit')),
  frequency text not null default 'once' check (frequency in ('once','daily','weekdays','weekly','monthly')),
  days_of_week smallint[] not null default '{}'::smallint[] check (array_position(days_of_week, null) is null and cardinality(days_of_week) <= 7),
  start_date date not null default current_date,
  due_date date,
  target_count integer not null default 1 check (target_count between 1 and 100),
  color text not null default 'forest' check (color in ('forest','gold','stone','plum','blue')),
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (due_date is null or due_date >= start_date)
);

create table if not exists public.routine_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  routine_id uuid not null references public.routines(id) on delete cascade,
  date date not null,
  completed boolean not null default true,
  note text not null default '' check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, routine_id, date)
);

create index if not exists routines_user_active_idx on public.routines(user_id, is_archived, start_date, created_at desc);
create index if not exists routine_logs_user_date_idx on public.routine_logs(user_id, date desc);
create index if not exists routine_logs_routine_date_idx on public.routine_logs(routine_id, date desc);

alter table public.routines enable row level security;
alter table public.routine_logs enable row level security;

drop policy if exists routines_owner_all on public.routines;
create policy routines_owner_all on public.routines for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists routine_logs_owner_all on public.routine_logs;
create policy routine_logs_owner_all on public.routine_logs for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and exists (
    select 1 from public.routines r where r.id = routine_id and r.user_id = (select auth.uid())
  ));

grant select, insert, update, delete on public.routines to authenticated;
grant select, insert, update, delete on public.routine_logs to authenticated;

commit;
