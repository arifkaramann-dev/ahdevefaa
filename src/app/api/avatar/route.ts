import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { getSupabaseConfig } from '@/lib/supabase/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { verifiedUser } from '@/lib/server/auth';
import { apiError, json, requireMutationHeader } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rate-limit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
const BUCKET = 'avatars-private';
const MAX_SIZE = 2 * 1024 * 1024;

function detectImage(bytes: Uint8Array): { mime: string; ext: string } | null {
  if (bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, i) => bytes[i] === value)) return { mime: 'image/png', ext: 'png' };
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return { mime: 'image/jpeg', ext: 'jpg' };
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return { mime: 'image/webp', ext: 'webp' };
  if (bytes.length >= 6 && ['GIF87a', 'GIF89a'].includes(String.fromCharCode(...bytes.slice(0, 6)))) return { mime: 'image/gif', ext: 'gif' };
  return null;
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 'avatar-upload', 5, 10 * 60_000);
  if (limited) return limited;
  const csrf = requireMutationHeader(request);
  if (csrf) return csrf;
  const type = request.headers.get('content-type')?.toLowerCase() ?? '';
  if (!type.startsWith('multipart/form-data;')) return apiError('multipart/form-data gereklidir.', 415);
  const length = Number(request.headers.get('content-length'));
  if (!Number.isFinite(length)) return apiError('İstek boyutu doğrulanamadı.', 411);
  if (length > MAX_SIZE + 65_536) return apiError('Dosya boyutu 2 MB sınırını aşıyor.', 413);
  const client = await createSupabaseServerClient();
  if (!client) return apiError('Supabase bağlantısı yapılandırılmamış.', 503);
  const user = await verifiedUser(client);
  if (!user) return apiError('Oturum açmanız gerekiyor.', 401);
  let form: FormData;
  try { form = await request.formData(); } catch { return apiError('Dosya formu okunamadı.', 400); }
  const file = form.get('file');
  if (!file || typeof file === 'string' || !('arrayBuffer' in file)) return apiError('Bir görsel dosyası gerekli.', 400);
  if (file.size < 1 || file.size > MAX_SIZE) return apiError('Dosya boyutu 2 MB sınırını aşmamalıdır.', 413);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const image = detectImage(bytes);
  if (!image || file.type !== image.mime) return apiError('Yalnızca doğrulanmış PNG, JPEG, WebP veya GIF görselleri kabul edilir.', 415);
  const path = `${user.id}/${randomUUID()}.${image.ext}`;
  const upload = await client.storage.from(BUCKET).upload(path, bytes, { contentType: image.mime, upsert: false, cacheControl: '60' });
  if (upload.error) return apiError('Görsel güvenli depolamaya yüklenemedi.', 503);
  const updated = await client.from('profiles').update({ avatar_path: path, updated_at: new Date().toISOString() }).eq('id', user.id).select('avatar_path').single();
  if (updated.error) {
    await client.storage.from(BUCKET).remove([path]);
    return apiError('Profil görseli kaydedilemedi.', 503);
  }
  return json({ path: updated.data.avatar_path }, 201);
}

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, 'avatar-read', 60, 60_000);
  if (limited) return limited;
  const client = await createSupabaseServerClient();
  if (!client) return apiError('Supabase bağlantısı yapılandırılmamış.', 503);
  const user = await verifiedUser(client);
  if (!user) return apiError('Oturum açmanız gerekiyor.', 401);
  const profile = await client.from('profiles').select('avatar_path').eq('id', user.id).maybeSingle();
  if (profile.error) return apiError('Profil görseli alınamadı.', 503);
  const path = profile.data?.avatar_path;
  if (!path) return apiError('Profil görseli bulunamadı.', 404);
  if (!path.startsWith(`${user.id}/`) || path.includes('..') || path.startsWith('/')) return apiError('Profil görseli yolu geçersiz.', 403);
  const signed = await client.storage.from(BUCKET).createSignedUrl(path, 60);
  if (signed.error || !signed.data?.signedUrl) return apiError('Profil görseli bağlantısı üretilemedi.', 503);
  const { config } = getSupabaseConfig();
  if (!config || new URL(signed.data.signedUrl).origin !== new URL(config.url).origin) return apiError('Profil görseli bağlantısı doğrulanamadı.', 503);
  return new Response(null, {
    status: 302,
    headers: {
      Location: signed.data.signedUrl,
      'Cache-Control': 'private, no-store, max-age=0',
      Pragma: 'no-cache',
      Vary: 'Cookie',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
