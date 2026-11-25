'use client';

import { useMemo, useState } from 'react';
import { ClipboardCheck, Pencil, Plus, Trash2 } from 'lucide-react';
import { REFLECTION_QUESTIONS, type Question, type Reflection, type WorkspaceData } from '@/lib/types';
import { EmptyState, PersonalDialog, PrivacyPermissionToggle, type Mutate } from './shared';
import { addDays, formatDate, localDateKey } from './utils';

export function ReflectionsSection({ data, mutateAction }: { data: WorkspaceData; mutateAction: Mutate }) {
  const mutate = mutateAction;
  const [selectedDate, setSelectedDate] = useState(localDateKey());
  const [questionDialog, setQuestionDialog] = useState<{ mode: 'create' | 'edit'; question?: Question } | null>(null);
  const [filter, setFilter] = useState<'all' | 'built-in' | 'mine'>('all');
  const reflection = data.reflections.find((item) => item.date === selectedDate);
  const questionItems = useMemo(() => {
    const defaults = REFLECTION_QUESTIONS.map((question) => ({ key: question, question, source: 'built-in' as const }));
    const custom = data.questions.map((item) => ({ key: `own:${item.id}`, question: item.question, source: 'mine' as const, item }));
    return [...defaults, ...custom].filter((item) => filter === 'all' || item.source === filter);
  }, [data.questions, filter]);
  const removeReflection = async () => {
    if (!reflection || !window.confirm(`${formatDate(selectedDate)} tarihli muhasebe kaydınızı silmek istiyor musunuz?`)) return;
    await mutate('self_reflections', 'DELETE', {}, reflection.id);
  };
  const removeQuestion = async (question: Question) => {
    if (!window.confirm(`“${question.question}” sorusunu silmek istiyor musunuz? Mevcut muhasebe yanıtları etkilenmez, ancak soru artık yeni formlarda görünmez.`)) return;
    await mutate('reflection_questions', 'DELETE', {}, question.id);
  };

  return <div className="personal-content-stack">
    <section className="personal-intro-strip"><span className="personal-intro-icon"><ClipboardCheck size={19} aria-hidden="true" /></span><p>Muhasebe, kendinize karşı şefkatli bir dürüstlük alanıdır. Yanıtlamadığınız sorular için açıklama yapmanız gerekmez.</p></section>
    <section className="personal-reflection-layout">
      <div className="personal-main-column">
        <section className="card personal-panel" aria-labelledby="personal-reflection-heading">
          <div className="personal-section-heading"><div><p className="eyebrow">Günün muhasebesi</p><h2 className="section-title" id="personal-reflection-heading">Biraz kendinize dönün</h2></div>{reflection && <button type="button" className="button ghost personal-icon-button" onClick={() => void removeReflection()} aria-label="Bu günün muhasebe kaydını sil"><Trash2 size={16} /></button>}</div>
          <DateControl selectedDate={selectedDate} onChange={setSelectedDate} />
          <PrivacyPermissionToggle module="self_reflections" label="Muhasebe kayıtları" permissions={data.permissions} connection={data.connection} mutateAction={mutate} />
          <ReflectionEditor key={`${selectedDate}-${reflection?.id ?? 'new'}`} selectedDate={selectedDate} reflection={reflection} questions={questionItems} mutate={mutate} />
        </section>
      </div>
      <aside className="personal-side-column">
        <section className="card personal-question-panel" aria-labelledby="personal-question-heading">
          <div className="personal-section-heading"><div><p className="eyebrow">Altı başlangıç sorusu</p><h2 id="personal-question-heading" className="section-title">Sorularınız</h2></div><button type="button" className="button secondary" onClick={() => setQuestionDialog({ mode: 'create' })}><Plus size={16} aria-hidden="true" /> Kendi sorunuzu ekleyin</button></div>
          <label className="field"><span>Soru listesi</span><select className="input" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}><option value="all">Başlangıç ve kendi sorularım</option><option value="built-in">Başlangıç soruları</option><option value="mine">Kendi sorularım</option></select></label>
          <ol className="personal-question-list">{questionItems.length ? questionItems.map((item) => <li key={item.key}><span>{item.question}</span>{item.source === 'mine' && item.item && <span className="personal-question-actions"><button type="button" className="button ghost personal-icon-button" aria-label={`“${item.question}” sorusunu düzenle`} onClick={() => setQuestionDialog({ mode: 'edit', question: item.item })}><Pencil size={14} /></button><button type="button" className="button ghost personal-icon-button" aria-label={`“${item.question}” sorusunu sil`} onClick={() => void removeQuestion(item.item!)}><Trash2 size={14} /></button></span>}</li>) : <li className="personal-question-empty">Kendi sorunuzu oluşturduğunuzda burada görünecek.</li>}</ol>
          <p className="personal-helper-copy">Başlangıç soruları: “Bugün nefsime nerede yenildim?”, “Kime karşı kırıcı oldum?”, “Bugün neye şükrettim?”, “Hangi davranışımı düzeltmeliyim?”, “Bugün kendimde neyi fark ettim?” ve “Yarın neyi değiştirmek istiyorum?”</p>
        </section>
        <section className="personal-reflection-private"><p className="eyebrow">Mahremiyet</p><p>Kayıtlarınız varsayılan olarak yalnızca size açıktır. Bir hoca erişimini ayrıca, açıkça seçmediğiniz sürece paylaşım yapılmaz.</p></section>
      </aside>
    </section>
    {questionDialog && <QuestionDialog key={`${questionDialog.mode}-${questionDialog.question?.id ?? 'new'}`} mode={questionDialog.mode} question={questionDialog.question} existing={data.questions} mutate={mutate} onClose={() => setQuestionDialog(null)} />}
  </div>;
}

type QuestionItem = { key: string; question: string; source: 'built-in' | 'mine'; item?: Question };

function ReflectionEditor({ selectedDate, reflection, questions, mutate }: { selectedDate: string; reflection?: Reflection; questions: QuestionItem[]; mutate: Mutate }) {
  const [answers, setAnswers] = useState<Record<string, string>>(reflection?.answers ?? {});
  const [note, setNote] = useState(reflection?.note ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError('');
    if (selectedDate > localDateKey()) { setError('Gelecek bir gün için muhasebe kaydı oluşturulamaz.'); return; }
    const cleanAnswers = Object.fromEntries(Object.entries(answers).map(([key, value]) => [key, value.trim()]).filter(([, value]) => Boolean(value)));
    if (!Object.keys(cleanAnswers).length && !note.trim()) { setError('En az bir soruya yanıt verin veya kişisel notunuza birkaç kelime bırakın.'); return; }
    setSaving(true);
    try {
      const payload = { date: selectedDate, answers: cleanAnswers, note: note.trim() };
      const ok = reflection ? await mutate('self_reflections', 'PATCH', payload, reflection.id) : await mutate('self_reflections', 'POST', payload);
      if (ok) setError('Kayıt saklandı. Dilerseniz yanıtlarınızı güncellemeye devam edebilirsiniz.');
    } finally { setSaving(false); }
  };
  return <form className="personal-form personal-reflection-form" onSubmit={(event) => void save(event)}>
    <p className="personal-helper-copy">{formatDate(selectedDate)} için yanıtlarınız bu tarih altında saklanır. Boş bıraktığınız alanlar kayda eklenmez.</p>
    {questions.length ? questions.map((item, index) => <label className="field personal-reflection-question" key={item.key}><span><i>{String(index + 1).padStart(2, '0')}</i>{item.question}{item.source === 'mine' && <small> · sizin sorunuz</small>}</span><textarea className="input" rows={3} maxLength={3000} value={answers[item.key] ?? ''} onChange={(event) => setAnswers((current) => ({ ...current, [item.key]: event.target.value }))} placeholder="Yalnızca yazmak istediğiniz kadar…" /></label>) : <EmptyState title="Bu filtrede soru yok">Başka bir filtre seçin veya kendi sorunuzu ekleyin.</EmptyState>}
    <label className="field"><span>Kişisel not <small>(isteğe bağlı)</small></span><textarea className="input" rows={5} maxLength={6000} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Gününüzden geriye kalan…" /></label>
    {error && <p className={error.startsWith('Kayıt saklandı') ? 'personal-form-success' : 'personal-form-error'} role={error.startsWith('Kayıt saklandı') ? 'status' : 'alert'}>{error}</p>}
    <div className="personal-form-actions personal-reflection-actions"><span className="personal-muted">{reflection ? 'Var olan günlük kayıt güncellenecek.' : 'Henüz bu gün için kayıt yok.'}</span><button type="submit" className="button" disabled={saving}>{saving ? 'Kaydediliyor…' : reflection ? 'Muhasebeyi güncelle' : 'Günün muhasebesini sakla'}</button></div>
  </form>;
}

function DateControl({ selectedDate, onChange }: { selectedDate: string; onChange: (date: string) => void }) {
  const today = localDateKey();
  return <div className="personal-date-control"><button type="button" className="button ghost personal-icon-button" aria-label="Önceki gün" onClick={() => onChange(addDays(selectedDate, -1))}><span aria-hidden="true">‹</span></button><label className="field"><span className="sr-only">Muhasebe tarihi</span><input className="input" type="date" value={selectedDate} max={today} onChange={(event) => { if (event.target.value) onChange(event.target.value); }} /></label><button type="button" className="button ghost personal-icon-button" aria-label="Sonraki gün" disabled={selectedDate >= today} onClick={() => onChange(addDays(selectedDate, 1))}><span aria-hidden="true">›</span></button><span className="personal-date-long">{formatDate(selectedDate)}</span></div>;
}

function QuestionDialog({ mode, question, existing, mutate, onClose }: { mode: 'create' | 'edit'; question?: Question; existing: Question[]; mutate: Mutate; onClose: () => void }) {
  const [text, setText] = useState(question?.question ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError('');
    const normalized = text.trim().toLocaleLowerCase('tr-TR');
    if (existing.some((item) => item.id !== question?.id && item.question.trim().toLocaleLowerCase('tr-TR') === normalized)) { setError('Bu soru listenizde zaten bulunuyor.'); return; }
    setSaving(true);
    try {
      const payload = { question: text.trim() };
      const ok = question ? await mutate('reflection_questions', 'PATCH', payload, question.id) : await mutate('reflection_questions', 'POST', payload);
      if (ok) onClose();
    } finally { setSaving(false); }
  };
  return <PersonalDialog title={question ? 'Sorunuzu düzenleyin' : 'Kendi sorunuzu oluşturun'} description="Kendi sorunuz kişisel muhasebe listenize eklenir." onCloseAction={onClose}>
    <form className="personal-form" onSubmit={(event) => void save(event)}><label className="field"><span>Soru metni</span><textarea className="input" rows={4} value={text} onChange={(event) => setText(event.target.value)} minLength={3} maxLength={300} required autoFocus /></label>{error && <p className="personal-form-error" role="alert">{error}</p>}<div className="personal-form-actions"><button type="button" className="button ghost" onClick={onClose}>Vazgeç</button><button type="submit" className="button" disabled={saving}>{saving ? 'Kaydediliyor…' : question ? 'Soruyu güncelle' : 'Soruyu ekle'}</button></div></form>
  </PersonalDialog>;
}
