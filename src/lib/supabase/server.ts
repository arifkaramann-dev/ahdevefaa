import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { getSupabaseConfig, secureCookiesFromHeaders } from './config';

export async function createSupabaseServerClient() {
  const { config } = getSupabaseConfig();
  if (!config) return null;
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const secure = secureCookiesFromHeaders(requestHeaders);
  return createServerClient(config.url, config.key, {
    cookieOptions: {
      httpOnly: true,
      secure,
      sameSite: secure ? 'none' : 'lax',
      path: '/',
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, {
              ...options,
              httpOnly: true,
              secure,
              sameSite: secure ? 'none' : 'lax',
              path: '/',
            });
          }
        } catch {
          // Server components cannot write cookies. src/proxy.ts performs refresh propagation.
        }
      },
    },
  });
}
