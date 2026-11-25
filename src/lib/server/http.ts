import 'server-only';
import type { NextRequest } from 'next/server';

const PRIVATE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
  Pragma: 'no-cache',
  Vary: 'Cookie',
  'X-Content-Type-Options': 'nosniff',
};

export function json(data: unknown, status = 200, extraHeaders?: HeadersInit): Response {
  const headers = new Headers(PRIVATE_HEADERS);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  if (extraHeaders) new Headers(extraHeaders).forEach((value, key) => headers.set(key, value));
  return Response.json(data, { status, headers });
}

export function apiError(message: string, status: number): Response {
  return json({ error: message }, status);
}

export function noStoreRedirect(location: string, status = 303): Response {
  return new Response(null, {
    status,
    headers: { ...PRIVATE_HEADERS, Location: location },
  });
}

export type JsonBodyResult = { ok: true; body: unknown } | { ok: false; response: Response };

export async function readJsonMutation(request: NextRequest, maxBytes = 32_768): Promise<JsonBodyResult> {
  if (request.headers.get('x-ahde-request') !== '1') {
    return { ok: false, response: apiError('İstek doğrulanamadı.', 403) };
  }
  const contentType = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
  if (contentType !== 'application/json') {
    return { ok: false, response: apiError('Content-Type application/json olmalıdır.', 415) };
  }
  const length = Number(request.headers.get('content-length'));
  if (Number.isFinite(length) && length > maxBytes) {
    return { ok: false, response: apiError('İstek gövdesi çok büyük.', 413) };
  }
  try {
    const text = await request.text();
    if (Buffer.byteLength(text, 'utf8') > maxBytes) {
      return { ok: false, response: apiError('İstek gövdesi çok büyük.', 413) };
    }
    return { ok: true, body: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, response: apiError('Geçerli JSON gerekli.', 400) };
  }
}

export function requireMutationHeader(request: NextRequest): Response | null {
  if (request.headers.get('x-ahde-request') !== '1') return apiError('İstek doğrulanamadı.', 403);
  return null;
}
