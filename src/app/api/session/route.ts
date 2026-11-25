import { NextRequest } from 'next/server';
import { getSupabaseConfig } from '@/lib/supabase/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { databaseRole, verifiedUser } from '@/lib/server/auth';
import { json } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rate-limit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function isCredentialError(error: { code?: string; message?: string } | null): boolean {
  const text = `${error?.code ?? ''} ${error?.message ?? ''}`.toLowerCase();
  return text.includes('invalid api key') || text.includes('invalid jwt') || text.includes('jwt') && text.includes('expired') || error?.code === 'PGRST301';
}

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, 'session', 120, 60_000);
  if (limited) return limited;
  const { config, reason } = getSupabaseConfig();
  if (!config) {
    const error = reason === 'missing'
      ? 'Supabase bağlantı ayarları eksik; oturum ve veritabanı özellikleri kullanılamıyor.'
      : reason === 'privileged_key'
        ? 'Güvenlik nedeniyle ayrıcalıklı Supabase anahtarı reddedildi. Yalnızca publishable/anon anahtarı kullanılmalıdır.'
        : 'Supabase bağlantı ayarlarının biçimi geçersiz. Proje adresi ve publishable/anon anahtarını kontrol edin.';
    return json({ configured: false, user: null, profile: null, role: 'member', schemaReady: false, error });
  }
  const client = await createSupabaseServerClient();
  if (!client) return json({ configured: false, user: null, profile: null, role: 'member', schemaReady: false, error: 'Supabase bağlantısı şu anda başlatılamıyor.' });
  let user = null;
  let schemaReady = false;
  let profile = null;
  let role: 'member' | 'dervish' | 'teacher' | 'admin' = 'member';
  let errorMessage: string | undefined;
  try {
    const verified = await verifiedUser(client);
    user = verified;
    const probe = await client.from('teachers').select('id').limit(1);
    if (isCredentialError(probe.error)) {
      return json({ configured: false, user: null, profile: null, role: 'member', schemaReady: false, error: 'Supabase anahtarı bu proje için kabul edilmedi. Dashboard > Project Settings > API bölümünden aynı projeye ait publishable/anon anahtarını kopyalayın.' });
    }
    schemaReady = !probe.error;
    if (verified && schemaReady) {
      const [profileResult, roleResult] = await Promise.all([
        client.from('profiles').select('id,full_name,username,bio,avatar_path,notification_preferences').eq('id', verified.id).maybeSingle(),
        client.from('roles').select('role').eq('user_id', verified.id).maybeSingle(),
      ]);
      if (profileResult.error || roleResult.error) {
        schemaReady = false;
        errorMessage = 'Supabase bağlantısı var ancak gerekli veritabanı şeması hazır değil. Migration durumunu kontrol edin.';
      } else {
        profile = profileResult.data;
        const value = roleResult.data?.role;
        if (value === 'member' || value === 'dervish' || value === 'teacher' || value === 'admin') role = value;
      }
    }
    if (!schemaReady) errorMessage = 'Supabase bağlantısı var ancak gerekli veritabanı şeması hazır değil. Migration durumunu kontrol edin.';
  } catch {
    errorMessage = 'Supabase oturumu şu anda doğrulanamadı. Lütfen daha sonra yeniden deneyin.';
  }
  return json({ configured: true, user, profile, role, schemaReady, ...(errorMessage ? { error: errorMessage } : {}) });
}
