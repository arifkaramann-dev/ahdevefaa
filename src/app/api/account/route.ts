import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { verifiedUser } from '@/lib/server/auth';
import { apiError, json, readJsonMutation } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rate-limit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
const schema = z.object({ password: z.string().min(1).max(72), confirmation: z.literal('HESABIMI SİL') }).strict();

export async function DELETE(request: NextRequest) {
  const limited = rateLimit(request, 'account-delete', 2, 60 * 60_000);
  if (limited) return limited;
  const body = await readJsonMutation(request, 4_096);
  if (!body.ok) return body.response;
  const parsed = schema.safeParse(body.body);
  if (!parsed.success) return apiError('Şifre ve “HESABIMI SİL” onayı gereklidir.', 400);
  const client = await createSupabaseServerClient();
  if (!client) return apiError('Supabase bağlantısı yapılandırılmamış.', 503);
  const user = await verifiedUser(client);
  if (!user?.email) return apiError('Oturum açmanız gerekiyor.', 401);
  const reauth = await client.auth.signInWithPassword({ email: user.email, password: parsed.data.password });
  if (reauth.error || reauth.data.user?.id !== user.id) return apiError('Şifre doğrulanamadı.', 401);
  const deletion = await client.rpc('delete_own_account', { _password: parsed.data.password });
  if (deletion.error || deletion.data !== true) {
    return apiError('Güvenli hesap silme işlemi veritabanında yapılandırılmamış veya tamamlanamadı. Hesap silinmedi.', 503);
  }
  await client.auth.signOut().catch(() => undefined);
  return json({ message: 'Hesabınız ve ilişkili verileriniz silindi.' });
}
