import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { verifiedUser } from '@/lib/server/auth';
import { apiError, json, readJsonMutation } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rate-limit';

export const dynamic = 'force-dynamic';
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const category = z.enum(['health', 'family', 'joy', 'concern', 'follow_up', 'other']);
const noteFields = { student_id: z.string().uuid(), title: z.string().trim().min(1).max(200), body: z.string().trim().max(5000).default(''), category: category.default('follow_up'), reminder_date: dateKey.nullable().default(null), is_pinned: z.boolean().default(false) };
const createSchema = z.object({ action: z.literal('create_note'), ...noteFields }).strict();
const updateSchema = z.object({ action: z.literal('update_note'), id: z.string().uuid(), ...Object.fromEntries(Object.entries(noteFields).map(([key, value]) => [key, (value as z.ZodTypeAny).optional()])) }).strict();
const completeSchema = z.object({ action: z.literal('complete_note'), id: z.string().uuid(), completed: z.boolean() }).strict();
const deleteSchema = z.object({ action: z.literal('delete_note'), id: z.string().uuid() }).strict();
const applySchema = z.object({ action: z.literal('apply'), teacher_id: z.string().uuid(), message: z.string().trim().max(1000).default('') }).strict();
const applyAsTeacherSchema = z.object({ action: z.literal('apply_as_teacher'), bio: z.string().trim().min(1).max(2000) }).strict();
const assignmentFields = { student_id: z.string().uuid(), title: z.string().trim().min(1).max(200), description: z.string().trim().max(5000).default(''), target: z.number().int().min(1).max(1000000).default(1), due_date: dateKey.nullable().default(null) };
const createAssignmentSchema = z.object({ action: z.literal('create_assignment'), ...assignmentFields }).strict();
const updateAssignmentSchema = z.object({ action: z.literal('update_assignment'), id: z.string().uuid(), ...Object.fromEntries(Object.entries(assignmentFields).map(([key, value]) => [key, (value as z.ZodTypeAny).optional()])) }).strict();
const logAssignmentSchema = z.object({ action: z.literal('log_assignment'), assignment_id: z.string().uuid(), date: dateKey, amount: z.number().int().min(0).max(1000000) }).strict();
const checkinSchema = z.object({ action: z.literal('create_checkin'), student_id: z.string().uuid(), meeting_date: dateKey, summary: z.string().trim().max(5000).default(''), next_step: z.string().trim().max(2000).default('') }).strict();

export async function GET() {
  const client = await createSupabaseServerClient();
  if (!client) return apiError('Supabase bağlantısı yapılandırılmamış.', 503);
  const user = await verifiedUser(client);
  if (!user) return apiError('Oturum açmanız gerekiyor.', 401);
  const [teachers, applications, students, teacherProfile, teacherRequest] = await Promise.all([
    client.from('teachers').select('id,display_name,bio').eq('approved', true),
    client.from('teacher_applications').select('id,status,message,created_at').eq('student_id', user.id).order('created_at', { ascending: false }),
    client.from('teacher_students').select('student_id,active').eq('teacher_id', user.id).eq('active', true),
    client.from('teachers').select('id,approved').eq('id', user.id).maybeSingle(),
    client.from('teacher_requests').select('id,bio,status').eq('user_id', user.id).maybeSingle(),
  ]);
  if (teachers.error || applications.error || students.error || teacherProfile.error || teacherRequest.error) return apiError('Hoca verileri yüklenemedi.', 503);
  const studentIds = (students.data ?? []).map((student) => student.student_id);
  const profiles = studentIds.length ? await client.from('profiles').select('id,full_name,username,avatar_path').in('id', studentIds) : { data: [], error: null };
  const notes = teacherProfile.data?.approved ? await client.from('teacher_student_notes').select('id,teacher_id,student_id,title,body,category,reminder_date,is_completed,is_pinned,created_at,updated_at,completed_at').eq('teacher_id', user.id).order('is_completed', { ascending: true }).order('reminder_date', { ascending: true, nullsFirst: false }) : { data: [], error: null };
  const assignmentQuery = client.from('assignments').select('id,teacher_id,student_id,title,description,target,due_date,created_at,updated_at').or(`student_id.eq.${user.id},teacher_id.eq.${user.id}`).order('created_at', { ascending: false });
  const assignments = await assignmentQuery;
  const assignmentIds = (assignments.data ?? []).map((assignment) => assignment.id);
  const assignmentLogs = assignmentIds.length ? await client.from('assignment_logs').select('id,user_id,assignment_id,date,amount,created_at,updated_at').in('assignment_id', assignmentIds).order('date', { ascending: false }) : { data: [], error: null };
  const checkins = teacherProfile.data?.approved && studentIds.length ? await client.from('teacher_checkins').select('id,teacher_id,student_id,meeting_date,summary,next_step,created_at,updated_at').eq('teacher_id', user.id).order('meeting_date', { ascending: false }).limit(100) : { data: [], error: null };
  if (profiles.error || notes.error || assignments.error || assignmentLogs.error || checkins.error) return apiError(notes.error?.code === 'PGRST205' ? 'Talebe notları henüz kurulmamış. Supabase SQL Editor’da 20261125010000_teacher_student_notes.sql migration dosyasını çalıştırın.' : assignments.error?.code === 'PGRST205' || checkins.error?.code === 'PGRST205' ? 'Rehberlik modülü henüz kurulmamış. Supabase SQL Editor’da 20261126010000_guidance_core.sql migration dosyasını çalıştırın.' : 'Talebe verileri yüklenemedi.', 503);
  return json({ teacherRequest: teacherRequest.data ?? null, teachers: teachers.data ?? [], applications: applications.data ?? [], students: students.data ?? [], studentProfiles: profiles.data ?? [], notes: notes.data ?? [], assignments: assignments.data ?? [], assignmentLogs: assignmentLogs.data ?? [], checkins: checkins.data ?? [], isTeacher: Boolean(teacherProfile.data?.approved) });
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 'teacher', 30, 60_000);
  if (limited) return limited;
  const body = await readJsonMutation(request, 20_000);
  if (!body.ok) return body.response;
  const parsed = z.discriminatedUnion('action', [applySchema, applyAsTeacherSchema, createSchema, updateSchema, completeSchema, deleteSchema, createAssignmentSchema, updateAssignmentSchema, logAssignmentSchema, checkinSchema]).safeParse(body.body);
  if (!parsed.success) return apiError('Hoca işlemi veya alanları geçersiz.', 400);
  const client = await createSupabaseServerClient();
  if (!client) return apiError('Supabase bağlantısı yapılandırılmamış.', 503);
  const user = await verifiedUser(client);
  if (!user) return apiError('Oturum açmanız gerekiyor.', 401);
  if (parsed.data.action === 'apply_as_teacher') {
    const result = await client.rpc('apply_as_teacher', { _bio: parsed.data.bio });
    if (result.error) return apiError('Hoca başvurusu gönderilemedi.', 400);
    return json({ teacherRequest: result.data }, 201);
  }
  if (parsed.data.action === 'apply') {
    const result = await client.rpc('apply_teacher', { _teacher_id: parsed.data.teacher_id, _message: parsed.data.message });
    if (result.error) return apiError('Başvuru gönderilemedi.', 400);
    return json({ application: result.data }, 201);
  }
  if (parsed.data.action === 'create_note') {
    const { action: _action, ...data } = parsed.data;
    const result = await client.from('teacher_student_notes').insert({ ...data, teacher_id: user.id }).select().single();
    if (result.error) return apiError(result.error.code === 'PGRST205' ? 'Talebe notları henüz kurulmamış. Supabase SQL Editor’da 20261125010000_teacher_student_notes.sql migration dosyasını çalıştırın.' : 'Talebe notu kaydedilemedi.', 503);
    return json({ note: result.data }, 201);
  }
  if (parsed.data.action === 'create_assignment') {
    const { action: _action, ...data } = parsed.data;
    const teacher = await client.from('teachers').select('id').eq('id', user.id).eq('approved', true).maybeSingle();
    if (teacher.error || !teacher.data) return apiError('Onaylı hoca yetkisi gerekiyor.', 403);
    const result = await client.from('assignments').insert({ ...data, teacher_id: user.id }).select().single();
    if (result.error) return apiError(result.error.code === 'PGRST205' ? 'Rehberlik modülü henüz kurulmamış. Supabase SQL Editor’da 20261126010000_guidance_core.sql migration dosyasını çalıştırın.' : 'Vazife oluşturulamadı.', 400);
    await client.from('notifications').insert({ user_id: data.student_id, kind: 'assignment', title: 'Yeni vazife', body: 'Hocanız size yeni bir vazife bıraktı.' });
    return json({ assignment: result.data }, 201);
  }
  if (parsed.data.action === 'update_assignment') {
    const { action: _action, id, ...data } = parsed.data;
    const result = await client.from('assignments').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).eq('teacher_id', user.id).select().maybeSingle();
    if (result.error) return apiError('Vazife güncellenemedi.', 400);
    if (!result.data) return apiError('Vazife bulunamadı.', 404);
    return json({ assignment: result.data });
  }
  if (parsed.data.action === 'log_assignment') {
    const result = await client.from('assignment_logs').upsert({ user_id: user.id, assignment_id: parsed.data.assignment_id, date: parsed.data.date, amount: parsed.data.amount, updated_at: new Date().toISOString() }, { onConflict: 'user_id,assignment_id,date' }).select().single();
    if (result.error) return apiError('Vazife ilerlemesi saklanamadı.', 400);
    return json({ log: result.data });
  }
  if (parsed.data.action === 'create_checkin') {
    const { action: _action, ...data } = parsed.data;
    const result = await client.from('teacher_checkins').insert({ ...data, teacher_id: user.id }).select().single();
    if (result.error) return apiError(result.error.code === 'PGRST205' ? 'Rehberlik modülü henüz kurulmamış. Supabase SQL Editor’da 20261126010000_guidance_core.sql migration dosyasını çalıştırın.' : 'Görüşme notu kaydedilemedi.', 400);
    return json({ checkin: result.data }, 201);
  }
  if (parsed.data.action === 'update_note') {
    const { action: _action, id, ...data } = parsed.data;
    const result = await client.from('teacher_student_notes').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).eq('teacher_id', user.id).select().maybeSingle();
    if (result.error) return apiError('Talebe notu güncellenemedi.', 503);
    if (!result.data) return apiError('Not bulunamadı.', 404);
    return json({ note: result.data });
  }
  if (parsed.data.action === 'complete_note') {
    const result = await client.from('teacher_student_notes').update({ is_completed: parsed.data.completed, completed_at: parsed.data.completed ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq('id', parsed.data.id).eq('teacher_id', user.id).select().maybeSingle();
    if (result.error) return apiError('Not durumu güncellenemedi.', 503);
    if (!result.data) return apiError('Not bulunamadı.', 404);
    return json({ note: result.data });
  }
  const result = await client.from('teacher_student_notes').delete().eq('id', parsed.data.id).eq('teacher_id', user.id).select('id').maybeSingle();
  if (result.error) return apiError('Not silinemedi.', 503);
  if (!result.data) return apiError('Not bulunamadı.', 404);
  return json({ ok: true });
}
