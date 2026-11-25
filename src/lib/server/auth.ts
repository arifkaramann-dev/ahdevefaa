import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Role } from '@/lib/types';

const ROLES: Role[] = ['member', 'dervish', 'teacher', 'admin'];
export type VerifiedUser = { id: string; email?: string };

export async function verifiedUser(client: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>) {
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  const user: VerifiedUser = { id: data.user.id };
  if (data.user.email) user.email = data.user.email;
  return user;
}

export async function databaseRole(client: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>, userId: string): Promise<Role> {
  const { data, error } = await client.from('roles').select('role').eq('user_id', userId).maybeSingle();
  if (error || !data || !ROLES.includes(data.role as Role)) return 'member';
  return data.role as Role;
}
