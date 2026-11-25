'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Download, LogOut, ShieldCheck, UserRound } from 'lucide-react';
import { apiRequest, useWorkspace } from '@/components/providers';
import { NotificationPreferences } from '@/features/messaging';

export function ProfilePage() {
  const { session, loading, refresh, notify } = useWorkspace();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [avatarVersion, setAvatarVersion] = useState(0);
  async function perform(action: () => Promise<unknown>, message: string) {
    setBusy(true); setError('');
    try { await action(); await refresh(); notify(message); }
    catch (err) { setError(err instanceof Error ? err.message : 'İşlem tamamlanamadı.'); }
    finally { setBusy(false); }
  }
  if (loading) return <div className="card" role="status">Oturumunuz kontrol ediliyor…</div>;
  if (!session.user) return <section className="readable-page"><div className="eyebrow">YOL ARKADAŞLIĞI BURADA BAŞLAR</div><h1>Kendine bir yer aç.</h1><p>Profiliniz ve kişisel kayıtlarınız için önce giriş yapın. Henüz tanışmadıysak aramıza katılabilirsiniz.</p><div className="hero-actions"><Link href="/login" className="button">Giriş yap <ArrowRight size={16} /></Link><Link href="/register" className="button secondary">Aramıza katıl</Link></div></section>;
  const role = { member: 'Üye', dervish: 'Derviş', teacher: 'Hoca', admin: 'Yönetici' }[session.role];
  return <div className="profile-layout">
    <div className="profile-heading"><div className="profile-avatar">{session.profile?.avatar_path ? <img src={`/api/avatar?v=${avatarVersion}`} alt="Profil fotoğrafınız" /> : session.profile?.full_name.charAt(0) || <UserRound />}</div><div><h1>{session.profile?.full_name || 'Yol arkadaşımız'}</h1><p>{session.user.email} · {role}</p></div></div>
    {!session.schemaReady && <div className="schema-alert"><strong>Veritabanı kurulumu bekleniyor.</strong> {session.error || 'Kişisel kayıtlar kullanılmadan önce Supabase migration dosyasının uygulanması gerekiyor.'} Kimlik doğrulama ayrı, kayıtların saklandığı veritabanı ayrı kontrol edilir.</div>}
    {error && <div className="form-error" role="alert">{error}</div>}
    <div className="profile-columns">
      <section className="card"><h2>Biraz kendinden.</h2><form key={session.profile?.id} onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); void perform(() => apiRequest('/api/profile', 'PATCH', { full_name: f.get('full_name'), username: f.get('username'), bio: f.get('bio') }), 'Profiliniz güncellendi.'); }}>
        <div className="field"><label htmlFor="profile-name">Ad soyad</label><input id="profile-name" name="full_name" defaultValue={session.profile?.full_name} minLength={2} maxLength={100} autoComplete="name" required /></div>
        <div className="field"><label htmlFor="profile-username">Kullanıcı adı</label><input id="profile-username" name="username" defaultValue={session.profile?.username} pattern="[a-zA-Z0-9_]{3,24}" minLength={3} maxLength={24} required /></div>
        <div className="field"><label htmlFor="profile-bio">Kısa tanıtım</label><textarea id="profile-bio" name="bio" defaultValue={session.profile?.bio || ''} maxLength={400} rows={3} /><small>Adınız, kullanıcı adınız ve tanıtımınız topluluk profilinde görünebilir. Özel bilgilerinizi burada paylaşmayın.</small></div>
        <button className="button" disabled={busy || !session.schemaReady}>{busy ? 'Kaydediliyor…' : 'Değişiklikleri kaydet'}</button>
      </form><form style={{ borderTop: '1px solid var(--border)', marginTop: 25, paddingTop: 24 }} onSubmit={e => { e.preventDefault(); const file = (new FormData(e.currentTarget)).get('file'); if (!(file instanceof File) || !file.size) { notify('Lütfen bir fotoğraf seçin.'); return; } if (file.size > 2 * 1024 * 1024) { notify('Fotoğraf 2 MB’tan küçük olmalı.'); return; } void perform(async () => { const form = new FormData(); form.set('file', file); const res = await fetch('/api/avatar', { method: 'POST', headers: { 'X-Ahde-Request': '1' }, body: form, credentials: 'include' }); const result = await res.json(); if (!res.ok) throw new Error(result.error || 'Fotoğraf yüklenemedi.'); setAvatarVersion(v => v + 1); }, 'Profil fotoğrafınız güncellendi.'); }}><div className="field"><label htmlFor="photo">Profil fotoğrafı <span className="muted">(isteğe bağlı)</span></label><input id="photo" name="file" type="file" accept="image/jpeg,image/png,image/webp" required /><small>JPG, PNG veya WebP · En fazla 2 MB. Özel depolamada tutulur.</small></div><button className="button secondary" disabled={busy || !session.schemaReady}>Fotoğrafı yükle</button></form></section>
      <aside>
        <NotificationPreferences />
        <section className="card profile-action-card"><ShieldCheck size={23} strokeWidth={1.3} color="#8c9473" /><h2 style={{ marginTop: 12 }}>Yol arkadaşlığın.</h2><p>{session.role === 'member' ? 'Kayıt olduğunuzda üye olarak başlarsınız. Bir hocanın bağlantınızı onaylamasıyla kişisel derviş odası açılır.' : 'Kişisel odanızdaki kayıtlar size aittir. Hoca paylaşım izinlerini ilgili defterinizden yönetebilirsiniz.'}</p><Link href={session.role === 'member' ? '/teacher' : '/journey'} className="button secondary">{session.role === 'member' ? 'Hoca bağlantısı hakkında' : 'Kişisel odama git'}<ArrowRight size={15} /></Link><p style={{ fontSize: 10, marginTop: 13, marginBottom: 0 }}>Hoca ve yönetici rolleri kendi kendine seçilemez.</p></section>
        <section className="card profile-action-card"><h2>Verilerin senin.</h2><p>Yalnızca kendi profilini ve kayıtlarını JSON olarak indir. Diğer kullanıcıların özel verileri dışa aktarılmaz.</p><button className="button secondary" disabled={busy || !session.schemaReady} onClick={() => void perform(async () => { const response = await fetch('/api/export', { credentials: 'include', cache: 'no-store' }); if (!response.ok) { const result = await response.json(); throw new Error(result.error || 'Veriler indirilemedi.'); } const url = URL.createObjectURL(await response.blob()); const a = document.createElement('a'); a.href = url; a.download = 'ahde-vefa-verilerim.json'; a.click(); URL.revokeObjectURL(url); }, 'Verileriniz indirildi.')}><Download size={15} />Verilerimi indir</button></section>
        <section className="card profile-action-card"><h2>Oturum ve şifre.</h2><form onSubmit={e => { e.preventDefault(); const password = new FormData(e.currentTarget).get('password'); void perform(() => apiRequest('/api/auth', 'POST', { action: 'updatePassword', password }), 'Şifreniz güncellendi.'); }}><div className="field"><label htmlFor="new-password">Yeni şifre</label><input id="new-password" name="password" type="password" minLength={8} maxLength={72} autoComplete="new-password" required /></div><button className="button secondary" disabled={busy}>Şifreyi güncelle</button></form><button className="button ghost" style={{ marginTop: 10 }} disabled={busy} onClick={() => void perform(async () => { await apiRequest('/api/auth', 'POST', { action: 'signOut' }); router.push('/'); }, 'Oturumunuz kapatıldı.')}><LogOut size={15} />Güvenle çıkış yap</button></section>
        <section className="card profile-action-card"><h2>Hesabımı sil.</h2><p>Hesap silme geri alınamaz. Devam etmeden önce verilerini dışa aktarmanı öneririz.</p>{!deleting ? <button className="text-link" onClick={() => setDeleting(true)} style={{ border: 0, background: 'none', color: '#9d594c', padding: 0 }}>Hesap silme seçenekleri</button> : <form onSubmit={e => { e.preventDefault(); const form = new FormData(e.currentTarget); void perform(async () => { await apiRequest('/api/account', 'DELETE', { password: form.get('password'), confirmation: form.get('confirmation') }); router.push('/'); }, 'Hesabınız silindi.'); }}><div className="field"><label htmlFor="delete-password">Mevcut şifren</label><input id="delete-password" name="password" type="password" maxLength={72} autoComplete="current-password" required /></div><div className="field"><label htmlFor="delete-confirmation">Onay için HESABIMI SİL yaz</label><input id="delete-confirmation" name="confirmation" pattern="HESABIMI SİL" required /></div><label className="check-label"><input type="checkbox" required /><span>Hesabımın ve kişisel kayıtlarımın kalıcı olarak silinmesini istiyorum.</span></label><button className="button danger" disabled={busy || !session.schemaReady}>Hesabımı kalıcı olarak sil</button><button className="button ghost" type="button" onClick={() => setDeleting(false)}>Vazgeç</button></form>}</section>
      </aside>
    </div>
  </div>;
}
