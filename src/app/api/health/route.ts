import { json } from '@/lib/server/http';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  return json({ ok: true });
}
