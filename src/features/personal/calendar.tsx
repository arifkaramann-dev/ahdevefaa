'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CircleCheck, CircleDashed, MoonStar, Sparkles } from 'lucide-react';
import type { WorkspaceData } from '@/lib/types';
import { addDays, addMonths, dateFromKey, dateKeyFromTimestamp, formatDate, localDateKey } from './utils';
import { EmptyState } from './shared';

const markerKinds = [
  { id: 'mood', label: 'Hâl', color: 'mood' },
  { id: 'prayer', label: 'Namaz', color: 'prayer' },
  { id: 'worship', label: 'İbadet', color: 'worship' },
  { id: 'wird', label: 'Vird', color: 'wird' },
  { id: 'dream', label: 'Rüya', color: 'dream' },
  { id: 'reflection', label: 'Muhasebe', color: 'reflection' },
] as const;

function markersFor(data: WorkspaceData, key: string) {
  return {
    mood: data.moods.some((item) => dateKeyFromTimestamp(item.recorded_at) === key),
    prayer: data.prayers.some((item) => item.date === key),
    worship: data.worships.some((item) => item.date === key),
    wird: data.wirdLogs.some((item) => item.date === key) || data.assignmentLogs.some((item) => item.date === key),
    dream: data.dreams.some((item) => item.date === key),
    reflection: data.reflections.some((item) => item.date === key),
  };
}

export function ManeviCalendar({ data, selectedDate, onSelectAction }: { data: WorkspaceData; selectedDate: string; onSelectAction: (date: string) => void }) {
  const [visibleMonth, setVisibleMonth] = useState(`${selectedDate.slice(0, 7)}-01`);
  useEffect(() => {
    if (visibleMonth.slice(0, 7) !== selectedDate.slice(0, 7)) setVisibleMonth(`${selectedDate.slice(0, 7)}-01`);
  }, [selectedDate, visibleMonth]);
  const gridDays = useMemo(() => {
    const firstDay = dateFromKey(visibleMonth);
    const offset = (firstDay.getDay() + 6) % 7;
    const start = addDays(visibleMonth, -offset);
    return Array.from({ length: 42 }, (_, index) => addDays(start, index));
  }, [visibleMonth]);
  const monthLabel = new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(dateFromKey(visibleMonth));
  const today = localDateKey();

  return (
    <section className="card personal-calendar-card" aria-labelledby="personal-calendar-title">
      <div className="personal-section-heading personal-calendar-heading">
        <div><p className="eyebrow">Geçmişe dönmek serbest</p><h2 id="personal-calendar-title" className="section-title">Manevî takvim</h2></div>
        <div className="personal-calendar-month-control"><button type="button" className="button ghost personal-icon-button" aria-label="Önceki ay" onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))}><ChevronLeft size={18} /></button><strong aria-live="polite">{monthLabel}</strong><button type="button" className="button ghost personal-icon-button" aria-label="Sonraki ay" disabled={visibleMonth.slice(0, 7) >= today.slice(0, 7)} onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}><ChevronRight size={18} /></button></div>
      </div>
      <div className="personal-calendar-grid" role="group" aria-label={`${monthLabel} takvimi`}>
        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day) => <span className="personal-calendar-weekday" key={day} aria-hidden="true">{day}</span>)}
        {gridDays.map((day) => {
          const key = day;
          const selected = key === selectedDate;
          const inMonth = key.slice(0, 7) === visibleMonth.slice(0, 7);
          const marks = markersFor(data, key);
          const labels = markerKinds.filter(({ id }) => marks[id]).map(({ label }) => label);
          return <button type="button" key={key} disabled={key > today} aria-label={`${formatDate(key)}${labels.length ? `; kayıt türleri: ${labels.join(', ')}` : '; kayıt yok'}`} aria-pressed={selected} className={`personal-calendar-day${selected ? ' personal-calendar-day-selected' : ''}${!inMonth ? ' personal-calendar-day-muted' : ''}${key === today ? ' personal-calendar-today' : ''}`} onClick={() => onSelectAction(key)}>
            <span>{dateFromKey(key).getDate()}</span>
            <i className="personal-calendar-dots" aria-hidden="true">{markerKinds.map(({ id, color }) => marks[id] ? <b className={`personal-marker personal-marker-${color}`} key={id} /> : null)}</i>
          </button>;
        })}
      </div>
      <div className="personal-calendar-legend" aria-label="Takvim işaretleri">{markerKinds.map(({ id, label, color }) => <span key={id}><i className={`personal-marker personal-marker-${color}`} aria-hidden="true" />{label}</span>)}</div>
    </section>
  );
}

export function SelectedDaySummary({ data, selectedDate }: { data: WorkspaceData; selectedDate: string }) {
  const moods = data.moods.filter((item) => dateKeyFromTimestamp(item.recorded_at) === selectedDate).sort((a, b) => a.recorded_at.localeCompare(b.recorded_at));
  const prayers = data.prayers.filter((item) => item.date === selectedDate);
  const worships = data.worships.filter((item) => item.date === selectedDate);
  const wirds = data.wirdLogs.filter((item) => item.date === selectedDate);
  const assignments = data.assignmentLogs.filter((item) => item.date === selectedDate);
  const dreams = data.dreams.filter((item) => item.date === selectedDate);
  const reflections = data.reflections.filter((item) => item.date === selectedDate);
  const total = moods.length + prayers.length + worships.length + wirds.length + assignments.length + dreams.length + reflections.length;

  return <section className="card personal-day-summary" aria-labelledby="personal-day-title">
    <p className="eyebrow">Seçili gün</p><h2 id="personal-day-title" className="section-title">{formatDate(selectedDate)}</h2>
    {!total ? <EmptyState title="Bu gün için henüz kayıt yok" icon={<Sparkles size={19} aria-hidden="true" />}>Takvimdeki bir başka güne dönebilir veya bu sayfadaki eylemlerden yeni bir kayıt ekleyebilirsiniz.</EmptyState> : <div className="personal-day-detail-list">
      {moods.length > 0 && <article className="personal-day-detail"><span className="personal-day-detail-mark personal-marker-mood" /><div><strong>Hâl kayıtları · {moods.length}</strong><ul>{moods.map((item) => <li key={item.id}><time dateTime={item.recorded_at}>{new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' }).format(new Date(item.recorded_at))}</time> · {item.mood}{item.note ? ` — ${item.note}` : ''}</li>)}</ul></div></article>}
      {prayers.length > 0 && <article className="personal-day-detail"><span className="personal-day-detail-mark personal-marker-prayer" /><div><strong>Namazlar</strong><ul>{prayers.map((item) => <li key={item.id}>{item.prayer} · {item.completed ? 'tamamlandı' : 'işaretlenmedi'}</li>)}</ul></div></article>}
      {worships.length > 0 && <article className="personal-day-detail"><span className="personal-day-detail-mark personal-marker-worship" /><div><strong>Diğer ibadetler</strong><ul>{worships.map((item) => <li key={item.id}>{item.name} · {item.amount} · {item.category === 'qaza' ? 'kaza' : item.category === 'nafile' ? 'nafile' : 'günlük'}{item.note ? ` — ${item.note}` : ''}</li>)}</ul></div></article>}
      {wirds.length > 0 && <article className="personal-day-detail"><span className="personal-day-detail-mark personal-marker-wird" /><div><strong>Vird kayıtları</strong><ul>{wirds.map((item) => <li key={item.id}>{data.wirds.find((wird) => wird.id === item.wird_id)?.name ?? 'Vird'} · {item.amount}</li>)}</ul></div></article>}
      {assignments.length > 0 && <article className="personal-day-detail"><span className="personal-day-detail-mark personal-marker-wird" /><div><strong>Hoca vazifeleri</strong><ul>{assignments.map((item) => <li key={item.id}>{data.assignments.find((assignment) => assignment.id === item.assignment_id)?.title ?? 'Vazife'} · {item.amount}</li>)}</ul></div></article>}
      {dreams.length > 0 && <article className="personal-day-detail"><span className="personal-day-detail-mark personal-marker-dream" /><div><strong>Rüya defteri</strong><ul>{dreams.map((item) => <li key={item.id}>{item.title}</li>)}</ul></div></article>}
      {reflections.length > 0 && <article className="personal-day-detail"><span className="personal-day-detail-mark personal-marker-reflection" /><div><strong>Muhasebe</strong><ul>{reflections.map((item) => <li key={item.id}>{Object.values(item.answers).filter(Boolean).length} yanıt{item.note ? ' ve kişisel not' : ''} · yalnızca size ait</li>)}</ul></div></article>}
    </div>}
    <div className="personal-day-links"><Link href="/journey">Hâl ve ibadetler</Link><Link href="/wirds">Virdler ve vazifeler</Link><Link href="/dreams">Rüya defteri</Link><Link href="/reflections">Muhasebe</Link></div>
  </section>;
}
