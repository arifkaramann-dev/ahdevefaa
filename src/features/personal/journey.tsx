'use client';

import { useMemo, useState } from 'react';
import { CalendarClock, Check, ChevronLeft, ChevronRight, CirclePlus, Clock3, Heart, Pencil, Plus, Trash2 } from 'lucide-react';
import { MOODS, PRAYERS, type MoodEntry, type WorkspaceData, type WorshipEntry } from '@/lib/types';
import { ManeviCalendar, SelectedDaySummary } from './calendar';
import { EmptyState, PersonalDialog, PrivacyPermissionToggle, type Mutate, PeriodSelect } from './shared';
import { addDays, dateKeyFromTimestamp, dateTimeToIso, formatDate, inRange, localDateKey, localDateTimeValue, periodBounds, type Period } from './utils';

const worshipCategories = [
  { value: 'daily', label: 'Günlük ibadet' },
  { value: 'qaza', label: 'Kaza' },
  { value: 'nafile', label: 'Nafile' },
] as const;

export function JourneySection({ data, mutateAction }: { data: WorkspaceData; mutateAction: Mutate }) {
  const mutate = mutateAction;
  const [selectedDate, setSelectedDate] = useState(localDateKey());
  const [moodPeriod, setMoodPeriod] = useState<Period>('day');
  const [moodDialog, setMoodDialog] = useState<{ mode: 'create' | 'edit'; entry?: MoodEntry } | null>(null);
  const [worshipDialog, setWorshipDialog] = useState<{ mode: 'create' | 'edit'; entry?: WorshipEntry } | null>(null);
  const [worshipCategory, setWorshipCategory] = useState<'all' | WorshipEntry['category']>('all');
  const [pendingPrayer, setPendingPrayer] = useState<string | null>(null);
  const today = localDateKey();
  const selectedPrayers = data.prayers.filter((entry) => entry.date === selectedDate);
  const selectedWorships = data.worships.filter((entry) => entry.date === selectedDate && (worshipCategory === 'all' || entry.category === worshipCategory));
  const moodRange = periodBounds(selectedDate, moodPeriod);
  const filteredMoods = useMemo(() => data.moods
    .filter((entry) => inRange(dateKeyFromTimestamp(entry.recorded_at), moodRange.start, moodRange.end))
    .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at)), [data.moods, moodRange.start, moodRange.end]);
  const hourGroups = useMemo(() => {
    const dayEntries = data.moods.filter((entry) => dateKeyFromTimestamp(entry.recorded_at) === selectedDate).sort((a, b) => a.recorded_at.localeCompare(b.recorded_at));
    const groups = new Map<number, MoodEntry[]>();
    dayEntries.forEach((entry) => {
      const hour = new Date(entry.recorded_at).getHours();
      groups.set(hour, [...(groups.get(hour) ?? []), entry]);
    });
    return groups;
  }, [data.moods, selectedDate]);
  const customNames = useMemo(() => [...new Set(data.worships.map((entry) => entry.name.trim()).filter(Boolean))], [data.worships]);

  const togglePrayer = async (prayer: string) => {
    if (pendingPrayer) return;
    const existing = selectedPrayers.find((entry) => entry.prayer === prayer);
    setPendingPrayer(prayer);
    try {
      if (existing) await mutate('prayer_entries', 'PATCH', { date: selectedDate, prayer, completed: !existing.completed }, existing.id);
      else await mutate('prayer_entries', 'POST', { date: selectedDate, prayer, completed: true });
    } finally { setPendingPrayer(null); }
  };
  const deleteMood = async (entry: MoodEntry) => {
    if (!window.confirm('Bu hâl kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;
    await mutate('mood_entries', 'DELETE', {}, entry.id);
  };
  const deleteWorship = async (entry: WorshipEntry) => {
    if (!window.confirm('Bu ibadet kaydını silmek istediğinize emin misiniz?')) return;
    await mutate('worship_entries', 'DELETE', {}, entry.id);
  };

  return <div className="personal-content-stack">
    <section className="personal-intro-strip">
      <span className="personal-intro-icon"><Heart size={19} aria-hidden="true" /></span>
      <p>Her kayıt bir izdir; eksik kalan günler için biriktirmeniz gereken bir şey yok. İstediğiniz tarihe dönüp devam edebilirsiniz.</p>
    </section>

    <div className="personal-journey-grid">
      <div className="personal-main-column">
        <section className="card personal-panel" aria-labelledby="personal-mood-heading">
          <div className="personal-section-heading"><div><p className="eyebrow">Hâliniz · saatli kayıt</p><h2 className="section-title" id="personal-mood-heading">Günün 24 saati</h2></div><button type="button" className="button" onClick={() => setMoodDialog({ mode: 'create' })}><CirclePlus size={17} aria-hidden="true" /> Hâl kaydı ekle</button></div>
          <DateControl selectedDate={selectedDate} onChange={setSelectedDate} />
          <p className="personal-helper-copy">Her saat dilimi yerini korur. Bir saatte birden fazla kayıt ekleyebilir, geçmiş kayıtlarınızı düzenleyebilir veya silebilirsiniz.</p>
          <ol className="personal-hour-timeline" aria-label={`${formatDate(selectedDate)} için 24 saatlik hâl çizelgesi`}>
            {Array.from({ length: 24 }, (_, hour) => {
              const entries = hourGroups.get(hour) ?? [];
              return <li className={`personal-hour-row${entries.length ? ' personal-hour-has-entry' : ''}`} key={hour}>
                <time className="personal-hour-label">{String(hour).padStart(2, '0')}:00</time><span className="personal-hour-line" aria-hidden="true"><i /></span>
                <div className="personal-hour-events">{entries.length ? entries.map((entry) => <article className="personal-mood-record" key={entry.id}>
                  <div className="personal-record-main"><time dateTime={entry.recorded_at}>{new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' }).format(new Date(entry.recorded_at))}</time><strong>{entry.mood}</strong>{entry.note && <p>{entry.note}</p>}</div>
                  <div className="personal-record-actions"><button type="button" className="button ghost personal-icon-button" aria-label={`${entry.mood} kaydını düzenle`} onClick={() => setMoodDialog({ mode: 'edit', entry })}><Pencil size={15} /></button><button type="button" className="button ghost personal-icon-button" aria-label={`${entry.mood} kaydını sil`} onClick={() => void deleteMood(entry)}><Trash2 size={15} /></button></div>
                </article>) : <span className="personal-hour-empty" aria-label={`${hour}. saatte kayıt yok`} />}</div>
              </li>;
            })}
          </ol>
        </section>

        <section className="card personal-panel" aria-labelledby="personal-prayers-heading">
          <div className="personal-section-heading"><div><p className="eyebrow">Vakit vakit</p><h2 className="section-title" id="personal-prayers-heading">Beş vakit namaz</h2></div><span className="personal-soft-badge">{selectedPrayers.filter((item) => item.completed).length} / 5 tamamlandı</span></div>
          <p className="personal-helper-copy">Seçili güne ait durumu işaretleyin. Daha önceki günlere de dönebilirsiniz.</p>
          <div className="personal-prayer-list">{PRAYERS.map((prayer) => {
            const record = selectedPrayers.find((item) => item.prayer === prayer);
            const completed = Boolean(record?.completed);
            return <button type="button" key={prayer} className={`personal-prayer-toggle${completed ? ' personal-prayer-complete' : ''}`} aria-pressed={completed} disabled={pendingPrayer === prayer} onClick={() => void togglePrayer(prayer)}>
              <span className="personal-prayer-check">{completed ? <Check size={18} aria-hidden="true" /> : <i aria-hidden="true" />}</span><span><strong>{prayer}</strong><small>{completed ? 'Tamamlandı' : 'Durum eklemek için dokunun'}</small></span>
            </button>;
          })}</div>
        </section>

        <section className="card personal-panel" aria-labelledby="personal-worship-heading">
          <div className="personal-section-heading"><div><p className="eyebrow">Kendi listeniz</p><h2 className="section-title" id="personal-worship-heading">Diğer ibadetler</h2></div><button type="button" className="button secondary" onClick={() => setWorshipDialog({ mode: 'create' })}><Plus size={16} aria-hidden="true" /> İbadet ekle</button></div>
          <div className="personal-filter-row"><label className="field"><span>Kategori</span><select className="input" value={worshipCategory} onChange={(event) => setWorshipCategory(event.target.value as typeof worshipCategory)}><option value="all">Tümü</option>{worshipCategories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><span className="personal-muted">{formatDate(selectedDate)} · {selectedWorships.length} kayıt</span></div>
          {selectedWorships.length ? <div className="personal-record-list">{selectedWorships.map((entry) => <article key={entry.id} className="personal-list-record"><span className="personal-list-record-mark personal-marker-worship" /><div className="personal-record-main"><strong>{entry.name}</strong><p>{entry.amount} tekrar · {worshipCategories.find((item) => item.value === entry.category)?.label}{entry.note ? ` · ${entry.note}` : ''}</p></div><div className="personal-record-actions"><button type="button" className="button ghost personal-icon-button" aria-label={`${entry.name} kaydını düzenle`} onClick={() => setWorshipDialog({ mode: 'edit', entry })}><Pencil size={15} /></button><button type="button" className="button ghost personal-icon-button" aria-label={`${entry.name} kaydını sil`} onClick={() => void deleteWorship(entry)}><Trash2 size={15} /></button></div></article>)}</div> : <EmptyState title="Bu gün için ibadet kaydı yok"><button type="button" className="personal-inline-action" onClick={() => setWorshipDialog({ mode: 'create' })}>İlk ibadet kaydınızı ekleyin</button> veya başka bir güne dönün.</EmptyState>}
        </section>
      </div>
      <aside className="personal-side-column">
        <section className="card personal-mood-period" aria-labelledby="personal-mood-period-title">
          <div className="personal-section-heading"><div><p className="eyebrow">Geriye bakış</p><h2 className="section-title" id="personal-mood-period-title">Hâl kayıtlarınız</h2></div><Clock3 size={19} aria-hidden="true" /></div>
          <div className="personal-period-controls"><PeriodSelect value={moodPeriod} onChangeAction={setMoodPeriod} /><span className="personal-soft-badge">{filteredMoods.length} kayıt</span></div>
          <p className="personal-muted">{formatDate(moodRange.start)}{moodRange.start !== moodRange.end ? ` – ${formatDate(moodRange.end, { day: 'numeric', month: 'short' })}` : ''}</p>
          {filteredMoods.length ? <ol className="personal-mood-list">{filteredMoods.map((entry) => <li key={entry.id}><span className="personal-mood-list-dot" /><div><strong>{entry.mood}</strong><p>{formatDate(dateKeyFromTimestamp(entry.recorded_at), { day: 'numeric', month: 'short' })} · {new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' }).format(new Date(entry.recorded_at))}{entry.note ? ` · ${entry.note}` : ''}</p></div></li>)}</ol> : <EmptyState title="Bu dönemde kayıt yok">Günlük, haftalık veya aylık görünümü seçebilirsiniz.</EmptyState>}
          <div className="personal-private-note">Kayıtlarınız size özeldir.</div>
          <PrivacyPermissionToggle module="mood_entries" label="Hâl kayıtları" permissions={data.permissions} connection={data.connection} mutateAction={mutate} />
        </section>
        <ManeviCalendar data={data} selectedDate={selectedDate} onSelectAction={setSelectedDate} />
        <SelectedDaySummary data={data} selectedDate={selectedDate} />
      </aside>
    </div>

    {moodDialog && <MoodDialog key={`${moodDialog.mode}-${moodDialog.entry?.id ?? selectedDate}`} mode={moodDialog.mode} entry={moodDialog.entry} selectedDate={selectedDate} mutate={mutate} onClose={() => setMoodDialog(null)} />}
    {worshipDialog && <WorshipDialog key={`${worshipDialog.mode}-${worshipDialog.entry?.id ?? selectedDate}`} mode={worshipDialog.mode} entry={worshipDialog.entry} selectedDate={selectedDate} customNames={customNames} mutate={mutate} onClose={() => setWorshipDialog(null)} />}
  </div>;
}

function DateControl({ selectedDate, onChange }: { selectedDate: string; onChange: (date: string) => void }) {
  const today = localDateKey();
  return <div className="personal-date-control"><button type="button" className="button ghost personal-icon-button" aria-label="Önceki gün" onClick={() => onChange(addDays(selectedDate, -1))}><ChevronLeft size={18} /></button><label className="field"><span className="sr-only">Seçili gün</span><input className="input" type="date" value={selectedDate} max={today} onChange={(event) => { if (event.target.value) onChange(event.target.value); }} /></label><button type="button" className="button ghost personal-icon-button" aria-label="Sonraki gün" disabled={selectedDate >= today} onClick={() => onChange(addDays(selectedDate, 1))}><ChevronRight size={18} /></button><span className="personal-date-long">{formatDate(selectedDate)}</span></div>;
}

function MoodDialog({ mode, entry, selectedDate, mutate, onClose }: { mode: 'create' | 'edit'; entry?: MoodEntry; selectedDate: string; mutate: Mutate; onClose: () => void }) {
  const current = localDateTimeValue();
  const initial = entry ? localDateTimeValue(new Date(entry.recorded_at)) : localDateTimeValue(new Date(`${selectedDate}T${current.slice(11, 16)}`));
  const [recordedAt, setRecordedAt] = useState(initial);
  const [mood, setMood] = useState(entry?.mood ?? MOODS[0]);
  const [note, setNote] = useState(entry?.note ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError('');
    if (!recordedAt || new Date(recordedAt).getTime() > Date.now()) { setError('Gelecekteki bir zaman için kayıt eklenemez.'); return; }
    setSaving(true);
    try {
      const payload = { mood, note: note.trim(), recorded_at: dateTimeToIso(recordedAt) };
      const ok = entry ? await mutate('mood_entries', 'PATCH', payload, entry.id) : await mutate('mood_entries', 'POST', payload);
      if (ok) onClose();
    } finally { setSaving(false); }
  };
  return <PersonalDialog title={entry ? 'Hâl kaydını düzenle' : 'Yeni hâl kaydı'} description="Duygunuzu seçin; tarih ve saat kayda eklenecektir." onCloseAction={onClose}>
    <form className="personal-form" onSubmit={(event) => void save(event)}>
      <label className="field"><span>Hâliniz</span><select className="input" value={mood} onChange={(event) => setMood(event.target.value)} required>{MOODS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <label className="field"><span>Tarih ve saat</span><input className="input" type="datetime-local" value={recordedAt} max={current} onChange={(event) => setRecordedAt(event.target.value)} required /></label>
      <label className="field"><span>Kısa not <small>(isteğe bağlı)</small></span><textarea className="input" rows={4} maxLength={1600} value={note} onChange={(event) => setNote(event.target.value)} placeholder="İsterseniz o ana dair birkaç kelime…" /></label>
      {error && <p className="personal-form-error" role="alert">{error}</p>}
      <div className="personal-form-actions"><button type="button" className="button ghost" onClick={onClose}>Vazgeç</button><button type="submit" className="button" disabled={saving}>{saving ? 'Kaydediliyor…' : entry ? 'Değişiklikleri kaydet' : 'Kaydı sakla'}</button></div>
    </form>
  </PersonalDialog>;
}

function WorshipDialog({ mode, entry, selectedDate, customNames, mutate, onClose }: { mode: 'create' | 'edit'; entry?: WorshipEntry; selectedDate: string; customNames: string[]; mutate: Mutate; onClose: () => void }) {
  const [name, setName] = useState(entry?.name ?? '');
  const [category, setCategory] = useState<WorshipEntry['category']>(entry?.category ?? 'daily');
  const [date, setDate] = useState(entry?.date ?? selectedDate);
  const [amount, setAmount] = useState(String(entry?.amount ?? 1));
  const [note, setNote] = useState(entry?.note ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError('');
    if (date > localDateKey()) { setError('Gelecek bir gün için kayıt eklenemez.'); return; }
    setSaving(true);
    try {
      const payload = { name: name.trim(), category, date, amount: Number(amount), note: note.trim() };
      const ok = entry ? await mutate('worship_entries', 'PATCH', payload, entry.id) : await mutate('worship_entries', 'POST', payload);
      if (ok) onClose();
    } finally { setSaving(false); }
  };
  return <PersonalDialog title={entry ? 'İbadet kaydını düzenle' : 'İbadet kaydı ekle'} description="Sık kullandığınız ibadet adları sonraki kayıtlarda öneri olarak görünür." onCloseAction={onClose}>
    <form className="personal-form" onSubmit={(event) => void save(event)}>
      <label className="field"><span>İbadetin adı</span><input className="input" list="personal-worship-names" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} placeholder="Örn. Kur'an okuma, dua, salavat…" required /><datalist id="personal-worship-names">{['Kur’an okuma', 'Dua', 'Salavat', 'İstiğfar', ...customNames].map((item) => <option value={item} key={item} />)}</datalist></label>
      <div className="personal-form-row"><label className="field"><span>Kategori</span><select className="input" value={category} onChange={(event) => setCategory(event.target.value as WorshipEntry['category'])}>{worshipCategories.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label><label className="field"><span>Miktar</span><input className="input" type="number" min={1} max={1000000} step={1} value={amount} onChange={(event) => setAmount(event.target.value)} required /></label></div>
      <label className="field"><span>Tarih</span><input className="input" type="date" value={date} max={localDateKey()} onChange={(event) => setDate(event.target.value)} required /></label>
      <label className="field"><span>Not <small>(isteğe bağlı)</small></span><textarea className="input" rows={3} maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} /></label>
      {error && <p className="personal-form-error" role="alert">{error}</p>}
      <div className="personal-form-actions"><button type="button" className="button ghost" onClick={onClose}>Vazgeç</button><button type="submit" className="button" disabled={saving}>{saving ? 'Kaydediliyor…' : entry ? 'Değişiklikleri kaydet' : 'Kaydı ekle'}</button></div>
    </form>
  </PersonalDialog>;
}
