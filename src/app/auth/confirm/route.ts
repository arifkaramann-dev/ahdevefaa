import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { noStoreRedirect } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rate-limit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
const allowedTypes = new Set(['email', 'signup', 'recovery']);

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, 'auth-confirm', 12, 10 * 60_000);
  if (limited) return noStoreRedirect('/login?error=confirmation_failed', 303);
  const tokenHash = request.nextUrl.searchParams.get('token_hash') ?? '';
  const type = request.nextUrl.searchParams.get('type') ?? '';
  if (tokenHash.length < 10 || tokenHash.length > 512 || !allowedTypes.has(type)) {
    return noStoreRedirect('/login?error=confirmation_failed', 303);
  }
  const client = await createSupabaseServerClient();
  if (!client) return noStoreRedirect('/login?error=confirmation_unavailable', 303);
  const { error } = await client.auth.verifyOtp({ token_hash: tokenHash, type: type as 'email' | 'signup' | 'recovery' });
  if (error) return noStoreRedirect('/login?error=confirmation_failed', 303);
  return noStoreRedirect('/profile', 303);
}
