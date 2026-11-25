import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { databaseRole, verifiedUser } from '@/lib/server/auth';
import { apiError, json } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rate-limit';
import type { WorkspaceData } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, 'workspace', 60, 60_000);
  if (limited) return limited;
  const client = await createSupabaseServerClient();
  if (!client) return apiError('Supabase bağlantısı yapılandırılmamış.', 503);
  const user = await verifiedUser(client);
  if (!user) return apiError('Oturum açmanız gerekiyor.', 401);
  const role = await databaseRole(client, user.id);
  if (!['dervish', 'teacher', 'admin'].includes(role)) return apiError('Kişisel odaya erişim yetkiniz yok.', 403);

  const results = await Promise.all([
    client.from('mood_entries').select('id,user_id,mood,note,recorded_at').eq('user_id', user.id).order('recorded_at', { ascending: false }),
    client.from('prayer_entries').select('id,user_id,date,prayer,completed').eq('user_id', user.id).order('date', { ascending: false }),
    client.from('worship_entries').select('id,user_id,date,name,category,amount,note').eq('user_id', user.id).order('date', { ascending: false }),
    client.from('wirds').select('id,user_id,name,target,start_date,end_date,description,frequency').eq('user_id', user.id).order('created_at', { ascending: false }),
    client.from('wird_logs').select('id,user_id,wird_id,date,amount').eq('user_id', user.id).order('date', { ascending: false }),
    client.from('dreams').select('id,user_id,title,narrative,date,waking_feeling,dream_feeling,personal_notes').eq('user_id', user.id).order('date', { ascending: false }),
    client.from('self_reflections').select('id,user_id,date,answers,note').eq('user_id', user.id).order('date', { ascending: false }),
    client.from('reflection_questions').select('id,user_id,question').eq('user_id', user.id).order('created_at', { ascending: true }),
    client.from('teachers').select('id,display_name,bio,approved').eq('approved', true).order('display_name', { ascending: true }),
    client.from('teacher_students').select('id,teacher_id,student_id,active').eq('student_id', user.id).eq('active', true).limit(1).maybeSingle(),
    client.from('privacy_permissions').select('id,owner_id,teacher_id,module,record_id').eq('owner_id', user.id).order('created_at', { ascending: false }),
    client.from('assignments').select('id,teacher_id,student_id,title,description,target,due_date').eq('student_id', user.id).order('created_at', { ascending: false }),
    client.from('assignment_logs').select('id,user_id,assignment_id,date,amount').eq('user_id', user.id).order('date', { ascending: false }),
  ]);
  if (results.some((result) => result.error)) return apiError('Kişisel veriler yüklenemedi. Veritabanı şemasını ve bağlantıyı kontrol edin.', 503);
  const [moods, prayers, worships, wirds, wirdLogs, dreams, reflections, questions, teachers, connection, permissions, assignments, assignmentLogs] = results;
  const workspace: WorkspaceData = {
    moods: moods.data ?? [], prayers: prayers.data ?? [], worships: worships.data ?? [], wirds: wirds.data ?? [],
    wirdLogs: wirdLogs.data ?? [], dreams: dreams.data ?? [], reflections: reflections.data ?? [], questions: questions.data ?? [],
    teachers: teachers.data ?? [], connection: connection.data ?? null, permissions: permissions.data ?? [],
    assignments: assignments.data ?? [], assignmentLogs: assignmentLogs.data ?? [],
  } as WorkspaceData;
  return json(workspace);
}
