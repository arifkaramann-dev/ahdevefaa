import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { verifiedUser, databaseRole } from '@/lib/server/auth';
import { apiError } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rate-limit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, 'export', 3, 60 * 60_000);
  if (limited) return limited;
  const client = await createSupabaseServerClient();
  if (!client) return apiError('Supabase bağlantısı yapılandırılmamış.', 503);
  const user = await verifiedUser(client);
  if (!user) return apiError('Oturum açmanız gerekiyor.', 401);
  const owned = (table: string, column = 'user_id') => client.from(table).select('*').eq(column, user.id);
  const results = await Promise.all([
    client.from('profiles').select('id,full_name,username,bio,avatar_path,notification_preferences,created_at,updated_at').eq('id', user.id).maybeSingle(),
    client.from('roles').select('role').eq('user_id', user.id).maybeSingle(),
    owned('mood_entries'), owned('prayer_entries'), owned('worship_entries'), owned('wirds'), owned('wird_logs'),
    owned('dreams'), owned('self_reflections'), owned('reflection_questions'), owned('privacy_permissions', 'owner_id'),
    owned('assignment_logs'),
    client.from('teacher_students').select('id,teacher_id,student_id,active,created_at').eq('student_id', user.id),
    client.from('teacher_applications').select('id,student_id,teacher_id,status,message,created_at').eq('student_id', user.id),
  ]);
  if (results.some((result) => result.error)) return apiError('Veri dışa aktarılamadı; veritabanı şemasını ve bağlantıyı kontrol edin.', 503);
  const [profile, role, moods, prayers, worships, wirds, wirdLogs, dreams, reflections, questions, permissions, assignmentLogs, connections, applications] = results;
  const data = {
    exported_at: new Date().toISOString(),
    user: { id: user.id, ...(user.email ? { email: user.email } : {}), role: role.data?.role ?? await databaseRole(client, user.id) },
    profile: profile.data,
    records: {
      moods: moods.data, prayers: prayers.data, worships: worships.data, wirds: wirds.data, wird_logs: wirdLogs.data,
      dreams: dreams.data, self_reflections: reflections.data, reflection_questions: questions.data,
      privacy_permissions: permissions.data, assignment_logs: assignmentLogs.data,
    },
    teacher_connections: connections.data,
    teacher_applications: applications.data,
  };
  return new Response(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="ahde-vefa-export-${user.id}.json"`,
      'Cache-Control': 'private, no-store, max-age=0',
      Pragma: 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
