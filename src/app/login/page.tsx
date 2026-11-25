import type { Metadata } from 'next';
import { AuthForm } from '@/features/auth/auth-form';
export const metadata: Metadata = { title: 'Giriş yap' };
export default function Page() { return <AuthForm mode="login" />; }
