import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { verifiedUser } from '@/lib/server/auth';
import { apiError, json, readJsonMutation } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rate-limit';
export const dynamic = 'force-dynamic';

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('createPost'), body: z.string().trim().min(1).max(5000), title: z.string().trim().max(200).default(''), type: z.enum(['text','photo','story','qissa','announcement','question','reflection','audio','prayer','support']).default('text'), area: z.enum(['dergah','community']), visibility: z.enum(['public','teacher','private']).default('public'), anonymous: z.boolean().default(false) }).strict(),
  z.object({ action: z.literal('comment'), post_id: z.string().uuid(), body: z.string().trim().min(1).max(2000) }).strict(),
  z.object({ action: z.literal('like'), post_id: z.string().uuid(), enabled: z.boolean() }).strict(),
  z.object({ action: z.literal('save'), post_id: z.string().uuid(), enabled: z.boolean() }).strict(),
  z.object({ action: z.literal('report'), target_type: z.enum(['post','comment','user']), target_id: z.string().uuid(), reason: z.string().trim().min(3).max(1000) }).strict(),
  z.object({ action: z.literal('block'), user_id: z.string().uuid(), enabled: z.boolean() }).strict(),
]);

export async function GET(r: NextRequest) {
  const c = await createSupabaseServerClient();
  if (!c) return json({ posts: [], comments: [], stats: [], own_ids: [], configured: false });
  const u = await verifiedUser(c);
  const area = r.nextUrl.searchParams.get('area') === 'community' ? 'community' : 'dergah';
  const x = await c.from('posts').select('id,title,body,type,area,visibility,anonymous,created_at').eq('area', area).eq('visibility', 'public').eq('status', 'published').order('created_at', { ascending: false }).limit(50);
  if (x.error) return apiError('Akış yüklenemedi.', 503);
  const posts = x.data || []; const ids = posts.map((p) => p.id);
  if (!ids.length) return json({ posts, comments: [], stats: [], own_ids: [] });
  const [comments, likes] = await Promise.all([
    c.from('comments').select('id,post_id,author_id,body,created_at').in('post_id', ids).order('created_at', { ascending: true }),
    c.from('likes').select('post_id,user_id').in('post_id', ids),
  ]);
  if (comments.error || likes.error) return apiError('Akış etkileşimleri yüklenemedi.', 503);
  const stats = ids.map((id) => ({ post_id: id, likes: (likes.data || []).filter((l) => l.post_id === id).length, comments: (comments.data || []).filter((cmt) => cmt.post_id === id).length }));
  const own_ids = u ? (likes.data || []).filter((l) => l.user_id === u.id).map((l) => l.post_id) : [];
  return json({ posts, comments: comments.data || [], stats, own_ids });
}

export async function POST(r: NextRequest) {
  const limited = rateLimit(r, 'social', 30, 60000); if (limited) return limited;
  const b = await readJsonMutation(r, 12000); if (!b.ok) return b.response;
  const p = schema.safeParse(b.body); if (!p.success) return apiError('Topluluk isteği geçersiz.', 400);
  const c = await createSupabaseServerClient(); if (!c) return apiError('Supabase bağlantısı yapılandırılmamış.', 503);
  const u = await verifiedUser(c); if (!u) return apiError('Oturum açmanız gerekiyor.', 401);
  const v = p.data;
  if (v.action === 'createPost') { const x = await c.rpc('create_post', { _data: v }); if (x.error) return apiError('Paylaşım oluşturulamadı.', 400); return json({ post: x.data }, 201); }
  if (v.action === 'comment') { const x = await c.from('comments').insert({ post_id: v.post_id, author_id: u.id, body: v.body }).select('id,post_id,author_id,body,created_at').single(); if (x.error) return apiError('Yorum eklenemedi.', 400); return json({ comment: x.data }, 201); }
  if (v.action === 'like') { const x = v.enabled ? await c.from('likes').upsert({ post_id: v.post_id, user_id: u.id }, { onConflict: 'post_id,user_id' }) : await c.from('likes').delete().eq('post_id', v.post_id).eq('user_id', u.id); if (x.error) return apiError('Beğeni güncellenemedi.', 400); return json({ ok: true }); }
  if (v.action === 'save') { const x = v.enabled ? await c.from('post_saves').upsert({ post_id: v.post_id, user_id: u.id }, { onConflict: 'user_id,post_id' }) : await c.from('post_saves').delete().eq('post_id', v.post_id).eq('user_id', u.id); if (x.error) return apiError('Kayıt güncellenemedi.', 400); return json({ ok: true }); }
  if (v.action === 'report') { const x = await c.from('reports').insert({ reporter_id: u.id, target_type: v.target_type, target_id: v.target_id, reason: v.reason }); if (x.error) return apiError('Şikâyet kaydedilemedi.', 400); return json({ ok: true }, 201); }
  const x = v.enabled ? await c.from('user_blocks').upsert({ blocker_id: u.id, blocked_id: v.user_id }, { onConflict: 'blocker_id,blocked_id' }) : await c.from('user_blocks').delete().eq('blocker_id', u.id).eq('blocked_id', v.user_id); if (x.error) return apiError('Engelleme güncellenemedi.', 400); return json({ ok: true });
}
