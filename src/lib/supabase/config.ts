import 'server-only';

export type SupabaseConfig = { url: string; key: string };

function firstEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

function isPrivilegedKey(key: string): boolean {
  if (/^sb_secret_/i.test(key) || /service[_-]?role/i.test(key)) return true;
  const parts = key.split('.');
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as { role?: unknown };
    return payload.role === 'service_role';
  } catch {
    return false;
  }
}

function isPublishableKey(key: string): boolean {
  if (/^sb_publishable_[A-Za-z0-9_-]+$/i.test(key)) return true;
  const parts = key.split('.');
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as { role?: unknown };
    return payload.role === 'anon';
  } catch {
    return false;
  }
}

/** Only the project's explicitly named publishable/legacy anon key is ever used. */
export function getSupabaseConfig(): { config: SupabaseConfig | null; reason?: 'missing' | 'invalid' | 'privileged_key' } {
  // AHDE_* is canonical. The aliases keep existing local Supabase projects
  // usable without ever accepting a service-role/secret variable.
  const url = firstEnv('AHDE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL');
  const key = firstEnv(
    'AHDE_SUPABASE_PUBLISHABLE_KEY',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_PUBLISHABLE_KEY',
    'SUPABASE_ANON_KEY',
  );
  if (!url || !key) return { config: null, reason: 'missing' };
  if (isPrivilegedKey(key)) return { config: null, reason: 'privileged_key' };
  if (!isPublishableKey(key)) return { config: null, reason: 'invalid' };
  try {
    const parsed = new URL(url);
    if (!['https:', 'http:'].includes(parsed.protocol) || !parsed.hostname || parsed.username || parsed.password) {
      return { config: null, reason: 'invalid' };
    }
    if (parsed.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]', '::1'].includes(parsed.hostname)) {
      return { config: null, reason: 'invalid' };
    }
  } catch {
    return { config: null, reason: 'invalid' };
  }
  return { config: { url, key } };
}

export function secureCookiesFromHeaders(headers: Headers): boolean {
  const forwarded = headers.get('x-forwarded-proto')?.split(',')[0]?.trim().toLowerCase();
  if (forwarded === 'https') return true;
  const host = (headers.get('x-forwarded-host') ?? headers.get('host') ?? '').split(',')[0].trim().toLowerCase();
  const isLoopback = /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host);
  const explicitLocalHttp = process.env.AHDE_LOCAL_HTTP === 'true' && isLoopback && forwarded !== 'https';
  return !explicitLocalHttp;
}
