import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseConfig, secureCookiesFromHeaders } from '@/lib/supabase/config';

export async function proxy(request: NextRequest) {
  const { config } = getSupabaseConfig();
  if (!config) return NextResponse.next();
  const secure = secureCookiesFromHeaders(request.headers);
  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.key, {
    cookieOptions: { httpOnly: true, secure, sameSite: secure ? 'none' : 'lax', path: '/' },
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet, cacheHeaders) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, { ...options, httpOnly: true, secure, sameSite: secure ? 'none' : 'lax', path: '/' });
        }
        for (const [name, value] of Object.entries(cacheHeaders ?? {})) response.headers.set(name, value);
      },
    },
  });
  // Validate/refresh only; never use getSession() as authorization evidence.
  // Public pages remain readable if the provider is down; APIs verify independently.
  await supabase.auth.getUser().catch(() => undefined);
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  response.headers.set('Vary', 'Cookie');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
