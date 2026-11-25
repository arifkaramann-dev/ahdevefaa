import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PersonalPage } from '@/features/personal';
import { PrivacyPage, RoadmapPage, RulesPage } from '@/features/info/info-pages';
import { TeacherPage, AdminPage } from '@/features/teacher';
import { SocialPage } from '@/features/social';
import { MessagesPage, NotificationsPage } from '@/features/messaging';
import { ContentPage, LettersPage } from '@/features/content';
import { RoutinesPage } from '@/features/routines';

const titles: Record<string, string> = {
  dergah: 'Dergâh', routines: 'Rutinlerim', journey: 'Yolculuğum', wirds: 'Virdlerim', dreams: 'Rüyalarım',
  reflections: 'Muhasebem', conversations: 'Sohbetler', community: 'Kardeşlik',
  teacher: 'Hocam', library: 'Kütüphane', messages: 'Mesajlarım', notifications: 'Bildirimlerim',
  events: 'Buluşmalar', letters: 'Mektuplarım', admin: 'Yönetim',
  privacy: 'Mahremiyet', roadmap: 'Geliştirme aşamaları', rules: 'Topluluk yaklaşımı',
};
export const dynamicParams = false;
export function generateStaticParams() { return Object.keys(titles).map(section => ({ section })); }
export async function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> {
  const { section } = await params;
  return { title: titles[section] || 'Ahde Vefa' };
}
export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (section === 'routines') return <RoutinesPage />;
  if (['journey', 'wirds', 'dreams', 'reflections'].includes(section)) {
    return <PersonalPage section={section as 'journey' | 'wirds' | 'dreams' | 'reflections'} />;
  }
  if (section === 'dergah') return <SocialPage area="dergah" />;
  if (section === 'community') return <SocialPage area="community" />;
  if (section === 'teacher') return <TeacherPage />;
  if (section === 'admin') return <AdminPage />;
  if (section === 'messages') return <MessagesPage />;
  if (section === 'notifications') return <NotificationsPage />;
  if (section === 'conversations') return <ContentPage section="lessons" />;
  if (section === 'library') return <ContentPage section="library" />;
  if (section === 'events') return <ContentPage section="events" />;
  if (section === 'letters') return <LettersPage />;
  if (section === 'privacy') return <PrivacyPage />;
  if (section === 'roadmap') return <RoadmapPage />;
  if (section === 'rules') return <RulesPage />;
  notFound();
}
