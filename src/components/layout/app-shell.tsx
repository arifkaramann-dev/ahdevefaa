'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { BookOpen, CalendarDays, CheckSquare, ChevronRight, Feather, HeartHandshake, Home, Library, LockKeyhole, Mail, Menu, MessageCircle, Moon, ShieldCheck, Sprout, UserRound, X } from 'lucide-react';
import { useWorkspace } from '@/components/providers';
import { NotificationsButton } from '@/features/messaging';

export const NAVIGATION = [
  { href: '/dergah', title: 'Dergâh', icon: Home },
  { href: '/conversations', title: 'Sohbetler', icon: MessageCircle },
  { href: '/journey', title: 'Yolculuğum', icon: Sprout },
  { href: '/routines', title: 'Rutinlerim', icon: CheckSquare },
  { href: '/wirds', title: 'Virdlerim', icon: BookOpen },
  { href: '/dreams', title: 'Rüyalarım', icon: Moon },
  { href: '/reflections', title: 'Muhasebem', icon: Feather },
  { href: '/community', title: 'Kardeşlik', icon: HeartHandshake },
  { href: '/teacher', title: 'Hocam', icon: UserRound },
  { href: '/library', title: 'Kütüphane', icon: Library },
  { href: '/profile', title: 'Profilim', icon: UserRound },
];
const SECONDARY_NAVIGATION = [
  { href: '/messages', title: 'Mesajlarım', icon: MessageCircle },
  { href: '/letters', title: 'Mektuplarım', icon: Mail },
  { href: '/events', title: 'Buluşmalar', icon: CalendarDays },
];
const ROLES = { member: 'Üye', dervish: 'Derviş', teacher: 'Hoca', admin: 'Yönetici' };

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { session } = useWorkspace();
  const [menuOpen, setMenuOpen] = useState(false);
  const current = [...NAVIGATION, ...SECONDARY_NAVIGATION].find(n => n.href === path)?.title || (path === '/login' ? 'Giriş yap' : path === '/register' ? 'Aramıza katıl' : path === '/admin' ? 'Yönetim' : path === '/notifications' ? 'Bildirimlerim' : 'Ahde Vefa');
  const date = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">İçeriğe geç</a>
    {menuOpen && <button className="sidebar-backdrop" onClick={() => setMenuOpen(false)} aria-label="Menüyü kapat" />}
    <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`} aria-label="Ana menü">
      <Link href="/" className="brand" onClick={() => setMenuOpen(false)}>
        <img src="/mark.svg" alt="" width="47" height="47" />
        <div><strong>Ahde Vefa</strong><span>DİJİTAL DERGÂH</span></div>
      </Link>
      <button className="close-menu icon-button" onClick={() => setMenuOpen(false)} aria-label="Menüyü kapat"><X size={21} /></button>
      <div className="nav-eyebrow">BİRLİKTE YÜRÜYELİM</div>
      <nav>{NAVIGATION.map(({ href, title, icon: Icon }) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} className={`nav-link ${path === href ? 'active' : ''}`} aria-current={path === href ? 'page' : undefined}>
        <Icon size={19} strokeWidth={1.6} /><span>{title}</span>{path === href && <span className="nav-active-dot" />}
      </Link>)}</nav>
      <nav className="sidebar-secondary" aria-label="İletişim ve buluşmalar">
        <div className="nav-eyebrow">GÖNÜLDEN GÖNÜLE</div>
        {SECONDARY_NAVIGATION.map(({ href, title, icon: Icon }) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} className={`nav-link ${path === href ? 'active' : ''}`} aria-current={path === href ? 'page' : undefined}><Icon size={19} strokeWidth={1.6} /><span>{title}</span></Link>)}
        {session.user && session.role === 'admin' && <Link href="/admin" onClick={() => setMenuOpen(false)} className={`nav-link ${path === '/admin' ? 'active' : ''}`} aria-current={path === '/admin' ? 'page' : undefined}><ShieldCheck size={19} strokeWidth={1.6} /><span>Yönetim</span></Link>}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-thought"><span className="small-gold-line" /><p>Birbirimizin yükünü<br />hafifletmek için buradayız.</p><span>Yanlışlıktan değil, yalnızlıktan.</span></div>
        <Link href={session.user ? '/profile' : '/login'} className="sidebar-user"><span className="avatar-initial">{session.profile?.full_name?.charAt(0) || 'V'}</span><div><strong>{session.profile?.full_name || (session.user ? 'Yol arkadaşımız' : 'Bir yol arkadaşlığı')}</strong><small>{session.user ? ROLES[session.role] : 'Giriş yap veya aramıza katıl'}</small></div><ChevronRight size={15} /></Link>
      </div>
    </aside>
    <div className="app-main">
      <header className="topbar">
        <div className="topbar-left"><button className="mobile-menu-button icon-button" onClick={() => setMenuOpen(true)} aria-label="Ana menüyü aç"><Menu size={22} /></button><span className="breadcrumb-brand">DİJİTAL DERGÂH</span><span className="breadcrumb-divider">/</span><span className="breadcrumb-title">{current}</span></div>
        <div className="topbar-right"><span className="header-date"><CalendarDays size={15} />{date}</span><NotificationsButton /><Link href="/privacy" className="privacy-badge" aria-label="Mahremiyet ilkeleri"><LockKeyhole size={14} /><span>Güvenle, yan yana</span></Link></div>
      </header>
      <main id="main-content" className="page-container">{children}</main>
      <footer className="app-footer"><span>Ahde Vefa · Gönülden gönüle bir yol</span><div><Link href="/privacy">Mahremiyet</Link><Link href="/roadmap">Geliştirme aşamaları</Link></div></footer>
    </div>
    <nav className="bottom-nav" aria-label="Mobil ana menü">{[NAVIGATION[0], NAVIGATION[2], NAVIGATION[3], NAVIGATION[4]].map(({ href, title, icon: Icon }) => <Link key={href} href={href} className={path === href ? 'active' : ''} aria-current={path === href ? 'page' : undefined}><Icon size={21} strokeWidth={1.7} /><span>{title}</span></Link>)}<button onClick={() => setMenuOpen(true)} aria-expanded={menuOpen}><Menu size={21} /><span>Diğer</span></button></nav>
  </div>;
}
