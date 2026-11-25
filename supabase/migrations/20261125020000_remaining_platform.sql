-- Ahde Vefa remaining platform paths. Apply after 20261125010000_teacher_student_notes.sql.
begin;

alter table public.messages add column if not exists kind text not null default 'text' check (kind in ('text','audio','file'));
create index if not exists messages_sender_created_idx on public.messages(sender_id, created_at desc);

create or replace function public.can_message(_other uuid)
returns boolean language sql stable security definer set search_path=public,pg_catalog as $$
  select _other is not null and _other <> auth.uid() and (
    exists(select 1 from public.teacher_students ts where ts.active and ((ts.teacher_id=auth.uid() and ts.student_id=_other) or (ts.student_id=auth.uid() and ts.teacher_id=_other)))
    or exists(select 1 from public.conversation_members cm join public.conversation_members other on other.conversation_id=cm.conversation_id where cm.user_id=auth.uid() and other.user_id=_other)
  )
$$;

create or replace function public.create_direct_conversation(_other uuid)
returns uuid language plpgsql security definer set search_path=public,pg_catalog as $$
declare v_id uuid;
begin
  if auth.uid() is null or not public.can_message(_other) then raise exception 'not allowed'; end if;
  select cm.conversation_id into v_id from public.conversation_members cm join public.conversation_members other on other.conversation_id=cm.conversation_id where cm.user_id=auth.uid() and other.user_id=_other limit 1;
  if v_id is not null then return v_id; end if;
  insert into public.conversations(created_by) values(auth.uid()) returning id into v_id;
  insert into public.conversation_members(conversation_id,user_id,member_role) values(v_id,auth.uid(),'member'),(v_id,_other,'member');
  return v_id;
end $$;

create or replace function public.send_direct_message(_conversation uuid,_body text,_kind text default 'text')
returns jsonb language plpgsql security definer set search_path=public,pg_catalog as $$
declare v_message public.messages; v_recipient uuid;
begin
  if auth.uid() is null or char_length(trim(coalesce(_body,'')))=0 or char_length(_body)>10000 then raise exception 'invalid message'; end if;
  if not exists(select 1 from public.conversation_members where conversation_id=_conversation and user_id=auth.uid()) then raise exception 'not allowed'; end if;
  insert into public.messages(conversation_id,sender_id,body,kind) values(_conversation,auth.uid(),trim(_body),coalesce(_kind,'text')) returning * into v_message;
  update public.conversations set updated_at=now() where id=_conversation;
  select user_id into v_recipient from public.conversation_members where conversation_id=_conversation and user_id<>auth.uid() limit 1;
  if v_recipient is not null then insert into public.notifications(user_id,kind,title,body) values(v_recipient,case when v_message.kind='audio' then 'audio_message' else 'message' end,'Yeni mesaj','Bir yol arkadaşından yeni bir mesajınız var.'); end if;
  return to_jsonb(v_message);
end $$;

create or replace function public.mark_conversation_read(_conversation uuid)
returns integer language plpgsql security definer set search_path=public,pg_catalog as $$
declare n integer;
begin
  if not exists(select 1 from public.conversation_members where conversation_id=_conversation and user_id=auth.uid()) then raise exception 'not allowed'; end if;
  update public.messages set read_at=coalesce(read_at,now()) where conversation_id=_conversation and sender_id<>auth.uid() and read_at is null;
  get diagnostics n=row_count; return n;
end $$;

revoke all on function public.create_direct_conversation(uuid) from public; grant execute on function public.create_direct_conversation(uuid) to authenticated;
revoke all on function public.send_direct_message(uuid,text,text) from public; grant execute on function public.send_direct_message(uuid,text,text) to authenticated;
revoke all on function public.mark_conversation_read(uuid) from public; grant execute on function public.mark_conversation_read(uuid) to authenticated;

-- Social interactions are scoped to public posts and the acting user.
drop policy if exists comments_public_read on public.comments;
create policy comments_public_read on public.comments for select to anon,authenticated using(exists(select 1 from public.posts p where p.id=post_id and p.visibility='public' and p.status='published'));
drop policy if exists comments_owner_write on public.comments;
create policy comments_owner_write on public.comments for all to authenticated using(author_id=auth.uid()) with check(author_id=auth.uid());
drop policy if exists likes_self_write on public.likes;
create policy likes_self_write on public.likes for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
drop policy if exists posts_owner_delete on public.posts;
create policy posts_owner_delete on public.posts for delete to authenticated using(private.owns_post(id,auth.uid()));

grant select,insert,delete on public.comments,public.likes to authenticated;
grant delete on public.posts to authenticated;

-- Reports and blocks are never public.
drop policy if exists reports_owner_write on public.reports;
create policy reports_owner_write on public.reports for insert to authenticated with check(reporter_id=auth.uid());
drop policy if exists reports_owner_read on public.reports;
create policy reports_owner_read on public.reports for select to authenticated using(reporter_id=auth.uid());
grant insert,select on public.reports to authenticated;

-- Conversation writes happen only through the guarded RPCs.
drop policy if exists conversations_member_read on public.conversations;
create policy conversations_member_read on public.conversations for select to authenticated using(exists(select 1 from public.conversation_members cm where cm.conversation_id=id and cm.user_id=auth.uid()));
drop policy if exists conversation_members_self_read on public.conversation_members;
create policy conversation_members_self_read on public.conversation_members for select to authenticated using(user_id=auth.uid() or exists(select 1 from public.conversation_members me where me.conversation_id=conversation_id and me.user_id=auth.uid()));
drop policy if exists messages_member_read on public.messages;
create policy messages_member_read on public.messages for select to authenticated using(exists(select 1 from public.conversation_members cm where cm.conversation_id=messages.conversation_id and cm.user_id=auth.uid()));
drop policy if exists messages_member_update on public.messages;
create policy messages_member_update on public.messages for update to authenticated using(exists(select 1 from public.conversation_members cm where cm.conversation_id=messages.conversation_id and cm.user_id=auth.uid())) with check(exists(select 1 from public.conversation_members cm where cm.conversation_id=messages.conversation_id and cm.user_id=auth.uid()));
grant select,update on public.messages to authenticated;

-- Letters can be drafted, scheduled, sent, and archived by their owner.
drop policy if exists letters_participant_read on public.letters;
create policy letters_participant_read on public.letters for select to authenticated using(sender_id=auth.uid() or (recipient_id=auth.uid() and status='sent' and (deliver_at is null or deliver_at<=now())));
drop policy if exists letters_sender_write on public.letters;
create policy letters_sender_write on public.letters for insert to authenticated with check(sender_id=auth.uid());
drop policy if exists letters_sender_update on public.letters;
create policy letters_sender_update on public.letters for update to authenticated using(sender_id=auth.uid()) with check(sender_id=auth.uid());

grant insert,update on public.letters to authenticated;

commit;
