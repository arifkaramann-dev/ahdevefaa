import 'server-only';
import { z } from 'zod';
import { MOODS } from '@/lib/types';

const uuid = z.string().uuid();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tarih YYYY-MM-DD olmalıdır.');
const timestamp = z.string().datetime({ offset: true });
const shortText = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => z.string().max(max);
const answerMap = z.record(z.string().max(100), z.string().max(4000)).refine((value) => Object.keys(value).length <= 30);

const shapes = {
  mood_entries: z.object({ mood: z.enum(MOODS), note: optionalText(4000), recorded_at: timestamp }).strict(),
  prayer_entries: z.object({ date, prayer: z.enum(['Sabah', 'Öğle', 'İkindi', 'Akşam', 'Yatsı']), completed: z.boolean() }).strict(),
  worship_entries: z.object({ date, name: shortText(100), category: z.enum(['daily', 'qaza', 'nafile']), amount: z.number().int().min(0).max(1_000_000), note: optionalText(2000) }).strict(),
  wirds: z.object({ name: shortText(120), target: z.number().int().min(1).max(1_000_000), start_date: date, end_date: date.nullable(), description: optionalText(4000), frequency: z.enum(['daily', 'weekly', 'monthly']) }).strict(),
  wird_logs: z.object({ wird_id: uuid, date, amount: z.number().int().min(0).max(1_000_000) }).strict(),
  dreams: z.object({ title: shortText(200), narrative: shortText(20_000), date, waking_feeling: optionalText(500), dream_feeling: optionalText(500), personal_notes: optionalText(8000) }).strict(),
  self_reflections: z.object({ date, answers: answerMap, note: optionalText(8000) }).strict(),
  reflection_questions: z.object({ question: shortText(500) }).strict(),
  privacy_permissions: z.object({ teacher_id: uuid, module: z.enum(['dreams', 'mood_entries', 'self_reflections']), record_id: uuid.nullable() }).strict(),
  assignment_logs: z.object({ assignment_id: uuid, date, amount: z.number().int().min(0).max(1_000_000) }).strict(),
};

export type WritableCollection = keyof typeof shapes;
export const writableCollections = Object.keys(shapes) as WritableCollection[];
export function validateRecord(collection: WritableCollection, data: unknown, partial = false) {
  const shape = shapes[collection];
  const validator = partial ? shape.partial() : shape;
  return validator.safeParse(data);
}
export function isWritableCollection(value: unknown): value is WritableCollection {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(shapes, value);
}
export const recordIdSchema = uuid;
