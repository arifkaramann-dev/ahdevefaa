-- Ahde Vefa guidance core. Apply after 20261125020000_remaining_platform.sql.
begin;

create table if not exists public.routine_starts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  routine_id uuid not null references public.routines(id) on delete cascade,
  date date not null,
  started_at timestamptz not null default now(),
  step text not null default '' check (char_length(step) <= 500)
);
create index if not exists routine_starts_user_date_idx on public.routine_starts(user_id,date desc);
create index if not exists routine_starts_routine_date_idx on public.routine_starts(routine_id,date desc);
alter table public.routine_starts enable row level security;
drop policy if exists routine_starts_owner_all on public.routine_starts;
create policy routine_starts_owner_all on public.routine_starts for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
grant select,insert on public.routine_starts to authenticated;

create table if not exists public.daily_plan_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  worked text not null default '' check (char_length(worked) <= 2000),
  friction text not null default '' check (char_length(friction) <= 2000),
  next_adjustment text not null default '' check (char_length(next_adjustment) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,date)
);
create index if not exists daily_plan_reviews_user_date_idx on public.daily_plan_reviews(user_id,date desc);
alter table public.daily_plan_reviews enable row level security;
drop policy if exists daily_plan_reviews_owner_all on public.daily_plan_reviews;
create policy daily_plan_reviews_owner_all on public.daily_plan_reviews for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
grant select,insert,update,delete on public.daily_plan_reviews to authenticated;

create table if not exists public.teacher_checkins (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  meeting_date date not null default current_date,
  summary text not null default '' check (char_length(summary) <= 5000),
  next_step text not null default '' check (char_length(next_step) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists teacher_checkins_teacher_student_idx on public.teacher_checkins(teacher_id,student_id,meeting_date desc);
alter table public.teacher_checkins enable row level security;
drop policy if exists teacher_checkins_teacher_all on public.teacher_checkins;
create policy teacher_checkins_teacher_all on public.teacher_checkins for all to authenticated
using(teacher_id=(select auth.uid()) and exists(select 1 from public.teacher_students ts where ts.teacher_id=(select auth.uid()) and ts.student_id=teacher_checkins.student_id and ts.active))
with check(teacher_id=(select auth.uid()) and exists(select 1 from public.teacher_students ts where ts.teacher_id=(select auth.uid()) and ts.student_id=teacher_checkins.student_id and ts.active));
grant select,insert,update,delete on public.teacher_checkins to authenticated;

-- Teachers may issue and review progress for assignments belonging to their active students.
drop policy if exists assignments_participant_read on public.assignments;
create policy assignments_participant_read on public.assignments for select to authenticated
using(student_id=(select auth.uid()) or teacher_id=(select auth.uid()));
drop policy if exists assignments_teacher_insert on public.assignments;
create policy assignments_teacher_insert on public.assignments for insert to authenticated
with check(teacher_id=(select auth.uid()) and exists(select 1 from public.teacher_students ts where ts.teacher_id=(select auth.uid()) and ts.student_id=assignments.student_id and ts.active));
drop policy if exists assignments_teacher_update on public.assignments;
create policy assignments_teacher_update on public.assignments for update to authenticated
using(teacher_id=(select auth.uid())) with check(teacher_id=(select auth.uid()));
drop policy if exists assignments_teacher_delete on public.assignments;
create policy assignments_teacher_delete on public.assignments for delete to authenticated using(teacher_id=(select auth.uid()));
grant insert,update,delete on public.assignments to authenticated;

drop policy if exists assignment_logs_participant_read on public.assignment_logs;
create policy assignment_logs_participant_read on public.assignment_logs for select to authenticated
using(user_id=(select auth.uid()) or exists(select 1 from public.assignments a where a.id=assignment_logs.assignment_id and a.teacher_id=(select auth.uid())));
grant select on public.assignment_logs to authenticated;

commit;
