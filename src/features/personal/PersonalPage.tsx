'use client';

import Link from 'next/link';
import { BookHeart, CalendarDays, ClipboardCheck, CloudMoon, HeartHandshake, LockKeyhole } from 'lucide-react';
import { useWorkspace } from '@/components/providers';
import type { SessionState, WorkspaceData } from '@/lib/types';
import { JourneySection } from './journey';
import { WirdsSection } from './wirds';
import { DreamsSection } from './dreams';
import { ReflectionsSection } from './reflections';
import './personal.css';

export type PersonalSection = 'journey' | 'wirds' | 'dreams' | 'reflections';

const sections: { id: PersonalSection; href: string; label: string; short: string; icon: typeof CalendarDays }[] = [
  { id: 'journey', href: '/journey', label: 'Yolculuğum', short: 'Hâl ve ibadet', icon: CalendarDays },
  { id: 'wirds', href: '/wirds', label: 'Virdlerim', short: 'Vird defteri', icon: BookHeart },
  { id: 'dreams', href: '/dreams', label: 'Rüyalarım', short: 'Özel rüya defteri', icon: CloudMoon },
  { id: 'reflections', href: '/reflections', label: 'Muhasebem', short: 'Günlük tefekkür', icon: ClipboardCheck },
];

const copy: Record<PersonalSection, { eyebrow: string; title: string; subtitle: string }> = {
  journey: { eyebrow: 'Kişisel oda · Yolculuğum', title: 'Bugün gönlünüz nasıl?', subtitle: 'Hâlinizi, ibadetlerinizi ve günün izlerini kendi ritminizde kaydedin.' },
  wirds: { eyebrow: 'Kişisel oda · Virdlerim', title: 'Vird defteriniz', subtitle: 'Kendi hedeflerinizi ve hocanızdan gelen vazifeleri ayrı ayrı takip edin.' },
  dreams: { eyebrow: 'Kişisel oda · Rüyalarım', title: 'Rüya defteriniz', subtitle: 'Hatırladıklarınızı yalnızca kendiniz için saklayın; paylaşım kararını siz verin.' },
  reflections: { eyebrow: 'Kişisel oda · Muhasebem', title: 'Kendinize ayırdığınız vakit', subtitle: 'Gününüzü hazır sorularla ya da kendi merakınızla sakince gözden geçirin.' },
};

function LoadingRoom() {
  return <div className="personal-skeleton" role="status" aria-label="Kişisel oda yükleniyor"><span /><span /><span /></div>;
}

function AccessMessage({ session }: { session: SessionState }) {
  if (!session.user) {
    return <section className="personal-gate card" aria-labelledby="personal-gate-title">
      <span className="personal-gate-mark"><HeartHandshake size={23} aria-hidden="true" /></span>
      <p className="eyebrow">Mahremiyetle yürüyen bir yol</p>
      <h2 id="personal-gate-title">Bu oda size ait bir oturum bekliyor</h2>
      <p>Kişisel kayıtlar yalnızca hesabınızla açılır. Giriş yapın ya da kendinize özel bir hesap oluşturun; burada sahte veya geçici kayıt tutulmaz.</p>
      <div className="personal-gate-actions"><Link className="button" href="/login">Giriş yap</Link><Link className="button secondary" href="/register">Hesap oluştur</Link></div>
    </section>;
  }
  if (!session.schemaReady) {
    return <section className="personal-gate card" aria-labelledby="personal-gate-title">
      <span className="personal-gate-mark"><LockKeyhole size={22} aria-hidden="true" /></span>
      <p className="eyebrow">Güvenli başlangıç</p><h2 id="personal-gate-title">Kişisel alan henüz hazırlanıyor</h2>
      <p>Verileriniz açılmadan önce Supabase veritabanı migrationlarının uygulanması gerekiyor. Bu adım tamamlanana kadar kayıt oluşturulmaz veya saklanıyormuş gibi gösterilmez.</p>
      <p className="personal-gate-note">Supabase bağlantısını ve şema hazırlığını tamamlamak için proje yöneticinize başvurun.</p>
    </section>;
  }
  if (session.role === 'member') {
    return <section className="personal-gate card" aria-labelledby="personal-gate-title">
      <span className="personal-gate-mark"><HeartHandshake size={23} aria-hidden="true" /></span>
      <p className="eyebrow">Hoca bağlantısı gerekli</p><h2 id="personal-gate-title">Bu oda, onaylı bağlantınızla açılır</h2>
      <p>Kişisel odanıza erişim için bir hocayla derviş bağlantınızın onaylanmış olması gerekir. Bağlantı tamamlanana kadar kişisel kayıtlarınız bu alana yüklenmez.</p>
      <div className="personal-gate-actions"><Link className="button" href="/teacher">Hoca bağlantısı alanına git</Link></div>
      <p className="personal-gate-note">Hoca paneli sonraki aşamada genişletilecektir.</p>
    </section>;
  }
  return null;
}

export function PersonalPage({ section }: { section: PersonalSection }) {
  const { session, data, loading, mutate } = useWorkspace();
  const active = copy[section];
  const blocked = !session.user || !session.schemaReady || session.role === 'member';
  return (
    <section className="personal-room">
      <header className="personal-page-head">
        <div className="personal-head-copy"><p className="eyebrow">{active.eyebrow}</p><h1>{active.title}</h1><p className="personal-page-intro">{active.subtitle}</p></div>
        <div className="personal-head-stamp" aria-hidden="true"><span>Ahde<br />Vefa</span><i /></div>
      </header>
      <nav className="personal-tabs" aria-label="Kişisel oda bölümleri">
        {sections.map(({ id, href, label, short, icon: Icon }) => <Link key={id} href={href} aria-current={section === id ? 'page' : undefined} className={`personal-tab${section === id ? ' personal-tab-active' : ''}`}>
          <Icon size={18} aria-hidden="true" /><span><strong>{label}</strong><small>{short}</small></span>
        </Link>)}
      </nav>
      {loading ? <LoadingRoom /> : blocked ? <AccessMessage session={session} /> : <AuthorizedSection section={section} data={data} mutate={mutate} />}
    </section>
  );
}

function AuthorizedSection({ section, data, mutate }: { section: PersonalSection; data: WorkspaceData; mutate: ReturnType<typeof useWorkspace>['mutate'] }) {
  if (section === 'journey') return <JourneySection data={data} mutateAction={mutate} />;
  if (section === 'wirds') return <WirdsSection data={data} mutateAction={mutate} />;
  if (section === 'dreams') return <DreamsSection data={data} mutateAction={mutate} />;
  return <ReflectionsSection data={data} mutateAction={mutate} />;
}
