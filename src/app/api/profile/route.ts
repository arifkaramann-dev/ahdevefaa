import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { verifiedUser } from '@/lib/server/auth';
import { apiError, json, readJsonMutation } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rate-limit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const preferences = z.record(z.string().trim().min(1).max(60), z.boolean()).refine((value) => Object.keys(value).length <= 30);
const schema = z.object({
  full_name: z.string().trim().min(1).max(100).optional(),
  username: z.string().trim().regex(/^[a-zA-Z0-9_]{3,24}$/).transform((value) => value.toLowerCase()).optional(),
  bio: z.string().trim().max(400).nullable().optional(),
  notification_preferences: preferences.optional(),
}).strict().refine((value) => Object.keys(value).length > 0);

export async function PATCH(request: NextRequest) {
  const limited = rateLimit(request, 'profile', 20, 60_000);
  if (limited) return limited;
  const body = await readJsonMutation(request, 8_192);
  if (!body.ok) return body.response;
  const parsed = schema.safeParse(body.body);
  if (!parsed.success) return apiError('Profil alanları geçersiz.', 400);
  const client = await createSupabaseServerClient();
  if (!client) return apiError('Supabase bağlantısı yapılandırılmamış.', 503);
  const user = await verifiedUser(client);
  if (!user) return apiError('Oturum açmanız gerekiyor.', 401);
  const result = await client.from('profiles').update({ ...parsed.data, updated_at: new Date().toISOString() }).eq('id', user.id)
    .select('id,full_name,username,bio,avatar_path,notification_preferences').single();
  if (result.error) {
    if (result.error.code === '23505') return apiError('Bu kullanıcı adı kullanımda.', 409);
    return apiError('Profil güncellenemedi.', 503);
  }
  return json({ profile: result.data });
}
