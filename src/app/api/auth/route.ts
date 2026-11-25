import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { verifiedUser } from '@/lib/server/auth';
import { apiError, json, readJsonMutation } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rate-limit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const email = z.string().trim().email().max(254);
const password = z.string().min(8).max(72);
const schemas = z.discriminatedUnion('action', [
  z.object({ action: z.literal('signIn'), email, password: z.string().min(1).max(72) }).strict(),
  z.object({ action: z.literal('signUp'), email, password, full_name: z.string().trim().min(1).max(100), username: z.string().trim().regex(/^[a-zA-Z0-9_]{3,24}$/), bio: z.string().trim().max(400).optional() }).strict(),
  z.object({ action: z.literal('signOut') }).strict(),
  z.object({ action: z.literal('resetPassword'), email }).strict(),
  z.object({ action: z.literal('updatePassword'), password }).strict(),
]);

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 'auth-mutation', 12, 10 * 60_000);
  if (limited) return limited;
  const parsedBody = await readJsonMutation(request, 8_192);
  if (!parsedBody.ok) return parsedBody.response;
  const parsed = schemas.safeParse(parsedBody.body);
  if (!parsed.success) return apiError('Girdi geçersiz veya eksik.', 400);
  const input = parsed.data;
  const client = await createSupabaseServerClient();
  if (!client) return apiError('Kimlik doğrulama servisi yapılandırılmamış.', 503);

  if (input.action === 'signIn') {
    const { error } = await client.auth.signInWithPassword({ email: input.email, password: input.password });
    if (error) return apiError('E-posta veya şifre doğrulanamadı.', 401);
    return json({ message: 'Giriş başarılı.' });
  }
  if (input.action === 'signUp') {
    const { error } = await client.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { full_name: input.full_name, username: input.username.toLowerCase(), bio: input.bio ?? '' } },
    });
    if (error) {
      if (error.message.toLowerCase().includes('email rate limit') || error.message.toLowerCase().includes('over_email_send_rate_limit')) {
        return apiError('Supabase e-posta gönderim limiti doldu. Auth > Email ayarlarında SMTP kullanın veya limit yenilendikten sonra tekrar deneyin.', 429);
      }
      if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('user already registered')) {
        return apiError('Bu e-posta adresiyle zaten bir hesap var. Giriş yapmayı deneyin.', 409);
      }
      return apiError('Kayıt tamamlanamadı. E-posta adresini, kullanıcı adını ve şifreyi kontrol edip yeniden deneyin.', 400);
    }
    return json({ message: 'Kayıt isteğiniz alındı. E-posta doğrulaması gerekiyorsa gelen kutunuzu kontrol edin.' }, 201);
  }
  if (input.action === 'resetPassword') {
    // Omitting redirectTo deliberately delegates to the configured Supabase Auth Site URL.
    const { error } = await client.auth.resetPasswordForEmail(input.email);
    if (error) return apiError('Şifre yenileme isteği şu anda işlenemiyor.', 503);
    return json({ message: 'Adres kayıtlıysa şifre yenileme bağlantısı gönderildi.' });
  }

  const user = await verifiedUser(client);
  if (!user) return apiError('Oturum açmanız gerekiyor.', 401);
  if (input.action === 'signOut') {
    const { error } = await client.auth.signOut();
    if (error) return apiError('Oturum güvenli biçimde kapatılamadı.', 503);
    return json({ message: 'Oturum kapatıldı.' });
  }
  const { error } = await client.auth.updateUser({ password: input.password });
  if (error) return apiError('Şifre güncellenemedi.', 400);
  return json({ message: 'Şifreniz güncellendi.' });
}
