-- Ahde Vefa stages 1-2 foundation. Review and apply manually in the Supabase SQL Editor.
-- This migration is intentionally not applied by the application or this task.

begin;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;
revoke all on schema private from public;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 100),
  username text not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
  bio text default '' check (bio is null or char_length(bio) <= 400),
  avatar_path text,
  notification_preferences jsonb not null default '{}'::jsonb check (jsonb_typeof(notification_preferences) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- This mapping is independent from profile/user metadata and is never user-editable.
create table if not exists public.roles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('member','dervish','teacher','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teachers (
  id uuid primary key references public.profiles(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 100),
  bio text not null default '' check (char_length(bio) <= 2000),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.teacher_applications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected','withdrawn')),
  message text not null default '' check (char_length(message) <= 2000),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (student_id, teacher_id, id)
);
create unique index if not exists teacher_applications_one_pending_idx on public.teacher_applications(student_id, teacher_id) where status = 'pending';
create index if not exists teacher_applications_teacher_status_idx on public.teacher_applications(teacher_id, status, created_at desc);

create table if not exists public.teacher_students (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  ended_at timestamptz,
  unique (teacher_id, student_id)
);
create unique index if not exists teacher_students_one_active_teacher_per_student_idx on public.teacher_students(student_id) where active;
create index if not exists teacher_students_teacher_active_idx on public.teacher_students(teacher_id, active, student_id);

-- Later-stage content tables are present but remain locked by RLS and table privileges.
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(), author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null default '', visibility text not null default 'private' check (visibility in ('public','teacher','private')),
  status text not null default 'draft' check (status in ('draft','published','removed')), media_paths text[] not null default '{}',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists posts_author_created_idx on public.posts(author_id, created_at desc);
create index if not exists posts_visibility_status_created_idx on public.posts(visibility, status, created_at desc);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(), post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade, parent_id uuid references public.comments(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 8000), created_at timestamptz not null default now()
);
create index if not exists comments_post_created_idx on public.comments(post_id, created_at);

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(), post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade, created_at timestamptz not null default now(), unique(post_id,user_id)
);
create index if not exists likes_user_created_idx on public.likes(user_id, created_at desc);

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(), author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null default '', media_path text, visibility text not null default 'private' check (visibility in ('public','teacher','private')),
  expires_at timestamptz, created_at timestamptz not null default now()
);
create index if not exists stories_author_created_idx on public.stories(author_id, created_at desc);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(), created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists conversations_created_by_idx on public.conversations(created_by, created_at desc);

create table if not exists public.conversation_members (
  id uuid primary key default gen_random_uuid(), conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade, member_role text not null default 'member',
  joined_at timestamptz not null default now(), unique(conversation_id,user_id)
);
create index if not exists conversation_members_user_idx on public.conversation_members(user_id, conversation_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(), conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade, body text not null default '',
  created_at timestamptz not null default now(), read_at timestamptz
);
create index if not exists messages_conversation_created_idx on public.messages(conversation_id, created_at);

create table if not exists public.message_attachments (
  id uuid primary key default gen_random_uuid(), message_id uuid not null references public.messages(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade, storage_path text not null,
  mime_type text not null, created_at timestamptz not null default now()
);
create index if not exists message_attachments_owner_idx on public.message_attachments(owner_id, created_at desc);

create table if not exists public.mood_entries (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  mood text not null check (mood in ('Huzurlu','Mutlu','Üzgün','Sıkıntılı','Öfkeli','İsteksiz','Yorgun','Huzursuz','Heyecanlı','Şükür hâlinde','Diğer')), note text not null default '' check (char_length(note) <= 4000),
  recorded_at timestamptz not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists mood_entries_user_recorded_idx on public.mood_entries(user_id, recorded_at desc);

create table if not exists public.prayer_entries (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null, prayer text not null check (prayer in ('Sabah','Öğle','İkindi','Akşam','Yatsı')),
  completed boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(user_id,date,prayer)
);
create index if not exists prayer_entries_user_date_idx on public.prayer_entries(user_id, date desc);

create table if not exists public.worship_entries (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null, name text not null check (char_length(name) between 1 and 100),
  category text not null check (category in ('daily','qaza','nafile')), amount integer not null default 0 check (amount between 0 and 1000000),
  note text not null default '' check (char_length(note) <= 2000), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists worship_entries_user_date_idx on public.worship_entries(user_id, date desc);

create table if not exists public.wirds (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120), target integer not null check (target between 1 and 1000000),
  start_date date not null, end_date date, description text not null default '' check (char_length(description) <= 4000),
  frequency text not null check (frequency in ('daily','weekly','monthly')), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);
create index if not exists wirds_user_created_idx on public.wirds(user_id, created_at desc);

create table if not exists public.wird_logs (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  wird_id uuid not null references public.wirds(id) on delete cascade, date date not null, amount integer not null check (amount between 0 and 1000000),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id,wird_id,date)
);
create index if not exists wird_logs_user_date_idx on public.wird_logs(user_id, date desc);
create index if not exists wird_logs_wird_idx on public.wird_logs(wird_id, date desc);

create table if not exists public.dreams (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200), narrative text not null check (char_length(narrative) between 1 and 20000),
  date date not null, waking_feeling text not null default '' check (char_length(waking_feeling) <= 500),
  dream_feeling text not null default '' check (char_length(dream_feeling) <= 500), personal_notes text not null default '' check (char_length(personal_notes) <= 8000),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists dreams_user_date_idx on public.dreams(user_id, date desc);

create table if not exists public.self_reflections (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null, answers jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object'),
  note text not null default '' check (char_length(note) <= 8000), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id,date)
);
create index if not exists self_reflections_user_date_idx on public.self_reflections(user_id, date desc);

create table if not exists public.reflection_questions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  question text not null check (char_length(question) between 1 and 500), created_at timestamptz not null default now()
);
create index if not exists reflection_questions_user_created_idx on public.reflection_questions(user_id, created_at);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(), teacher_id uuid not null references public.teachers(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade, title text not null check (char_length(title) between 1 and 200),
  description text not null default '', target integer not null default 1 check (target between 1 and 1000000), due_date date,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists assignments_student_created_idx on public.assignments(student_id, created_at desc);
create index if not exists assignments_teacher_created_idx on public.assignments(teacher_id, created_at desc);

create table if not exists public.assignment_logs (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  assignment_id uuid not null references public.assignments(id) on delete cascade, date date not null,
  amount integer not null check (amount between 0 and 1000000), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(user_id,assignment_id,date)
);
create index if not exists assignment_logs_user_date_idx on public.assignment_logs(user_id, date desc);
create index if not exists assignment_logs_assignment_idx on public.assignment_logs(assignment_id, date desc);

create table if not exists public.library_items (
  id uuid primary key default gen_random_uuid(), teacher_id uuid references public.teachers(id) on delete set null,
  title text not null, description text not null default '', category text not null default '', source text not null default '',
  storage_path text, is_published boolean not null default false, created_at timestamptz not null default now()
);
create index if not exists library_items_published_created_idx on public.library_items(is_published, created_at desc);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(), teacher_id uuid not null references public.teachers(id) on delete cascade,
  title text not null, body text not null default '', media_path text, category text not null default '', source text not null default '',
  is_published boolean not null default false, created_at timestamptz not null default now()
);
create index if not exists lessons_teacher_created_idx on public.lessons(teacher_id, created_at desc);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(), host_teacher_id uuid references public.teachers(id) on delete set null,
  title text not null, description text not null default '', starts_at timestamptz not null, ends_at timestamptz,
  location text not null default '', is_published boolean not null default false, created_at timestamptz not null default now()
);
create index if not exists events_published_starts_idx on public.events(is_published, starts_at);

create table if not exists public.letters (
  id uuid primary key default gen_random_uuid(), sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid references public.profiles(id) on delete set null, title text not null default '', body text not null default '',
  deliver_at timestamptz, archived_at timestamptz, created_at timestamptz not null default now()
);
create index if not exists letters_sender_created_idx on public.letters(sender_id, created_at desc);
create index if not exists letters_recipient_deliver_idx on public.letters(recipient_id, deliver_at);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null, title text not null, body text not null default '', read_at timestamptz, created_at timestamptz not null default now()
);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(), reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null, target_id uuid not null, reason text not null, status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now(), resolved_at timestamptz
);
create index if not exists reports_status_created_idx on public.reports(status, created_at);

create table if not exists public.privacy_permissions (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  module text not null check (module in ('dreams','mood_entries','self_reflections')),
  record_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index if not exists privacy_permissions_unique_grant_idx on public.privacy_permissions(owner_id,teacher_id,module,coalesce(record_id,'00000000-0000-0000-0000-000000000000'::uuid));
create index if not exists privacy_permissions_owner_idx on public.privacy_permissions(owner_id, created_at desc);
create index if not exists privacy_permissions_teacher_idx on public.privacy_permissions(teacher_id, owner_id, module);

-- User signup creates a member profile from bounded metadata; role metadata is deliberately ignored.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_username text;
  v_full_name text;
  v_bio text;
begin
  v_full_name := left(coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), 'Yeni üye'), 100);
  v_username := lower(coalesce(nullif(btrim(new.raw_user_meta_data ->> 'username'), ''), 'u' || substr(replace(new.id::text, '-', ''), 1, 23)));
  if v_username !~ '^[a-z0-9_]{3,24}$' then
    v_username := 'u' || substr(replace(new.id::text, '-', ''), 1, 23);
  end if;
  v_bio := left(coalesce(new.raw_user_meta_data ->> 'bio', ''), 400);
  insert into public.profiles(id, full_name, username, bio)
    values (new.id, v_full_name, v_username, v_bio)
    on conflict (id) do nothing;
  insert into public.roles(user_id, role) values (new.id, 'member') on conflict (user_id) do nothing;
  return new;
end;
$$;
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created_ahdevefa on auth.users;
create trigger on_auth_user_created_ahdevefa after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- Backfill profiles and ordinary-member roles for existing Auth users. Existing role rows are preserved.
with candidates as (
  select u.id, u.raw_user_meta_data,
         lower(coalesce(nullif(btrim(u.raw_user_meta_data ->> 'username'), ''), '')) as requested_username,
         row_number() over (
           partition by lower(coalesce(nullif(btrim(u.raw_user_meta_data ->> 'username'), ''), ''))
           order by u.id
         ) as username_rank
  from auth.users as u
), normalized as (
  select c.id, c.raw_user_meta_data,
         case when c.requested_username ~ '^[a-z0-9_]{3,24}$' and c.username_rank = 1
                    and not exists(select 1 from public.profiles p where p.username = c.requested_username)
              then c.requested_username else 'u' || substr(replace(c.id::text, '-', ''), 1, 23) end as safe_username
  from candidates c
)
insert into public.profiles(id, full_name, username, bio)
select n.id,
       left(coalesce(nullif(btrim(n.raw_user_meta_data ->> 'full_name'), ''), 'Yeni üye'), 100),
       n.safe_username,
       left(coalesce(n.raw_user_meta_data ->> 'bio', ''), 400)
from normalized as n
on conflict (id) do nothing;
insert into public.roles(user_id, role)
select u.id, 'member' from auth.users as u
on conflict (user_id) do nothing;

create or replace function private.has_role(_user_id uuid, _role text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.roles r where r.user_id = _user_id and r.role = _role)
$$;

create or replace function private.is_active_teacher_link(_student_id uuid, _teacher_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(
    select 1 from public.teacher_students ts
    join public.teachers t on t.id = ts.teacher_id and t.approved
    where ts.student_id = _student_id and ts.teacher_id = _teacher_id and ts.active
  )
$$;

create or replace function private.can_teacher_read_record(_owner_id uuid, _module text, _record_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.has_role(auth.uid(), 'teacher')
    and private.is_active_teacher_link(_owner_id, auth.uid())
    and exists (
      select 1 from public.privacy_permissions p
      where p.owner_id = _owner_id and p.teacher_id = auth.uid() and p.module = _module
        and (p.record_id is null or p.record_id = _record_id)
    )
$$;

create or replace function private.valid_permission_target(_owner_id uuid, _teacher_id uuid, _module text, _record_id uuid)
returns boolean language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.has_role(_owner_id, 'dervish') or not private.is_active_teacher_link(_owner_id, _teacher_id) then return false; end if;
  if _record_id is null then return true; end if;
  if _module = 'dreams' then
    return exists(select 1 from public.dreams d where d.id = _record_id and d.user_id = _owner_id);
  elsif _module = 'mood_entries' then
    return exists(select 1 from public.mood_entries m where m.id = _record_id and m.user_id = _owner_id);
  elsif _module = 'self_reflections' then
    return exists(select 1 from public.self_reflections r where r.id = _record_id and r.user_id = _owner_id);
  end if;
  return false;
end;
$$;

create or replace function private.owns_wird(_wird_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.wirds w where w.id = _wird_id and w.user_id = _user_id)
$$;

create or replace function private.owns_assignment(_assignment_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(
    select 1 from public.assignments a
    where a.id = _assignment_id and a.student_id = _user_id
      and private.is_active_teacher_link(a.student_id, a.teacher_id)
  )
$$;

revoke all on function private.has_role(uuid,text) from public, anon;
revoke all on function private.is_active_teacher_link(uuid,uuid) from public, anon;
revoke all on function private.can_teacher_read_record(uuid,text,uuid) from public, anon;
revoke all on function private.valid_permission_target(uuid,uuid,text,uuid) from public, anon;
revoke all on function private.owns_wird(uuid,uuid) from public, anon;
revoke all on function private.owns_assignment(uuid,uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.has_role(uuid,text) to authenticated;
grant execute on function private.is_active_teacher_link(uuid,uuid) to authenticated;
grant execute on function private.can_teacher_read_record(uuid,text,uuid) to authenticated;
grant execute on function private.valid_permission_target(uuid,uuid,text,uuid) to authenticated;
grant execute on function private.owns_wird(uuid,uuid) to authenticated;
grant execute on function private.owns_assignment(uuid,uuid) to authenticated;

-- RLS is enabled for every application table; later-stage tables have no access policies or grants.
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','roles','teachers','teacher_applications','teacher_students','posts','comments','likes','stories',
    'messages','message_attachments','mood_entries','prayer_entries','worship_entries','wirds','wird_logs','dreams',
    'self_reflections','assignments','assignment_logs','conversations','conversation_members','library_items','lessons',
    'events','letters','notifications','reports','privacy_permissions','reflection_questions'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from public, anon, authenticated', t);
  end loop;
end;
$$;

-- Self-only account/profile reads and safe profile edits. Identity/role columns are not writable.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using (id = (select auth.uid()));
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
grant select on public.profiles to authenticated;
grant update(full_name, username, bio, avatar_path, notification_preferences, updated_at) on public.profiles to authenticated;

drop policy if exists roles_select_own on public.roles;
create policy roles_select_own on public.roles for select to authenticated using (user_id = (select auth.uid()));
grant select on public.roles to authenticated;

-- Approved teacher directory is the only anonymous/public table data.
drop policy if exists teachers_select_approved on public.teachers;
create policy teachers_select_approved on public.teachers for select to anon, authenticated using (approved is true);
grant select on public.teachers to anon, authenticated;

-- Connection applications: users may create a pending application to an approved teacher and manage only their own pending request.
drop policy if exists teacher_applications_select_student on public.teacher_applications;
create policy teacher_applications_select_student on public.teacher_applications for select to authenticated using (student_id = (select auth.uid()));
drop policy if exists teacher_applications_insert_student on public.teacher_applications;
create policy teacher_applications_insert_student on public.teacher_applications for insert to authenticated with check (
  student_id = (select auth.uid()) and status = 'pending'
  and exists(select 1 from public.teachers t where t.id = teacher_id and t.approved)
);
drop policy if exists teacher_applications_delete_pending on public.teacher_applications;
create policy teacher_applications_delete_pending on public.teacher_applications for delete to authenticated using (student_id = (select auth.uid()) and status = 'pending');
grant select, delete on public.teacher_applications to authenticated;
grant insert(student_id, teacher_id, message) on public.teacher_applications to authenticated;

drop policy if exists teacher_students_select_participant on public.teacher_students;
create policy teacher_students_select_participant on public.teacher_students for select to authenticated using (student_id = (select auth.uid()) or teacher_id = (select auth.uid()));
grant select on public.teacher_students to authenticated;

-- Private personal entries: owners have CRUD; only an approved, actively linked teacher with a matching permission may read selected records.
drop policy if exists mood_entries_owner_all on public.mood_entries;
create policy mood_entries_owner_all on public.mood_entries for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists mood_entries_teacher_shared_read on public.mood_entries;
create policy mood_entries_teacher_shared_read on public.mood_entries for select to authenticated using (private.can_teacher_read_record(user_id, 'mood_entries', id));
grant select, insert, delete on public.mood_entries to authenticated;
grant insert(user_id,mood,note,recorded_at) on public.mood_entries to authenticated;
grant update(mood,note,recorded_at,updated_at) on public.mood_entries to authenticated;

drop policy if exists prayer_entries_owner_all on public.prayer_entries;
create policy prayer_entries_owner_all on public.prayer_entries for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, delete on public.prayer_entries to authenticated;
grant insert(user_id,date,prayer,completed) on public.prayer_entries to authenticated;
grant update(date,prayer,completed,updated_at) on public.prayer_entries to authenticated;

drop policy if exists worship_entries_owner_all on public.worship_entries;
create policy worship_entries_owner_all on public.worship_entries for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, delete on public.worship_entries to authenticated;
grant insert(user_id,date,name,category,amount,note) on public.worship_entries to authenticated;
grant update(date,name,category,amount,note,updated_at) on public.worship_entries to authenticated;

drop policy if exists wirds_owner_all on public.wirds;
create policy wirds_owner_all on public.wirds for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, delete on public.wirds to authenticated;
grant insert(user_id,name,target,start_date,end_date,description,frequency) on public.wirds to authenticated;
grant update(name,target,start_date,end_date,description,frequency,updated_at) on public.wirds to authenticated;

drop policy if exists wird_logs_owner_all on public.wird_logs;
create policy wird_logs_owner_all on public.wird_logs for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and private.owns_wird(wird_id, (select auth.uid())));
grant select, delete on public.wird_logs to authenticated;
grant insert(user_id,wird_id,date,amount) on public.wird_logs to authenticated;
grant update(date,amount,updated_at) on public.wird_logs to authenticated;

drop policy if exists dreams_owner_all on public.dreams;
create policy dreams_owner_all on public.dreams for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists dreams_teacher_shared_read on public.dreams;
create policy dreams_teacher_shared_read on public.dreams for select to authenticated using (private.can_teacher_read_record(user_id, 'dreams', id));
grant select, delete on public.dreams to authenticated;
grant insert(user_id,title,narrative,date,waking_feeling,dream_feeling,personal_notes) on public.dreams to authenticated;
grant update(title,narrative,date,waking_feeling,dream_feeling,personal_notes,updated_at) on public.dreams to authenticated;

drop policy if exists self_reflections_owner_all on public.self_reflections;
create policy self_reflections_owner_all on public.self_reflections for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists self_reflections_teacher_shared_read on public.self_reflections;
create policy self_reflections_teacher_shared_read on public.self_reflections for select to authenticated using (private.can_teacher_read_record(user_id, 'self_reflections', id));
grant select, delete on public.self_reflections to authenticated;
grant insert(user_id,date,answers,note) on public.self_reflections to authenticated;
grant update(date,answers,note,updated_at) on public.self_reflections to authenticated;

drop policy if exists reflection_questions_owner_all on public.reflection_questions;
create policy reflection_questions_owner_all on public.reflection_questions for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, delete on public.reflection_questions to authenticated;
grant insert(user_id,question) on public.reflection_questions to authenticated;
grant update(question) on public.reflection_questions to authenticated;

-- Assignment rows are visible only to their student or issuing teacher. Student logs cannot cross assignment ownership.
drop policy if exists assignments_participant_read on public.assignments;
create policy assignments_participant_read on public.assignments for select to authenticated using (student_id = (select auth.uid()) or teacher_id = (select auth.uid()));
grant select on public.assignments to authenticated;
drop policy if exists assignment_logs_owner_all on public.assignment_logs;
create policy assignment_logs_owner_all on public.assignment_logs for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and private.owns_assignment(assignment_id, (select auth.uid())));
grant select, delete on public.assignment_logs to authenticated;
grant insert(user_id,assignment_id,date,amount) on public.assignment_logs to authenticated;
grant update(date,amount,updated_at) on public.assignment_logs to authenticated;

-- Permissions are visible only to their owner. Writes require an active approved teacher link and an owned referenced record.
drop policy if exists privacy_permissions_owner_select on public.privacy_permissions;
create policy privacy_permissions_owner_select on public.privacy_permissions for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists privacy_permissions_owner_insert on public.privacy_permissions;
create policy privacy_permissions_owner_insert on public.privacy_permissions for insert to authenticated with check (
  owner_id = (select auth.uid()) and private.valid_permission_target(owner_id,teacher_id,module,record_id)
);
drop policy if exists privacy_permissions_owner_update on public.privacy_permissions;
create policy privacy_permissions_owner_update on public.privacy_permissions for update to authenticated using (owner_id = (select auth.uid())) with check (
  owner_id = (select auth.uid()) and private.valid_permission_target(owner_id,teacher_id,module,record_id)
);
drop policy if exists privacy_permissions_owner_delete on public.privacy_permissions;
create policy privacy_permissions_owner_delete on public.privacy_permissions for delete to authenticated using (owner_id = (select auth.uid()));
grant select, delete on public.privacy_permissions to authenticated;
grant insert(owner_id,teacher_id,module,record_id) on public.privacy_permissions to authenticated;
grant update(teacher_id,module,record_id,updated_at) on public.privacy_permissions to authenticated;

-- Explicitly keep the next-stage tables inaccessible. RLS is enabled above, and no authenticated/anon grants exist.

-- Private storage buckets; object paths must start with the authenticated user's UUID directory.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars-private','avatars-private',false,2097152,array['image/png','image/jpeg','image/webp','image/gif']),
  ('personal-attachments','personal-attachments',false,15728640,array['image/png','image/jpeg','image/webp','image/gif','audio/mpeg','audio/ogg','audio/webm','application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists ahde_avatar_select_own on storage.objects;
create policy ahde_avatar_select_own on storage.objects for select to authenticated using (
  bucket_id = 'avatars-private' and (storage.foldername(name))[1] = (select auth.uid())::text
);
drop policy if exists ahde_avatar_insert_own on storage.objects;
create policy ahde_avatar_insert_own on storage.objects for insert to authenticated with check (
  bucket_id = 'avatars-private' and (storage.foldername(name))[1] = (select auth.uid())::text
);
drop policy if exists ahde_avatar_update_own on storage.objects;
create policy ahde_avatar_update_own on storage.objects for update to authenticated using (
  bucket_id = 'avatars-private' and (storage.foldername(name))[1] = (select auth.uid())::text
) with check (bucket_id = 'avatars-private' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists ahde_avatar_delete_own on storage.objects;
create policy ahde_avatar_delete_own on storage.objects for delete to authenticated using (
  bucket_id = 'avatars-private' and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists ahde_attachment_select_own on storage.objects;
create policy ahde_attachment_select_own on storage.objects for select to authenticated using (
  bucket_id = 'personal-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text
);
drop policy if exists ahde_attachment_insert_own on storage.objects;
create policy ahde_attachment_insert_own on storage.objects for insert to authenticated with check (
  bucket_id = 'personal-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text
);
drop policy if exists ahde_attachment_update_own on storage.objects;
create policy ahde_attachment_update_own on storage.objects for update to authenticated using (
  bucket_id = 'personal-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text
) with check (bucket_id = 'personal-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists ahde_attachment_delete_own on storage.objects;
create policy ahde_attachment_delete_own on storage.objects for delete to authenticated using (
  bucket_id = 'personal-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- The invoker wrapper accepts a password but no user ID; the private helper verifies the stored Auth hash.
create or replace function private.delete_own_auth_user(_password text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_password_hash text;
  v_password_check text;
  v_deleted uuid;
begin
  if v_uid is null then raise exception 'authentication required' using errcode = '42501'; end if;
  if _password is null or char_length(_password) < 1 or char_length(_password) > 72 then
    raise exception 'password verification failed' using errcode = '42501';
  end if;
  select u.encrypted_password into v_password_hash from auth.users as u where u.id = v_uid for update;
  if v_password_hash is null or v_password_hash = '' then
    raise exception 'password verification failed' using errcode = '42501';
  end if;
  if pg_catalog.to_regprocedure('extensions.crypt(text,text)') is not null then
    execute 'select extensions.crypt($1, $2)' into v_password_check using _password, v_password_hash;
  elsif pg_catalog.to_regprocedure('public.crypt(text,text)') is not null then
    execute 'select public.crypt($1, $2)' into v_password_check using _password, v_password_hash;
  else
    raise exception 'password verification unavailable' using errcode = '55000';
  end if;
  if v_password_check is distinct from v_password_hash then
    raise exception 'password verification failed' using errcode = '42501';
  end if;
  delete from auth.users where id = v_uid returning id into v_deleted;
  return v_deleted is not null;
end;
$$;
revoke all on function private.delete_own_auth_user(text) from public, anon;
grant execute on function private.delete_own_auth_user(text) to authenticated;
create or replace function public.delete_own_account(_password text)
returns boolean language sql security invoker set search_path = '' as $$
  select private.delete_own_auth_user(_password)
$$;
revoke all on function public.delete_own_account(text) from public, anon;
grant execute on function public.delete_own_account(text) to authenticated;

commit;
