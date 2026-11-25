import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { verifiedUser } from '@/lib/server/auth';
import { apiError, json, readJsonMutation } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rate-limit';
import { isWritableCollection, recordIdSchema, validateRecord } from '@/lib/server/record-validation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const requestSchema = z.object({ collection: z.string().max(40), data: z.unknown() }).strict();
const patchSchema = z.object({ collection: z.string().max(40), id: recordIdSchema, data: z.unknown() }).strict();
const deleteSchema = z.object({ collection: z.string().max(40), id: recordIdSchema }).strict();
const ownerColumn = (collection: string) => collection === 'privacy_permissions' ? 'owner_id' : 'user_id';

async function checkPermissionTarget(client: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>, ownerId: string, value: { teacher_id: string; module: 'dreams' | 'mood_entries' | 'self_reflections'; record_id: string | null }) {
  const connection = await client.from('teacher_students').select('id').eq('student_id', ownerId).eq('teacher_id', value.teacher_id).eq('active', true).maybeSingle();
  if (connection.error) return { ok: false as const, status: 503, message: 'Paylaşım izni doğrulanamadı.' };
  if (!connection.data) return { ok: false as const, status: 403, message: 'Yalnızca aktif hocanızla paylaşım yapabilirsiniz.' };
  if (value.record_id) {
    const table = value.module === 'dreams' ? 'dreams' : value.module === 'mood_entries' ? 'mood_entries' : 'self_reflections';
    const row = await client.from(table).select('id').eq('id', value.record_id).eq('user_id', ownerId).maybeSingle();
    if (row.error) return { ok: false as const, status: 503, message: 'Paylaşılacak kayıt doğrulanamadı.' };
    if (!row.data) return { ok: false as const, status: 404, message: 'Paylaşılacak kayıt bulunamadı.' };
  }
  return { ok: true as const };
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 'records', 60, 60_000);
  if (limited) return limited;
  const body = await readJsonMutation(request);
  if (!body.ok) return body.response;
  const shape = requestSchema.safeParse(body.body);
  if (!shape.success || !isWritableCollection(shape.data.collection)) return apiError('Kayıt türü veya girdi geçersiz.', 400);
  const data = validateRecord(shape.data.collection, shape.data.data);
  if (!data.success) return apiError('Kayıt alanları geçersiz.', 400);
  const client = await createSupabaseServerClient();
  if (!client) return apiError('Supabase bağlantısı yapılandırılmamış.', 503);
  const user = await verifiedUser(client);
  if (!user) return apiError('Oturum açmanız gerekiyor.', 401);
  if (shape.data.collection === 'privacy_permissions') {
    const check = await checkPermissionTarget(client, user.id, data.data as { teacher_id: string; module: 'dreams' | 'mood_entries' | 'self_reflections'; record_id: string | null });
    if (!check.ok) return apiError(check.message, check.status);
  }

  const record = { ...data.data, [ownerColumn(shape.data.collection)]: user.id };
  const conflict = shape.data.collection === 'prayer_entries' ? 'user_id,date,prayer'
    : shape.data.collection === 'wird_logs' ? 'user_id,wird_id,date'
      : shape.data.collection === 'self_reflections' ? 'user_id,date' : null;
  const result = conflict
    ? await client.from(shape.data.collection).upsert(record, { onConflict: conflict }).select().single()
    : await client.from(shape.data.collection).insert(record).select().single();
  if (result.error) {
    if (result.error.code === '23505') return apiError('Bu kayıt zaten mevcut.', 409);
    if (result.error.code === '23503' || result.error.code === '42501') return apiError('Kayıt veya ilişki için yetkiniz doğrulanamadı.', 403);
    return apiError('Kayıt kaydedilemedi.', 503);
  }
  return json({ record: result.data }, conflict ? 200 : 201);
}

export async function PATCH(request: NextRequest) {
  const limited = rateLimit(request, 'records', 60, 60_000);
  if (limited) return limited;
  const body = await readJsonMutation(request);
  if (!body.ok) return body.response;
  const shape = patchSchema.safeParse(body.body);
  if (!shape.success || !isWritableCollection(shape.data.collection) || !shape.data.data || typeof shape.data.data !== 'object' || Array.isArray(shape.data.data) || Object.keys(shape.data.data).length === 0) {
    return apiError('Kayıt türü veya girdi geçersiz.', 400);
  }
  const data = validateRecord(shape.data.collection, shape.data.data, true);
  if (!data.success) return apiError('Güncellenecek alanlar geçersiz.', 400);
  const client = await createSupabaseServerClient();
  if (!client) return apiError('Supabase bağlantısı yapılandırılmamış.', 503);
  const user = await verifiedUser(client);
  if (!user) return apiError('Oturum açmanız gerekiyor.', 401);

  if (shape.data.collection === 'privacy_permissions') {
    const existing = await client.from('privacy_permissions').select('teacher_id,module,record_id').eq('id', shape.data.id).eq('owner_id', user.id).maybeSingle();
    if (existing.error) return apiError('Paylaşım izni yüklenemedi.', 503);
    if (!existing.data) return apiError('Kayıt bulunamadı.', 404);
    const permission = { ...existing.data, ...data.data } as { teacher_id: string; module: 'dreams' | 'mood_entries' | 'self_reflections'; record_id: string | null };
    const check = await checkPermissionTarget(client, user.id, permission);
    if (!check.ok) return apiError(check.message, check.status);
  }
  const result = await client.from(shape.data.collection).update(data.data).eq('id', shape.data.id).eq(ownerColumn(shape.data.collection), user.id).select().maybeSingle();
  if (result.error) return apiError(result.error.code === '42501' ? 'Bu kayıt için yetkiniz yok.' : 'Kayıt güncellenemedi.', result.error.code === '42501' ? 403 : 503);
  if (!result.data) return apiError('Kayıt bulunamadı.', 404);
  return json({ record: result.data });
}

export async function DELETE(request: NextRequest) {
  const limited = rateLimit(request, 'records', 60, 60_000);
  if (limited) return limited;
  const body = await readJsonMutation(request, 4_096);
  if (!body.ok) return body.response;
  const shape = deleteSchema.safeParse(body.body);
  if (!shape.success || !isWritableCollection(shape.data.collection)) return apiError('Kayıt türü veya girdi geçersiz.', 400);
  const client = await createSupabaseServerClient();
  if (!client) return apiError('Supabase bağlantısı yapılandırılmamış.', 503);
  const user = await verifiedUser(client);
  if (!user) return apiError('Oturum açmanız gerekiyor.', 401);
  const result = await client.from(shape.data.collection).delete().eq('id', shape.data.id).eq(ownerColumn(shape.data.collection), user.id).select('id').maybeSingle();
  if (result.error) return apiError('Kayıt silinemedi.', 503);
  if (!result.data) return apiError('Kayıt bulunamadı.', 404);
  return json({ ok: true });
}
