import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { verifiedUser } from '@/lib/server/auth';
import { apiError, json, readJsonMutation } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rate-limit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tarih geçersiz.');
const frequency = z.enum(['once', 'daily', 'weekdays', 'weekly', 'monthly']);
const color = z.enum(['forest', 'gold', 'stone', 'plum', 'blue']);
const anchorPrayer = z.enum(['none', 'Sabah', 'Öğle', 'İkindi', 'Akşam', 'Yatsı']);
const energy = z.enum(['low', 'gentle', 'steady', 'good']);
const routineFields = {
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).default(''),
  kind: z.enum(['task', 'habit']).default('task'),
  frequency: frequency.default('once'),
  days_of_week: z.array(z.number().int().min(0).max(6)).max(7).default([]),
  start_date: dateKey,
  due_date: dateKey.nullable().default(null),
  target_count: z.number().int().min(1).max(100).default(1),
  color: color.default('forest'),
  next_action: z.string().trim().max(500).default(''),
  minimum_step: z.string().trim().max(500).default(''),
  ideal_step: z.string().trim().max(500).default(''),
  anchor_prayer: anchorPrayer.default('none'),
  priority: z.number().int().min(1).max(3).default(2),
};
const createSchema = z.object({ action: z.literal('create'), ...routineFields }).strict();
const updateSchema = z.object({ action: z.literal('update'), id: z.string().uuid(), ...Object.fromEntries(Object.entries(routineFields).map(([key, schema]) => [key, (schema as z.ZodTypeAny).optional()])) }).strict();
const deleteSchema = z.object({ action: z.literal('delete'), id: z.string().uuid() }).strict();
const toggleSchema = z.object({ action: z.literal('toggle'), routine_id: z.string().uuid(), date: dateKey, completed: z.boolean(), note: z.string().trim().max(500).default('') }).strict();
const startDaySchema = z.object({ action: z.literal('start_day'), date: dateKey, energy, capacity: z.number().int().min(1).max(3), note: z.string().trim().max(500).default('') }).strict();
const prayerSchema = z.object({ action: z.literal('prayer'), date: dateKey, prayer: z.enum(['Sabah', 'Öğle', 'İkindi', 'Akşam', 'Yatsı']), completed: z.boolean() }).strict();
const startSchema = z.object({ action: z.literal('start'), routine_id: z.string().uuid(), date: dateKey, step: z.string().trim().max(500).default('') }).strict();
const reviewSchema = z.object({ action: z.literal('review'), date: dateKey, worked: z.string().trim().max(2000).default(''), friction: z.string().trim().max(2000).default(''), next_adjustment: z.string().trim().max(2000).default('') }).strict();

async function auth() {
  const client = await createSupabaseServerClient();
  if (!client) return { client: null, user: null };
  return { client, user: await verifiedUser(client) };
}

function routinesSchemaError(error: { code?: string; message?: string } | null | undefined) {
  const message = error?.message?.toLowerCase() ?? '';
  return error?.code === 'PGRST205' || error?.code === '42P01' || message.includes('relation') && message.includes('routines');
}

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, 'routines-read', 60, 60_000);
  if (limited) return limited;
  const { client, user } = await auth();
  if (!client) return apiError('Supabase bağlantısı yapılandırılmamış.', 503);
  if (!user) return apiError('Oturum açmanız gerekiyor.', 401);
  const start = request.nextUrl.searchParams.get('start');
  const end = request.nextUrl.searchParams.get('end');
  let logs = client.from('routine_logs').select('id,user_id,routine_id,date,completed,note').eq('user_id', user.id).order('date', { ascending: false }).limit(1200);
  if (start && dateKey.safeParse(start).success) logs = logs.gte('date', start);
  if (end && dateKey.safeParse(end).success) logs = logs.lte('date', end);
  const [routines, routineLogs, dailyPlans, prayers, starts, reviews] = await Promise.all([
    client.from('routines').select('id,user_id,title,description,kind,frequency,days_of_week,start_date,due_date,target_count,color,is_archived,next_action,minimum_step,ideal_step,anchor_prayer,priority,created_at,updated_at').eq('user_id', user.id).eq('is_archived', false).order('priority', { ascending: true }).order('created_at', { ascending: false }),
    logs,
    client.from('daily_plans').select('id,user_id,date,energy,capacity,note,started_at,updated_at').eq('user_id', user.id).order('date', { ascending: false }).limit(60),
    (() => { let query = client.from('prayer_entries').select('id,user_id,date,prayer,completed').eq('user_id', user.id); if (start && dateKey.safeParse(start).success) query = query.gte('date', start); if (end && dateKey.safeParse(end).success) query = query.lte('date', end); return query; })(),
    client.from('routine_starts').select('id,user_id,routine_id,date,started_at,step').eq('user_id', user.id).order('started_at', { ascending: false }).limit(300),
    client.from('daily_plan_reviews').select('id,user_id,date,worked,friction,next_adjustment,created_at,updated_at').eq('user_id', user.id).order('date', { ascending: false }).limit(60),
  ]);
  if (routines.error || routineLogs.error || dailyPlans.error || prayers.error || starts.error || reviews.error) {
    if (routinesSchemaError(routines.error) || routinesSchemaError(routineLogs.error)) return apiError('Rutin modülü henüz kurulmamış. Supabase SQL Editor’da 20261123010000_routines.sql migration dosyasını çalıştırın.', 503);
    if (dailyPlans.error && (dailyPlans.error.code === 'PGRST205' || dailyPlans.error.code === '42P01')) return apiError('Destek programı henüz kurulmamış. Supabase SQL Editor’da 20261124010000_routine_support_program.sql migration dosyasını çalıştırın.', 503);
    if (starts.error?.code === 'PGRST205' || reviews.error?.code === 'PGRST205') return apiError('Uyarlanabilir destek bölümü henüz kurulmamış. Supabase SQL Editor’da 20261126010000_guidance_core.sql migration dosyasını çalıştırın.', 503);
    return apiError('Rutinler yüklenemedi.', 503);
  }
  return json({ routines: routines.data ?? [], logs: routineLogs.data ?? [], dailyPlans: dailyPlans.data ?? [], prayers: prayers.data ?? [], starts: starts.data ?? [], reviews: reviews.data ?? [] });
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 'routines-write', 60, 60_000);
  if (limited) return limited;
  const body = await readJsonMutation(request, 20_000);
  if (!body.ok) return body.response;
  const parsed = z.discriminatedUnion('action', [createSchema, deleteSchema, toggleSchema, startDaySchema, prayerSchema, startSchema, reviewSchema]).safeParse(body.body);
  if (!parsed.success) return apiError('Rutin işlemi veya alanları geçersiz.', 400);
  const { client, user } = await auth();
  if (!client) return apiError('Supabase bağlantısı yapılandırılmamış.', 503);
  if (!user) return apiError('Oturum açmanız gerekiyor.', 401);

  if (parsed.data.action === 'start_day') {
    const { action: _action, ...data } = parsed.data;
    const result = await client.from('daily_plans').upsert({ ...data, user_id: user.id, updated_at: new Date().toISOString() }, { onConflict: 'user_id,date' }).select().single();
    if (result.error) return apiError(result.error.code === 'PGRST205' || result.error.code === '42P01' ? 'Destek programı henüz kurulmamış. Supabase SQL Editor’da 20261124010000_routine_support_program.sql migration dosyasını çalıştırın.' : 'Günün planı başlatılamadı.', 503);
    return json({ dailyPlan: result.data });
  }
  if (parsed.data.action === 'prayer') {
    const { action: _action, ...data } = parsed.data;
    const result = data.completed
      ? await client.from('prayer_entries').upsert({ ...data, user_id: user.id }, { onConflict: 'user_id,date,prayer' }).select().single()
      : await client.from('prayer_entries').delete().eq('user_id', user.id).eq('date', data.date).eq('prayer', data.prayer).select('id').maybeSingle();
    if (result.error) return apiError('Namaz durumu saklanamadı.', 503);
    return json({ ok: true, prayer: data.completed ? result.data : null });
  }
  if (parsed.data.action === 'start') {
    const { action: _action, ...data } = parsed.data;
    const result = await client.from('routine_starts').insert({ ...data, user_id: user.id }).select().single();
    if (result.error) return apiError(result.error.code === 'PGRST205' ? 'Uyarlanabilir destek bölümü henüz kurulmamış. Supabase SQL Editor’da 20261126010000_guidance_core.sql migration dosyasını çalıştırın.' : 'Başlama kaydı saklanamadı.', 503);
    return json({ start: result.data }, 201);
  }
  if (parsed.data.action === 'review') {
    const { action: _action, ...data } = parsed.data;
    const result = await client.from('daily_plan_reviews').upsert({ ...data, user_id: user.id, updated_at: new Date().toISOString() }, { onConflict: 'user_id,date' }).select().single();
    if (result.error) return apiError(result.error.code === 'PGRST205' ? 'Uyarlanabilir destek bölümü henüz kurulmamış. Supabase SQL Editor’da 20261126010000_guidance_core.sql migration dosyasını çalıştırın.' : 'Değerlendirme saklanamadı.', 503);
    return json({ review: result.data });
  }
  if (parsed.data.action === 'create') {
    const { action: _action, ...data } = parsed.data;
    const result = await client.from('routines').insert({ ...data, user_id: user.id }).select().single();
    if (result.error) return apiError(routinesSchemaError(result.error) ? 'Rutin modülü henüz kurulmamış. Supabase SQL Editor’da 20261123010000_routines.sql migration dosyasını çalıştırın.' : 'Rutin oluşturulamadı.', 503);
    return json({ routine: result.data }, 201);
  }
  if (parsed.data.action === 'delete') {
    const result = await client.from('routines').update({ is_archived: true, updated_at: new Date().toISOString() }).eq('id', parsed.data.id).eq('user_id', user.id).select('id').maybeSingle();
    if (result.error) return apiError(routinesSchemaError(result.error) ? 'Rutin modülü henüz kurulmamış. Supabase SQL Editor’da 20261123010000_routines.sql migration dosyasını çalıştırın.' : 'Rutin arşivlenemedi.', 503);
    if (!result.data) return apiError('Rutin bulunamadı.', 404);
    return json({ ok: true });
  }
  const { action: _action, ...data } = parsed.data;
  const result = data.completed
    ? await client.from('routine_logs').upsert({ user_id: user.id, routine_id: data.routine_id, date: data.date, completed: true, note: data.note, updated_at: new Date().toISOString() }, { onConflict: 'user_id,routine_id,date' }).select().single()
    : await client.from('routine_logs').delete().eq('user_id', user.id).eq('routine_id', data.routine_id).eq('date', data.date).select('id').maybeSingle();
  if (result.error) return apiError(routinesSchemaError(result.error) ? 'Rutin modülü henüz kurulmamış. Supabase SQL Editor’da 20261123010000_routines.sql migration dosyasını çalıştırın.' : 'Tamamlanma kaydı saklanamadı.', 503);
  return json({ ok: true, log: data.completed ? result.data : null });
}

export async function PATCH(request: NextRequest) {
  const limited = rateLimit(request, 'routines-write', 60, 60_000);
  if (limited) return limited;
  const body = await readJsonMutation(request, 20_000);
  if (!body.ok) return body.response;
  const parsed = updateSchema.safeParse(body.body);
  if (!parsed.success) return apiError('Rutin güncelleme alanları geçersiz.', 400);
  const { client, user } = await auth();
  if (!client) return apiError('Supabase bağlantısı yapılandırılmamış.', 503);
  if (!user) return apiError('Oturum açmanız gerekiyor.', 401);
  const { action: _action, id, ...data } = parsed.data;
  const result = await client.from('routines').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id).select().maybeSingle();
  if (result.error) return apiError(routinesSchemaError(result.error) ? 'Rutin modülü henüz kurulmamış. Supabase SQL Editor’da 20261123010000_routines.sql migration dosyasını çalıştırın.' : 'Rutin güncellenemedi.', 503);
  if (!result.data) return apiError('Rutin bulunamadı.', 404);
  return json({ routine: result.data });
}
