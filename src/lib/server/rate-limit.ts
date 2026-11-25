import 'server-only';
import type { NextRequest } from 'next/server';
import { apiError } from './http';

type WindowState = { count: number; resetAt: number };
const windows = new Map<string, WindowState>();

function clientHint(request: NextRequest): string {
  const trusted = request.headers.get('x-real-ip')?.slice(0, 80);
  return trusted || 'unknown-client';
}

export function rateLimit(request: NextRequest, bucket: string, limit: number, windowMs: number): Response | null {
  const now = Date.now();
  if (windows.size > 4_000) {
    for (const [key, value] of windows) if (value.resetAt <= now) windows.delete(key);
    while (windows.size > 5_000) windows.delete(windows.keys().next().value as string);
  }
  const key = `${bucket}:${clientHint(request)}`;
  const current = windows.get(key);
  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }
  current.count += 1;
  if (current.count > limit) {
    return apiError('Çok fazla istek gönderildi. Lütfen daha sonra yeniden deneyin.', 429);
  }
  return null;
}
