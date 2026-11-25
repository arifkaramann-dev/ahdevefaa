import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { verifiedUser } from '@/lib/server/auth';
import { apiError, json, readJsonMutation } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rate-limit';
export const dynamic = 'force-dynamic';

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('start'), other_user_id: z.string().uuid() }).strict(),
  z.object({ action: z.literal('send'), conversation_id: z.string().uuid(), body: z.string().trim().min(1).max(10000), kind: z.enum(['text', 'audio', 'file']).default('text') }).strict(),
  z.object({ action: z.literal('read'), conversation_id: z.string().uuid() }).strict(),
]);

export async function GET() {
  const c = await createSupabaseServerClient();
  if (!c) return apiError('Supabase bağlantısı yapılandırılmamış.', 503);
  const u = await verifiedUser(c); if (!u) return apiError('Oturum açmanız gerekiyor.', 401);
  const members = await c.from('conversation_members').select('conversation_id,user_id,member_role,joined_at').eq('user_id', u.id);
  if (members.error) return apiError('Konuşmalar yüklenemedi.', 503);
  const ids = (members.data || []).map((m) => m.conversation_id);
  if (!ids.length) return json({ messages: [], conversations: [], members: [] });
  const [conversations, messages] = await Promise.all([
    c.from('conversations').select('id,created_by,created_at,updated_at').in('id', ids).order('updated_at', { ascending: false }),
    c.from('messages').select('id,conversation_id,sender_id,body,kind,created_at,read_at').in('conversation_id', ids).order('created_at', { ascending: false }).limit(200),
  ]);
  if (conversations.error || messages.error) return apiError('Mesajlar yüklenemedi.', 503);
  return json({ messages: messages.data || [], conversations: conversations.data || [], members: members.data || [] });
}

export async function POST(r: NextRequest) {
  const limited = rateLimit(r, 'messages', 30, 60000); if (limited) return limited;
  const b = await readJsonMutation(r, 16000); if (!b.ok) return b.response;
  const parsed = schema.safeParse(b.body); if (!parsed.success) return apiError('Mesaj isteği geçersiz.', 400);
  const c = await createSupabaseServerClient(); if (!c) return apiError('Supabase bağlantısı yapılandırılmamış.', 503);
  const u = await verifiedUser(c); if (!u) return apiError('Oturum açmanız gerekiyor.', 401);
  const p = parsed.data;
  if (p.action === 'start') {
    const x = await c.rpc('create_direct_conversation', { _other: p.other_user_id });
    if (x.error) return apiError('Bu kişiyle güvenli konuşma başlatılamadı.', 403);
    return json({ conversation_id: x.data });
  }
  if (p.action === 'send') {
    const x = await c.rpc('send_direct_message', { _conversation: p.conversation_id, _body: p.body, _kind: p.kind });
    if (x.error) return apiError('Mesaj gönderilemedi.', 403);
    return json({ message: x.data }, 201);
  }
  const x = await c.rpc('mark_conversation_read', { _conversation: p.conversation_id });
  if (x.error) return apiError('Okundu bilgisi güncellenemedi.', 403);
  return json({ updated: x.data });
}
