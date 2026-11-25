'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { apiRequest, useWorkspace } from '@/components/providers';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const { session, loading, refresh } = useWorkspace();
  const [showPassword, setShowPassword] = useState(false);
  const [reset, setReset] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const registration = mode === 'register';
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(''); setMessage('');
    const form = new FormData(event.currentTarget);
    try {
      const result = await apiRequest('/api/auth', 'POST', {
        action: reset ? 'resetPassword' : registration ? 'signUp' : 'signIn',
        email: String(form.get('email') || ''),
        ...(!reset ? { password: String(form.get('password') || '') } : {}),
        ...(registration ? { full_name: String(form.get('full_name') || ''), username: String(form.get('username') || ''), bio: String(form.get('bio') || '') } : {}),
      });
      setMessage(result.message || 'İşlem tamamlandı.');
      if (!reset) {
        await refresh();
        if (!registration) router.push('/profile');
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'İşlem tamamlanamadı.'); }
    finally { setBusy(false); }
  }
  if (session.user) return <div className="readable-page"><div className="eyebrow">YOL ARKADAŞLIĞINIZ DEVAM EDİYOR</div><h1>Yeniden merhaba.</h1><p>Zaten giriş yaptınız. Profilinizden devam edebilir veya kişisel odanıza geçebilirsiniz.</p><Link href="/profile" className="button">Profilime git <ArrowRight size={16} /></Link></div>;
  return <section className="auth-layout">
    <div className="auth-story"><div className="eyebrow">AHDE VEFA</div><h1>Bir gönülde<br /><em>yer bulmak.</em></h1><p>{registration ? 'Bu yol, birbirinin yükünü hafifletmek isteyen yol arkadaşlarına açık. Önce tanışalım; sonra yan yana yürüyelim.' : 'Kendine dönmek için bir an. Defterlerin, hâlin ve yolculuğun burada seni bekliyor.'}</p><div className="privacy-inline"><LockKeyhole size={15} />Güvenle, kendi ritminde.</div></div>
    <div className="card auth-form"><h2>{reset ? 'Yeni bir başlangıç.' : registration ? 'Aramıza katıl.' : 'Hoş geldin, yol arkadaşım.'}</h2><p>{reset ? 'Şifreni yenilemek için e-posta adresini yaz.' : registration ? 'İlk adımı birlikte atalım.' : 'E-posta adresin ve şifrenle devam et.'}</p>
      {!loading && !session.configured && <div className="schema-alert">Supabase bağlantısı henüz hazır değil. Kayıt ve giriş bağlantı tamamlandıktan sonra kullanılabilir.</div>}
      {session.error && <div className="schema-alert">{session.error}</div>}
      {error && <div className="form-error" role="alert">{error}</div>}{message && <div className="form-success" role="status">{message}</div>}
      <form onSubmit={submit}>
        {registration && <><div className="field"><label htmlFor="full_name">Ad soyad</label><input id="full_name" name="full_name" placeholder="Size nasıl hitap edelim?" autoComplete="name" minLength={2} maxLength={100} required /></div><div className="field"><label htmlFor="username">Kullanıcı adı</label><input id="username" name="username" placeholder="yolarkadasim" autoComplete="username" pattern="[a-zA-Z0-9_]{3,24}" minLength={3} maxLength={24} required /><small>3–24 karakter; harf, rakam ve alt çizgi.</small></div></>}
        <div className="field"><label htmlFor="email">E-posta</label><input id="email" name="email" type="email" autoComplete="email" placeholder="eposta@ornek.com" maxLength={254} required /></div>
        {!reset && <div className="field"><label htmlFor="password">Şifre</label><div className="password-wrap"><input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={registration ? 'new-password' : 'current-password'} placeholder={registration ? 'En az 8 karakter' : 'Şifreniz'} minLength={registration ? 8 : 1} maxLength={72} required /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></div>}
        {registration && <><div className="field"><label htmlFor="bio">Kısa tanıtım <span className="muted">(isteğe bağlı)</span></label><textarea id="bio" name="bio" rows={2} maxLength={400} placeholder="Kendinizden birkaç kelime…" /></div><p className="muted" style={{ fontSize: 11 }}>Profil fotoğrafınızı e-postanızı doğruladıktan sonra Profilim bölümünden ekleyebilirsiniz.</p><label className="check-label"><input type="checkbox" required /><span><Link href="/privacy">Mahremiyet ilkelerini</Link> ve <Link href="/rules">topluluk yaklaşımını</Link> okudum.</span></label></>}
        {!registration && !reset && <div className="auth-subline"><button type="button" onClick={() => { setReset(true); setError(''); setMessage(''); }}>Şifremi unuttum</button></div>}
        <button type="submit" className="button full-width" disabled={busy || loading || !session.configured}>{busy ? 'Bir an…' : reset ? 'Yenileme bağlantısı gönder' : registration ? 'Aramıza katıl' : 'Giriş yap'}{!busy && <ArrowRight size={16} />}</button>
      </form>
      <div className="auth-switch">{reset ? <button className="icon-button" onClick={() => { setReset(false); setMessage(''); }}>Girişe dön</button> : registration ? <>Zaten yol arkadaşımız mısınız? <Link href="/login">Giriş yapın</Link></> : <>Henüz tanışmadık mı? <Link href="/register">Aramıza katılın</Link></>}</div>
    </div>
  </section>;
}
