import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { verifiedUser } from '@/lib/server/auth';
import { apiError, json, readJsonMutation } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rate-limit';
export const dynamic = 'force-dynamic';
const createSchema = z.object({ recipient_id: z.string().uuid().nullable().optional(), subject: z.string().trim().max(200).default(''), body: z.string().trim().min(1).max(20000), deliver_at: z.string().datetime().nullable().optional(), send: z.boolean().default(false) }).strict();
const patchSchema = z.object({ id: z.string().uuid(), archived: z.boolean() }).strict();
export async function GET() {
  const c = await createSupabaseServerClient(); if (!c) return apiError('Supabase bağlantısı yapılandırılmamış.', 503);
  const u = await verifiedUser(c); if (!u) return apiError('Oturum açmanız gerekiyor.', 401);
  await c.rpc('process_my_due_items');
  const x = await c.from('letters').select('id,sender_id,recipient_id,status,subject,title,body,deliver_at,delivered_at,archived_at,created_at').or(`sender_id.eq.${u.id},recipient_id.eq.${u.id}`).order('created_at', { ascending: false }).limit(100);
  if (x.error) return apiError('Mektuplar yüklenemedi.', 503); return json({ letters: x.data || [] });
}
export async function POST(r: NextRequest) {
  const limited = rateLimit(r, 'letters', 20, 60000); if (limited) return limited;
  const b = await readJsonMutation(r, 24000); if (!b.ok) return b.response; const p = createSchema.safeParse(b.body); if (!p.success) return apiError('Mektup alanları geçersiz.', 400);
  const c = await createSupabaseServerClient(); if (!c) return apiError('Supabase bağlantısı yapılandırılmamış.', 503); const u = await verifiedUser(c); if (!u) return apiError('Oturum açmanız gerekiyor.', 401);
  const d = p.data; const deliver = d.deliver_at || new Date().toISOString(); const sent = d.send || Boolean(d.recipient_id);
  const x = await c.from('letters').insert({ sender_id: u.id, recipient_id: d.recipient_id || null, title: d.subject, subject: d.subject, body: d.body, deliver_at: deliver, status: sent ? 'sent' : 'draft' }).select('id,sender_id,recipient_id,status,subject,title,body,deliver_at,created_at').single();
  if (x.error) return apiError('Mektup kaydedilemedi.', 400); return json({ letter: x.data }, 201);
}
export async function PATCH(r: NextRequest) {
  const b = await readJsonMutation(r, 4096); if (!b.ok) return b.response; const p = patchSchema.safeParse(b.body); if (!p.success) return apiError('Mektup güncellemesi geçersiz.', 400);
  const c = await createSupabaseServerClient(); if (!c) return apiError('Supabase bağlantısı yapılandırılmamış.', 503); const u = await verifiedUser(c); if (!u) return apiError('Oturum açmanız gerekiyor.', 401);
  const x = await c.from('letters').update({ archived_at: p.data.archived ? new Date().toISOString() : null }).eq('id', p.data.id).eq('sender_id', u.id).select('id,archived_at').single();
  if (x.error) return apiError('Mektup arşivlenemedi.', 400); return json({ letter: x.data });
}
