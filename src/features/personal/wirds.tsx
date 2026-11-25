'use client';

import { useMemo, useState } from 'react';
import { BookHeart, CalendarDays, ChevronLeft, ChevronRight, CirclePlus, Pencil, Plus, Target, Trash2 } from 'lucide-react';
import type { Assignment, AssignmentLog, Wird, WirdLog, WorkspaceData } from '@/lib/types';
import { EmptyState, PersonalDialog, type Mutate, PeriodSelect } from './shared';
import { addDays, bucketKey, countActivePeriods, dateFromKey, formatBucket, formatDate, inRange, localDateKey, periodBounds, type Period } from './utils';

const frequencies: { value: Wird['frequency']; label: string; short: string }[] = [
  { value: 'daily', label: 'Her gün', short: 'günlük' },
  { value: 'weekly', label: 'Her hafta', short: 'haftalık' },
  { value: 'monthly', label: 'Her ay', short: 'aylık' },
];

export function WirdsSection({ data, mutateAction }: { data: WorkspaceData; mutateAction: Mutate }) {
  const mutate = mutateAction;
  const [selectedDate, setSelectedDate] = useState(localDateKey());
  const [reportPeriod, setReportPeriod] = useState<Period>('week');
  const [wirdDialog, setWirdDialog] = useState<{ mode: 'create' | 'edit'; wird?: Wird } | null>(null);
  const [logDialog, setLogDialog] = useState<{ wird: Wird; log?: WirdLog } | null>(null);
  const [assignmentDialog, setAssignmentDialog] = useState<{ assignment: Assignment; log?: AssignmentLog } | null>(null);
  const today = localDateKey();
  const reportBounds = periodBounds(selectedDate, reportPeriod);
  const report = { start: reportBounds.start, end: reportBounds.end > today ? today : reportBounds.end };
  const selectedLogs = data.wirdLogs.filter((log) => log.date === selectedDate);
  const selectedAssignmentLogs = data.assignmentLogs.filter((log) => log.date === selectedDate);
  const reportWirds = useMemo(() => data.wirds.map((wird) => {
    const includesFrequency = reportPeriod === 'day' ? wird.frequency === 'daily' : reportPeriod === 'week' ? wird.frequency !== 'monthly' : true;
    const cycles = countActivePeriods(wird.frequency, wird.start_date, wird.end_date, report.start, report.end);
    const logs = data.wirdLogs.filter((log) => log.wird_id === wird.id && inRange(log.date, report.start, report.end));
    const actual = logs.reduce((sum, log) => sum + log.amount, 0);
    const expected = cycles * wird.target;
    const grouped = new Map<string, number>();
    logs.forEach((log) => { const bucket = bucketKey(log.date, reportPeriod); grouped.set(bucket, (grouped.get(bucket) ?? 0) + log.amount); });
    return { wird, cycles, actual, expected, grouped: [...grouped].sort(([a], [b]) => a.localeCompare(b)), includesFrequency };
  }), [data.wirdLogs, data.wirds, report.end, report.start, reportPeriod]);

  const removeWird = async (wird: Wird) => {
    if (!window.confirm(`“${wird.name}” virdini silmek istiyor musunuz?`)) return;
    await mutate('wirds', 'DELETE', {}, wird.id);
  };
  const removeWirdLog = async (log: WirdLog) => {
    if (!window.confirm('Bu vird miktar kaydını silmek istiyor musunuz?')) return;
    await mutate('wird_logs', 'DELETE', {}, log.id);
  };
  const removeAssignmentLog = async (log: AssignmentLog) => {
    if (!window.confirm('Bu vazife miktar kaydını silmek istiyor musunuz?')) return;
    await mutate('assignment_logs', 'DELETE', {}, log.id);
  };

  return <div className="personal-content-stack">
    <section className="personal-intro-strip"><span className="personal-intro-icon"><BookHeart size={19} aria-hidden="true" /></span><p>Vird hedefleri bir kıyas değil, kişisel bir niyettir. Bir günü kaçırmak kaydı ya da yolculuğunuzu eksiltmez.</p></section>

    <section className="card personal-panel" aria-labelledby="personal-wird-heading">
      <div className="personal-section-heading"><div><p className="eyebrow">Size ait vird defteri</p><h2 className="section-title" id="personal-wird-heading">Kişisel virdler</h2></div><button type="button" className="button" onClick={() => setWirdDialog({ mode: 'create' })}><CirclePlus size={17} aria-hidden="true" /> Vird ekle</button></div>
      <DateControl selectedDate={selectedDate} onChange={setSelectedDate} />
      {data.wirds.length ? <div className="personal-wird-list">{data.wirds.map((wird) => {
        const log = selectedLogs.find((item) => item.wird_id === wird.id);
        return <article className="personal-wird-card" key={wird.id}>
          <div className="personal-wird-card-head"><div><span className="personal-soft-badge">{frequencies.find((item) => item.value === wird.frequency)?.label}</span><h3>{wird.name}</h3></div><div className="personal-record-actions"><button type="button" className="button ghost personal-icon-button" aria-label={`${wird.name} virdini düzenle`} onClick={() => setWirdDialog({ mode: 'edit', wird })}><Pencil size={15} /></button><button type="button" className="button ghost personal-icon-button" aria-label={`${wird.name} virdini sil`} onClick={() => void removeWird(wird)}><Trash2 size={15} /></button></div></div>
          {wird.description && <p className="personal-wird-description">{wird.description}</p>}
          <div className="personal-wird-meta"><span><Target size={15} aria-hidden="true" /> Hedef: {wird.target} / {frequencies.find((item) => item.value === wird.frequency)?.short}</span><span><CalendarDays size={15} aria-hidden="true" /> {formatDate(wird.start_date)}{wird.end_date ? ` – ${formatDate(wird.end_date)}` : ' · açık uçlu'}</span></div>
          <div className="personal-wird-progress"><div><span>{formatDate(selectedDate, { day: 'numeric', month: 'long' })} kaydı</span><strong>{log?.amount ?? '—'} <small>/ {wird.target}</small></strong></div><div className="personal-record-actions"><button type="button" className="button secondary" onClick={() => setLogDialog({ wird, log })}>{log ? 'Miktarı düzenle' : 'Miktar kaydet'}</button>{log && <button type="button" className="button ghost personal-icon-button" aria-label={`${wird.name} virdinin ${formatDate(selectedDate)} miktar kaydını sil`} onClick={() => void removeWirdLog(log)}><Trash2 size={15} /></button>}</div></div>
        </article>;
      })}</div> : <EmptyState title="Kendi vird listenizi oluşturun" icon={<BookHeart size={20} aria-hidden="true" />}>Adını, tekrar hedefinizi ve başlangıç tarihinizi belirleyin. Hedefleriniz yalnızca size aittir.<div className="personal-empty-actions"><button type="button" className="button" onClick={() => setWirdDialog({ mode: 'create' })}>İlk virdi ekle</button></div></EmptyState>}
    </section>

    <section className="card personal-panel" aria-labelledby="personal-wird-report-heading">
      <div className="personal-section-heading"><div><p className="eyebrow">Gerçek kayıtlar</p><h2 className="section-title" id="personal-wird-report-heading">Vird raporu</h2></div><PeriodSelect value={reportPeriod} onChangeAction={setReportPeriod} label="Rapor dönemi" /></div>
      <DateControl selectedDate={selectedDate} onChange={setSelectedDate} />
      <p className="personal-helper-copy">Rapor {formatDate(report.start)}{report.start !== report.end ? ` – ${formatDate(report.end, { day: 'numeric', month: 'short' })}` : ''} aralığındaki kayıtlardır. Günlük görünüm günlük virdleri; haftalık görünüm günlük ve haftalık virdleri; aylık görünüm tüm sıklıkları gösterir. Hedef paydası, her virdin tekrar sıklığına göre hesaplanır; seri veya kayıp gün puanı oluşturulmaz.</p>
      {reportWirds.filter((item) => item.includesFrequency).length ? <div className="personal-report-list">{reportWirds.filter((item) => item.includesFrequency).map(({ wird, actual, expected, cycles, grouped }) => <article className="personal-report-row" key={wird.id}>
        <div className="personal-report-name"><strong>{wird.name}</strong><span>{frequencies.find((item) => item.value === wird.frequency)?.label} · {cycles} tekrar dönemi</span></div><div className="personal-report-total"><strong>{actual}</strong><span>/ {expected} hedef</span></div>
        <div className="personal-report-groups">{grouped.length ? grouped.map(([bucket, amount]) => <span key={bucket}>{formatBucket(bucket, reportPeriod)} · {amount}</span>) : <span>Bu aralıkta henüz miktar kaydı yok.</span>}{cycles === 0 && <span>Seçili dönem, virdin etkin tarihleri dışında.</span>}</div>
      </article>)}</div> : <EmptyState title="Bu rapor aralığına uygun vird yok">Başka bir dönemi seçebilir veya seçili tarihe yeni bir vird ekleyebilirsiniz.</EmptyState>}
    </section>

    <section className="card personal-panel personal-assignment-panel" aria-labelledby="personal-assignment-heading">
      <div className="personal-section-heading"><div><p className="eyebrow">Kişisel virdlerden ayrı</p><h2 className="section-title" id="personal-assignment-heading">Hocanızın vazifeleri</h2></div><span className="personal-soft-badge">Aşama 3 · görev düzenleme hocanızda</span></div>
      <p className="personal-helper-copy">Bu alanda sadece size verilen vazifelerin miktar kaydını tutabilirsiniz. Vazife tanımı veya hedefi bu ekrandan değiştirilmez.</p>
      {data.assignments.length ? <div className="personal-assignment-list">{data.assignments.map((assignment) => {
        const log = selectedAssignmentLogs.find((item) => item.assignment_id === assignment.id);
        return <article key={assignment.id} className="personal-assignment-card"><div><h3>{assignment.title}</h3>{assignment.description && <p>{assignment.description}</p>}<span className="personal-muted">{assignment.target ? `Hedef: ${assignment.target}` : 'Hedef belirtilmemiş'}{assignment.due_date ? ` · Son tarih: ${formatDate(assignment.due_date)}` : ''}</span></div><div className="personal-assignment-actions"><span className="personal-assignment-amount">{log?.amount ?? '—'}</span><button type="button" className="button secondary" onClick={() => setAssignmentDialog({ assignment, log })}>{log ? 'Kaydı düzenle' : 'Miktar kaydet'}</button>{log && <div className="personal-record-actions"><button type="button" className="button ghost personal-icon-button" aria-label={`${assignment.title} kaydını sil`} onClick={() => void removeAssignmentLog(log)}><Trash2 size={15} /></button></div>}</div></article>;
      })}</div> : <EmptyState title="Henüz bir vazife paylaşılmamış">Hocanızın verdiği vazifeler burada kişisel vird listenizden ayrı görünür.</EmptyState>}
    </section>

    {wirdDialog && <WirdDialog key={`${wirdDialog.mode}-${wirdDialog.wird?.id ?? 'new'}`} mode={wirdDialog.mode} wird={wirdDialog.wird} mutate={mutate} onClose={() => setWirdDialog(null)} />}
    {logDialog && <AmountDialog key={`${logDialog.wird.id}-${logDialog.log?.id ?? selectedDate}`} title={`${logDialog.wird.name} · miktar kaydı`} date={logDialog.log?.date ?? selectedDate} amount={logDialog.log?.amount} mutate={mutate} collection="wird_logs" data={{ wird_id: logDialog.wird.id }} entryId={logDialog.log?.id} onClose={() => setLogDialog(null)} />}
    {assignmentDialog && <AmountDialog key={`${assignmentDialog.assignment.id}-${assignmentDialog.log?.id ?? selectedDate}`} title={`${assignmentDialog.assignment.title} · miktar kaydı`} date={assignmentDialog.log?.date ?? selectedDate} amount={assignmentDialog.log?.amount} mutate={mutate} collection="assignment_logs" data={{ assignment_id: assignmentDialog.assignment.id }} entryId={assignmentDialog.log?.id} onClose={() => setAssignmentDialog(null)} />}
  </div>;
}

function DateControl({ selectedDate, onChange }: { selectedDate: string; onChange: (date: string) => void }) {
  const today = localDateKey();
  return <div className="personal-date-control"><button type="button" className="button ghost personal-icon-button" aria-label="Önceki gün" onClick={() => onChange(addDays(selectedDate, -1))}><ChevronLeft size={18} /></button><label className="field"><span className="sr-only">Rapor tarihi</span><input className="input" type="date" max={today} value={selectedDate} onChange={(event) => { if (event.target.value) onChange(event.target.value); }} /></label><button type="button" className="button ghost personal-icon-button" aria-label="Sonraki gün" disabled={selectedDate >= today} onClick={() => onChange(addDays(selectedDate, 1))}><ChevronRight size={18} /></button><span className="personal-date-long">{formatDate(selectedDate)}</span></div>;
}

function WirdDialog({ mode, wird, mutate, onClose }: { mode: 'create' | 'edit'; wird?: Wird; mutate: Mutate; onClose: () => void }) {
  const [name, setName] = useState(wird?.name ?? '');
  const [target, setTarget] = useState(String(wird?.target ?? 100));
  const [startDate, setStartDate] = useState(wird?.start_date ?? localDateKey());
  const [endDate, setEndDate] = useState(wird?.end_date ?? '');
  const [description, setDescription] = useState(wird?.description ?? '');
  const [frequency, setFrequency] = useState<Wird['frequency']>(wird?.frequency ?? 'daily');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError('');
    if (startDate > localDateKey()) { setError('Başlangıç tarihi gelecek bir gün olamaz.'); return; }
    if (endDate && endDate < startDate) { setError('Bitiş tarihi başlangıç tarihinden önce olamaz.'); return; }
    setSaving(true);
    try {
      const payload = { name: name.trim(), target: Number(target), start_date: startDate, end_date: endDate || null, description: description.trim(), frequency };
      const ok = wird ? await mutate('wirds', 'PATCH', payload, wird.id) : await mutate('wirds', 'POST', payload);
      if (ok) onClose();
    } finally { setSaving(false); }
  };
  return <PersonalDialog title={wird ? 'Virdi düzenle' : 'Yeni vird'} description="Hedefi kendi tekrar sıklığınıza göre belirleyin. Bu plan başkalarıyla kıyaslanmaz." onCloseAction={onClose}>
    <form className="personal-form" onSubmit={(event) => void save(event)}>
      <label className="field"><span>Virdin adı</span><input className="input" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required autoFocus /></label>
      <div className="personal-form-row"><label className="field"><span>Hedef miktarı</span><input className="input" type="number" min={1} max={1000000} step={1} value={target} onChange={(event) => setTarget(event.target.value)} required /></label><label className="field"><span>Tekrar sıklığı</span><select className="input" value={frequency} onChange={(event) => setFrequency(event.target.value as Wird['frequency'])}>{frequencies.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label></div>
      <p className="personal-form-hint">Hedef miktarı seçtiğiniz tekrar dönemi içindir. Örneğin haftalık sıklıkta hedef, hafta başına miktarı anlatır.</p>
      <div className="personal-form-row"><label className="field"><span>Başlangıç</span><input className="input" type="date" value={startDate} max={localDateKey()} onChange={(event) => setStartDate(event.target.value)} required /></label><label className="field"><span>Bitiş <small>(isteğe bağlı)</small></span><input className="input" type="date" value={endDate} min={startDate} onChange={(event) => setEndDate(event.target.value)} /></label></div>
      <label className="field"><span>Açıklama <small>(isteğe bağlı)</small></span><textarea className="input" rows={3} maxLength={1200} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
      {error && <p className="personal-form-error" role="alert">{error}</p>}
      <div className="personal-form-actions"><button type="button" className="button ghost" onClick={onClose}>Vazgeç</button><button type="submit" className="button" disabled={saving}>{saving ? 'Kaydediliyor…' : wird ? 'Değişiklikleri kaydet' : 'Virdi oluştur'}</button></div>
    </form>
  </PersonalDialog>;
}

function AmountDialog({ title, date: initialDate, amount: initialAmount, mutate, collection, data, entryId, onClose }: { title: string; date: string; amount?: number; mutate: Mutate; collection: 'wird_logs' | 'assignment_logs'; data: { wird_id?: string; assignment_id?: string }; entryId?: string; onClose: () => void }) {
  const [date, setDate] = useState(initialDate);
  const [amount, setAmount] = useState(String(initialAmount ?? 1));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError('');
    if (date > localDateKey()) { setError('Gelecek bir gün için miktar kaydedilemez.'); return; }
    setSaving(true);
    try {
      const payload = { ...data, date, amount: Number(amount) };
      const ok = entryId ? await mutate(collection, 'PATCH', payload, entryId) : await mutate(collection, 'POST', payload);
      if (ok) onClose();
    } finally { setSaving(false); }
  };
  return <PersonalDialog title={title} description="Gerçekleşen miktarı ekleyin. İbadet kaydı tutamadığınız bir gün için ayrıca açıklama vermeniz gerekmez." onCloseAction={onClose}>
    <form className="personal-form" onSubmit={(event) => void save(event)}>
      <label className="field"><span>Tarih</span><input className="input" type="date" value={date} max={localDateKey()} onChange={(event) => setDate(event.target.value)} required /></label>
      <label className="field"><span>Tamamlanan miktar</span><input className="input" type="number" min={1} max={1000000} step={1} value={amount} onChange={(event) => setAmount(event.target.value)} required /></label>
      {error && <p className="personal-form-error" role="alert">{error}</p>}
      <div className="personal-form-actions"><button type="button" className="button ghost" onClick={onClose}>Vazgeç</button><button type="submit" className="button" disabled={saving}>{saving ? 'Kaydediliyor…' : entryId ? 'Değişiklikleri kaydet' : 'Miktarı sakla'}</button></div>
    </form>
  </PersonalDialog>;
}
