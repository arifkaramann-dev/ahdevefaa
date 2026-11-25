'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { BookOpen, Check, LockKeyhole, X } from 'lucide-react';
import type { Connection, Permission, Collection } from '@/lib/types';
import type { Period } from './utils';

export type Mutate = (collection: Collection, method: 'POST' | 'PATCH' | 'DELETE', data: Record<string, unknown>, id?: string) => Promise<boolean>;

export function PersonalDialog({
  title,
  description,
  children,
  onCloseAction,
  wide = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onCloseAction: () => void;
  wide?: boolean;
}) {
  const dialogRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef(onCloseAction);
  useEffect(() => { closeRef.current = onCloseAction; }, [onCloseAction]);
  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    const focusable = () => dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])') ?? [];
    (dialog?.querySelector<HTMLElement>('[autofocus]') ?? focusable()[0])?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); return; }
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) { event.preventDefault(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog?.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !dialog?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); previousFocus?.focus(); };
  }, []);
  return (
    <div className="personal-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeRef.current(); }}>
      <section ref={dialogRef} className={`personal-dialog${wide ? ' personal-dialog-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="personal-dialog-title" aria-describedby={description ? 'personal-dialog-description' : undefined}>
        <div className="personal-dialog-heading">
          <div>
            <h2 id="personal-dialog-title">{title}</h2>
            {description && <p id="personal-dialog-description">{description}</p>}
          </div>
          <button type="button" className="button ghost personal-icon-button" onClick={onCloseAction} aria-label="Pencereyi kapat"><X size={18} /></button>
        </div>
        {children}
      </section>
    </div>
  );
}

export function EmptyState({ title, children, icon = <BookOpen size={20} aria-hidden="true" /> }: { title: string; children: ReactNode; icon?: ReactNode }) {
  return <div className="personal-empty"><span className="personal-empty-icon">{icon}</span><div><h3>{title}</h3><div className="personal-empty-copy">{children}</div></div></div>;
}

export function PeriodSelect({ value, onChangeAction, label = 'Görünüm' }: { value: Period; onChangeAction: (value: Period) => void; label?: string }) {
  return (
    <label className="field personal-period-select">
      <span>{label}</span>
      <select className="input" value={value} onChange={(event) => onChangeAction(event.target.value as Period)}>
        <option value="day">Günlük</option><option value="week">Haftalık</option><option value="month">Aylık</option>
      </select>
    </label>
  );
}

export function PrivacyPermissionToggle({
  module,
  label,
  permissions,
  connection,
  mutateAction,
}: {
  module: 'dreams' | 'mood_entries' | 'self_reflections';
  label: string;
  permissions: Permission[];
  connection: Connection | null;
  mutateAction: Mutate;
}) {
  const [pending, setPending] = useState(false);
  const relationActive = Boolean(connection?.active);
  const activePermission = relationActive
    ? permissions.find((item) => item.module === module && item.record_id === null && item.teacher_id === connection?.teacher_id)
    : undefined;
  const toggle = async () => {
    if (!relationActive || pending) return;
    const message = activePermission
      ? `Hocanızın ${label} bölümüne verdiğiniz erişimi kaldırmak istiyor musunuz?`
      : `${label} bölümündeki mevcut ve gelecekteki kayıtlarınız seçili hocanızla paylaşılacak. Bu izni istediğiniz zaman geri alabilirsiniz. Devam edilsin mi?`;
    if (!window.confirm(message)) return;
    setPending(true);
    try {
      if (activePermission) await mutateAction('privacy_permissions', 'DELETE', {}, activePermission.id);
      else await mutateAction('privacy_permissions', 'POST', { teacher_id: connection!.teacher_id, module, record_id: null });
    } finally { setPending(false); }
  };

  return (
    <aside className="personal-privacy-card" aria-label={`${label} paylaşım ayarları`}>
      <span className="personal-privacy-icon"><LockKeyhole size={18} aria-hidden="true" /></span>
      <div className="personal-privacy-copy">
        <strong>{activePermission ? `${label} paylaşımı açık` : 'Bu bölüm yalnızca size ait'}</strong>
        <p>{activePermission ? 'Bu bölümdeki kayıtlarınız, gelecekte ekleyecekleriniz dâhil, seçili hocanızla paylaşılır.' : 'Paylaşım isteğe bağlıdır; tüm kayıtlar varsayılan olarak size özeldir.'}</p>
        {!relationActive && <p className="personal-muted">Aktif bir hoca bağlantısı bulunmadığı için paylaşım şu an kapalı.</p>}
      </div>
      <button type="button" className={`button ${activePermission ? 'secondary' : 'ghost'}`} disabled={!relationActive || pending} onClick={() => void toggle()}>
        {activePermission ? <><Check size={16} aria-hidden="true" /> İzni geri al</> : 'Hocamla paylaş'}
      </button>
    </aside>
  );
}
