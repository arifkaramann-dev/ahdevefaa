-- Ahde Vefa routine support program: prayer spine, gentle daily planning and tiny next steps.
begin;

alter table public.routines add column if not exists next_action text not null default '' check (char_length(next_action) <= 500);
alter table public.routines add column if not exists minimum_step text not null default '' check (char_length(minimum_step) <= 500);
alter table public.routines add column if not exists ideal_step text not null default '' check (char_length(ideal_step) <= 500);
alter table public.routines add column if not exists anchor_prayer text not null default 'none' check (anchor_prayer in ('none','Sabah','Öğle','İkindi','Akşam','Yatsı'));
alter table public.routines add column if not exists priority smallint not null default 2 check (priority between 1 and 3);

create table if not exists public.daily_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  energy text not null check (energy in ('low','gentle','steady','good')),
  capacity smallint not null default 1 check (capacity between 1 and 3),
  note text not null default '' check (char_length(note) <= 500),
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, date)
);

create index if not exists daily_plans_user_date_idx on public.daily_plans(user_id, date desc);
alter table public.daily_plans enable row level security;
drop policy if exists daily_plans_owner_all on public.daily_plans;
create policy daily_plans_owner_all on public.daily_plans for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update, delete on public.daily_plans to authenticated;
grant update(next_action,minimum_step,ideal_step,anchor_prayer,priority,updated_at) on public.routines to authenticated;

commit;
