export type Period = 'day' | 'week' | 'month';

const pad = (value: number) => String(value).padStart(2, '0');

export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function dateFromKey(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function dateTimeFromKey(key: string, hours = 12, minutes = 0) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

export function localDateTimeValue(date = new Date()) {
  return `${localDateKey(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function dateTimeToIso(value: string) {
  return new Date(value).toISOString();
}

export function dateKeyFromTimestamp(value: string) {
  return localDateKey(new Date(value));
}

export function addDays(key: string, amount: number) {
  const date = dateFromKey(key);
  date.setDate(date.getDate() + amount);
  return localDateKey(date);
}

export function addMonths(key: string, amount: number) {
  const source = dateFromKey(key);
  const day = source.getDate();
  source.setDate(1);
  source.setMonth(source.getMonth() + amount);
  const lastDay = new Date(source.getFullYear(), source.getMonth() + 1, 0).getDate();
  source.setDate(Math.min(day, lastDay));
  return localDateKey(source);
}

export function mondayOf(key: string) {
  const date = dateFromKey(key);
  const mondayOffset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - mondayOffset);
  return localDateKey(date);
}

export function periodBounds(key: string, period: Period) {
  if (period === 'day') return { start: key, end: key };
  if (period === 'week') return { start: mondayOf(key), end: addDays(mondayOf(key), 6) };
  const date = dateFromKey(key);
  const start = localDateKey(new Date(date.getFullYear(), date.getMonth(), 1, 12));
  const end = localDateKey(new Date(date.getFullYear(), date.getMonth() + 1, 0, 12));
  return { start, end };
}

export function shiftPeriod(key: string, period: Period, amount: number) {
  if (period === 'day') return addDays(key, amount);
  if (period === 'week') return addDays(key, amount * 7);
  return addMonths(key, amount);
}

export function formatDate(key: string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) {
  return new Intl.DateTimeFormat('tr-TR', options).format(dateFromKey(key));
}

export function formatTimestamp(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function inRange(key: string, start: string, end: string) {
  return key >= start && key <= end;
}

export function rangeDays(start: string, end: string) {
  const result: string[] = [];
  for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) result.push(cursor);
  return result;
}

export function countActivePeriods(
  frequency: 'daily' | 'weekly' | 'monthly',
  startDate: string,
  endDate: string | null,
  rangeStart: string,
  rangeEnd: string,
) {
  const start = startDate > rangeStart ? startDate : rangeStart;
  const end = endDate && endDate < rangeEnd ? endDate : rangeEnd;
  if (start > end) return 0;
  if (frequency === 'daily') return rangeDays(start, end).length;
  if (frequency === 'weekly') return new Set(rangeDays(start, end).map(mondayOf)).size;
  return new Set(rangeDays(start, end).map((day) => day.slice(0, 7))).size;
}

export function bucketKey(key: string, period: Period) {
  if (period === 'day') return key;
  if (period === 'week') return mondayOf(key);
  return key.slice(0, 7);
}

export function formatBucket(key: string, period: Period) {
  if (period === 'day') return formatDate(key, { day: 'numeric', month: 'short' });
  if (period === 'week') return `${formatDate(key, { day: 'numeric', month: 'short' })} haftası`;
  const [year, month] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 15));
}
