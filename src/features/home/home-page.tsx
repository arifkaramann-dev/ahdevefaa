'use client';

import Link from 'next/link';
import { ArrowDown, ArrowRight, BookOpen, Check, Feather, LockKeyhole, Moon, Sprout } from 'lucide-react';
import { useWorkspace } from '@/components/providers';
import { PRAYERS } from '@/lib/types';

export function HomePage() {
  const { session, data } = useWorkspace();
  const date = new Date();
  const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const personalReady = !!session.user && session.schemaReady && session.role !== 'member';
  const latestMood = data.moods.find(m => new Date(m.recorded_at).toLocaleDateString('sv-SE') === day);
  const completed = data.prayers.filter(p => p.date === day && p.completed).length;
  return <>
    <section className="home-hero">
      <div className="hero-copy"><div className="eyebrow"><span />GÖNÜLDEN GÖNÜLE BİR YOL</div><h1>Yanlışlıktan değil,<br /><em>yalnızlıktan.</em></h1><p>Manevî yolculuğunda yalnız değilsin.<br className="desktop-break" /> Birbirinin yükünü hafifletmeye çalışan<br className="desktop-break" /> yol arkadaşlarının dijital dergâhı.</p><div className="hero-actions"><Link href={personalReady ? '/journey' : session.user ? '/profile' : '/register'} className="button">{personalReady ? 'Yolculuğuma devam et' : 'Bu yola birlikte çıkalım'}<ArrowRight size={17} /></Link><a href="#günün-notu" className="text-link">Biraz soluklan <ArrowDown size={15} /></a></div><div className="hero-footnote"><span className="mini-arch" />Her adım kıymetli. Her hâl insana dair.</div></div>
      <div className="hero-visual"><img src="/manus-storage/async-images/KjwzROTQULa21QOwa70sEP/image-1.webp" alt="Sıcak ışığın düştüğü, zeytin ağaçlı sakin bir taş avlu. Temsilî görsel." /><div className="hero-image-caption"><span />Bir gönülde yer bulmak.</div><div className="hero-image-number">01 / SÜKÛNET</div></div>
    </section>
    <section className="home-content" id="günün-notu">
      <div className="home-editorial">
        <div className="section-line"><h2>Bugün, bir nefes.</h2><span>YOLUN İÇİNDEN</span></div>
        <article className="daily-thought"><div className="thought-label"><Feather size={17} /><span>GÜNÜN TEFEKKÜRÜ</span></div><span className="quote-mark">“</span><h3>Birinin yanında olmak,<br />bazen hiçbir şey söylemeden<br /><em>orada kalabilmektir.</em></h3><div className="thought-bottom"><span>Ahde Vefa'nın yaklaşımından</span><span className="thought-leaf"><Sprout size={24} strokeWidth={1.2} /></span></div></article>
        <div className="room-section"><div className="section-line"><h2>Gönlüne bir yer aç.</h2><Link href="/journey" className="text-link">Kişisel odam <ArrowRight size={15} /></Link></div><div className="room-links"><Link href="/wirds"><BookOpen size={23} strokeWidth={1.4} /><h3>Vird defterin</h3><p>Az da olsa, devamlı.<br />Kendi ritminde ilerle.</p><span>Defteri aç <ArrowRight size={15} /></span></Link><Link href="/dreams"><Moon size={23} strokeWidth={1.4} /><h3>Rüya defterin</h3><p>Geceden kalan izleri,<br />kendine sakla.</p><span>Defteri aç <ArrowRight size={15} /></span></Link><Link href="/reflections"><Feather size={23} strokeWidth={1.4} /><h3>Muhaseben</h3><p>Günün ardından,<br />kendine nazikçe bak.</p><span>Defteri aç <ArrowRight size={15} /></span></Link></div></div>
      </div>
      <aside className="home-day"><div className="day-card"><div className="day-card-heading"><span className="eyebrow">KENDİNE KÜÇÜK BİR ZAMAN</span><span className="day-card-date">{date.getDate()}<small>{new Intl.DateTimeFormat('tr-TR', { month: 'long' }).format(date)}</small></span></div><h2>Bugün gönlün<br />nasıl?</h2><p>{personalReady ? latestMood ? `Son hâlin: ${latestMood.mood}. Dilersen yeni bir not ekle.` : 'Hâlini dinle. Aklından geçenleri kendine bir not bırak.' : 'Hâlini dinlemek, yolculuğunun ilk adımı olabilir.'}</p><Link href={personalReady ? '/journey' : '/login'} className="button secondary full-width"><Sprout size={17} />{personalReady ? 'Hâlimi kaydet' : 'Giriş yap ve hâlini kaydet'}</Link><div className="privacy-inline"><LockKeyhole size={12} />Bu kayıt yalnızca sana ait.</div><div className="day-prayers"><div className="prayer-heading"><span>Beş vakit, bir niyet</span>{personalReady && <small>{completed} / 5</small>}</div><div className="prayer-preview">{PRAYERS.map(p => <Link href="/journey" key={p} aria-label={`${p} namazı takibi`}><span className={data.prayers.some(e => e.date === day && e.prayer === p && e.completed) ? 'done' : ''}>{data.prayers.some(e => e.date === day && e.prayer === p && e.completed) ? <Check size={13} /> : <span className="prayer-dot" />}</span><small>{p}</small></Link>)}</div>{!personalReady && <small className="muted">Kişisel takip, onaylı derviş bağlantısıyla açılır.</small>}</div></div><div className="privacy-note-card"><LockKeyhole size={22} strokeWidth={1.4} /><h3>Mahremiyet, emanetimiz.</h3><p>Özel defterlerin yalnızca sana açıktır. Hocanla neyi paylaşacağına sen karar verirsin.</p><Link href="/privacy" className="text-link">Nasıl koruyoruz? <ArrowRight size={14} /></Link></div></aside>
    </section>
    <section className="home-community-entry card" aria-labelledby="community-entry-title">
      <div><div className="eyebrow">BİRLİKTE YÜRÜYELİM</div><h2 id="community-entry-title">Dergâhta yan yana.</h2><p>Herkese açık paylaşımlara kulak ver; bir söze, bir duaya, bir yol arkadaşlığına yer aç.</p></div>
      <div className="home-community-links"><Link href="/dergah" className="button">Dergâh akışını aç <ArrowRight size={16} /></Link><Link href="/conversations" className="text-link">Sohbetlere kulak ver</Link><Link href="/events" className="text-link">Buluşmaları gör</Link><Link href="/letters" className="text-link">Bir mektup yaz</Link></div>
    </section>
    <section className="companionship-strip"><span className="mini-arch" /><p>Yanlışlıktan değil,<br className="mobile-only" /> yalnızlıktan.</p><Link href="/community">Yan yana yürümek <ArrowRight size={17} /></Link></section>
  </>;
}
