'use client';

import { useState } from 'react';
import { CloudMoon, CirclePlus, LockKeyhole, Pencil, Trash2 } from 'lucide-react';
import type { Dream, WorkspaceData } from '@/lib/types';
import { EmptyState, PersonalDialog, PrivacyPermissionToggle, type Mutate } from './shared';
import { formatDate, localDateKey } from './utils';

export function DreamsSection({ data, mutateAction }: { data: WorkspaceData; mutateAction: Mutate }) {
  const mutate = mutateAction;
  const [dialog, setDialog] = useState<{ mode: 'create' | 'edit'; dream?: Dream } | null>(null);
  const sortedDreams = [...data.dreams].sort((a, b) => b.date.localeCompare(a.date));
  const remove = async (dream: Dream) => {
    if (!window.confirm(`“${dream.title}” kaydını silmek istediğinizden emin misiniz?`)) return;
    await mutate('dreams', 'DELETE', {}, dream.id);
  };
  return <div className="personal-content-stack">
    <section className="personal-intro-strip"><span className="personal-intro-icon"><LockKeyhole size={19} aria-hidden="true" /></span><p>Rüyalarınız varsayılan olarak yalnızca size açıktır. Hocanızla paylaşmak isterseniz, hangi kaydın ya da bölümün açılacağına siz karar verirsiniz.</p></section>
    <section className="card personal-panel" aria-labelledby="personal-dreams-heading">
      <div className="personal-section-heading"><div><p className="eyebrow">Yalnızca size ait</p><h2 className="section-title" id="personal-dreams-heading">Rüya defteriniz</h2></div><button type="button" className="button" onClick={() => setDialog({ mode: 'create' })}><CirclePlus size={17} aria-hidden="true" /> Rüya kaydet</button></div>
      <PrivacyPermissionToggle module="dreams" label="Rüya defteri" permissions={data.permissions} connection={data.connection} mutateAction={mutate} />
      {sortedDreams.length ? <div className="personal-dream-list">{sortedDreams.map((dream) => <article className="personal-dream-card" key={dream.id}>
        <div className="personal-dream-head"><div><p className="eyebrow">{formatDate(dream.date)}</p><h3>{dream.title}</h3></div><div className="personal-record-actions"><button type="button" className="button ghost personal-icon-button" aria-label={`${dream.title} rüyasını düzenle`} onClick={() => setDialog({ mode: 'edit', dream })}><Pencil size={15} /></button><button type="button" className="button ghost personal-icon-button" aria-label={`${dream.title} rüyasını sil`} onClick={() => void remove(dream)}><Trash2 size={15} /></button></div></div>
        <div className="personal-dream-feelings"><span>Uyandığınızda <strong>{dream.waking_feeling || 'belirtilmedi'}</strong></span><span>Rüyada <strong>{dream.dream_feeling || 'belirtilmedi'}</strong></span></div>
        <div className="personal-dream-narrative"><p>{dream.narrative}</p></div>
        {dream.personal_notes && <div className="personal-dream-note"><span>Kişisel not</span><p>{dream.personal_notes}</p></div>}
        <DreamShare dream={dream} data={data} mutate={mutate} />
      </article>)}</div> : <EmptyState title="Hatırladığınız bir rüyayı saklayın" icon={<CloudMoon size={20} aria-hidden="true" />}>Başlık, anlatım, rüya sırasındaki his ve uyandığınızda kalan duygu size ait özel defterinizde kalır.<div className="personal-empty-actions"><button type="button" className="button" onClick={() => setDialog({ mode: 'create' })}>İlk rüyayı kaydet</button></div></EmptyState>}
    </section>
    {dialog && <DreamDialog key={`${dialog.mode}-${dialog.dream?.id ?? 'new'}`} mode={dialog.mode} dream={dialog.dream} mutate={mutate} onClose={() => setDialog(null)} />}
  </div>;
}

function DreamShare({ dream, data, mutate }: { dream: Dream; data: WorkspaceData; mutate: Mutate }) {
  const [pending, setPending] = useState(false);
  const connection = data.connection;
  const moduleShared = Boolean(connection?.active && data.permissions.some((item) => item.module === 'dreams' && item.record_id === null && item.teacher_id === connection.teacher_id));
  const permission = connection?.active ? data.permissions.find((item) => item.module === 'dreams' && item.record_id === dream.id && item.teacher_id === connection.teacher_id) : undefined;
  const teacherName = data.teachers.find((teacher) => teacher.id === connection?.teacher_id)?.display_name;
  const toggle = async () => {
    if (!connection?.active || pending || moduleShared) return;
    if (!permission && !window.confirm(`“${dream.title}” rüyasını${teacherName ? ` ${teacherName} ile` : ' hocanızla'} paylaşmak istiyor musunuz? Diğer rüyalarınız özel kalır.`)) return;
    if (permission && !window.confirm(`“${dream.title}” rüyası için paylaşım iznini kaldırmak istiyor musunuz?`)) return;
    setPending(true);
    try {
      if (permission) await mutate('privacy_permissions', 'DELETE', {}, permission.id);
      else await mutate('privacy_permissions', 'POST', { teacher_id: connection.teacher_id, module: 'dreams', record_id: dream.id });
    } finally { setPending(false); }
  };
  if (!connection?.active) return <div className="personal-record-share"><span className="personal-share-state"><LockKeyhole size={15} aria-hidden="true" /> Yalnızca size açık</span><span className="personal-muted">Aktif hoca bağlantınız olmadığı için paylaşım kullanılamıyor.</span></div>;
  if (moduleShared) return <div className="personal-record-share"><span className="personal-share-state"><LockKeyhole size={15} aria-hidden="true" /> Rüya defteri genel paylaşım izniniz kapsamında</span><span className="personal-muted">Bu kayıt, bölüm izni açık olduğu sürece hocanız tarafından görülebilir.</span></div>;
  return <div className="personal-record-share"><span className="personal-share-state"><LockKeyhole size={15} aria-hidden="true" /> {permission ? 'Bu kayıt hocanızla paylaşılıyor' : 'Bu kayıt yalnızca size açık'}</span><button type="button" className={`button ${permission ? 'secondary' : 'ghost'}`} disabled={pending} onClick={() => void toggle()}>{pending ? 'Güncelleniyor…' : permission ? 'Paylaşım iznini geri al' : 'Bu rüyayı hocamla paylaş'}</button></div>;
}

function DreamDialog({ mode, dream, mutate, onClose }: { mode: 'create' | 'edit'; dream?: Dream; mutate: Mutate; onClose: () => void }) {
  const [title, setTitle] = useState(dream?.title ?? '');
  const [narrative, setNarrative] = useState(dream?.narrative ?? '');
  const [date, setDate] = useState(dream?.date ?? localDateKey());
  const [wakingFeeling, setWakingFeeling] = useState(dream?.waking_feeling ?? '');
  const [dreamFeeling, setDreamFeeling] = useState(dream?.dream_feeling ?? '');
  const [personalNotes, setPersonalNotes] = useState(dream?.personal_notes ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError('');
    if (date > localDateKey()) { setError('Rüya tarihi gelecek bir gün olamaz.'); return; }
    setSaving(true);
    try {
      const payload = { title: title.trim(), narrative: narrative.trim(), date, waking_feeling: wakingFeeling.trim(), dream_feeling: dreamFeeling.trim(), personal_notes: personalNotes.trim() };
      const ok = dream ? await mutate('dreams', 'PATCH', payload, dream.id) : await mutate('dreams', 'POST', payload);
      if (ok) onClose();
    } finally { setSaving(false); }
  };
  return <PersonalDialog title={dream ? 'Rüya kaydını düzenle' : 'Rüyayı deftere al'} description="Bu kayıt sizindir. Paylaşım izinlerini ayrıca ve dilediğiniz zaman yönetebilirsiniz." onCloseAction={onClose} wide>
    <form className="personal-form" onSubmit={(event) => void save(event)}>
      <label className="field"><span>Başlık</span><input className="input" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={180} required autoFocus /></label>
      <label className="field"><span>Rüya tarihi</span><input className="input" type="date" value={date} max={localDateKey()} onChange={(event) => setDate(event.target.value)} required /></label>
      <label className="field"><span>Rüyanın anlatımı</span><textarea className="input" rows={7} maxLength={12000} value={narrative} onChange={(event) => setNarrative(event.target.value)} placeholder="Hatırladığınız kadarıyla…" required /></label>
      <div className="personal-form-row"><label className="field"><span>Uyandığınızda hissettiğiniz</span><input className="input" value={wakingFeeling} onChange={(event) => setWakingFeeling(event.target.value)} maxLength={240} placeholder="Örn. huzur, şaşkınlık…" /></label><label className="field"><span>Rüyadaki hisleriniz</span><input className="input" value={dreamFeeling} onChange={(event) => setDreamFeeling(event.target.value)} maxLength={240} placeholder="Örn. merak, korku…" /></label></div>
      <label className="field"><span>Kişisel notlar <small>(yalnızca size özel)</small></span><textarea className="input" rows={4} maxLength={5000} value={personalNotes} onChange={(event) => setPersonalNotes(event.target.value)} placeholder="Dilerseniz sonradan hatırlamak istedikleriniz…" /></label>
      {error && <p className="personal-form-error" role="alert">{error}</p>}
      <div className="personal-form-actions"><button type="button" className="button ghost" onClick={onClose}>Vazgeç</button><button type="submit" className="button" disabled={saving}>{saving ? 'Kaydediliyor…' : dream ? 'Değişiklikleri kaydet' : 'Özel kaydı sakla'}</button></div>
    </form>
  </PersonalDialog>;
}
