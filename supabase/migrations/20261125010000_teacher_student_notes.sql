-- Private teacher-side follow-up notes for active students.
begin;

create table if not exists public.teacher_student_notes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  body text not null default '' check (char_length(body) <= 5000),
  category text not null default 'follow_up' check (category in ('health','family','joy','concern','follow_up','other')),
  reminder_date date,
  is_completed boolean not null default false,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  check (completed_at is null or is_completed is true)
);

create index if not exists teacher_student_notes_teacher_date_idx on public.teacher_student_notes(teacher_id, reminder_date, is_completed);
create index if not exists teacher_student_notes_student_idx on public.teacher_student_notes(student_id, teacher_id);

alter table public.teacher_student_notes enable row level security;
drop policy if exists teacher_student_notes_teacher_all on public.teacher_student_notes;
create policy teacher_student_notes_teacher_all on public.teacher_student_notes for all to authenticated
  using (
    teacher_id = (select auth.uid())
    and exists (select 1 from public.teachers t where t.id = public.teacher_student_notes.teacher_id and t.approved)
    and exists (select 1 from public.teacher_students ts where ts.teacher_id = public.teacher_student_notes.teacher_id and ts.student_id = public.teacher_student_notes.student_id and ts.active)
  )
  with check (
    teacher_id = (select auth.uid())
    and exists (select 1 from public.teachers t where t.id = public.teacher_student_notes.teacher_id and t.approved)
    and exists (select 1 from public.teacher_students ts where ts.teacher_id = public.teacher_student_notes.teacher_id and ts.student_id = public.teacher_student_notes.student_id and ts.active)
  );

grant select, insert, update, delete on public.teacher_student_notes to authenticated;
grant insert(teacher_id,student_id,title,body,category,reminder_date,is_pinned) on public.teacher_student_notes to authenticated;
grant update(title,body,category,reminder_date,is_completed,is_pinned,updated_at,completed_at) on public.teacher_student_notes to authenticated;

commit;
