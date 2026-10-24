import type { DayView } from '../lib/types';

/** "A · II" → "Year A · Weekday cycle II" */
export function cycleLabel(cycle: string): string {
  const [year, weekday] = cycle.split('·').map((s) => s.trim());
  if (!year) return '';
  return weekday ? `Year ${year} · Weekday cycle ${weekday}` : `Year ${year}`;
}

/** "Douay-Rheims Bible (public domain)" → "Douay-Rheims Bible" */
export function shortCredit(credit: string): string {
  return credit.replace(/\s*\(.*\)\s*$/, '');
}

/** "Saturday of the 29th Week… · Optional memorial of St. Anthony Mary Claret, Bishop" */
export function daySubtitle(day: DayView): string {
  if (!day.saint) return day.dayName;
  const saint = day.saintNote ? `${day.saintNote} of ${day.saint}` : day.saint;
  return `${day.dayName} · ${saint}`;
}

const WORDS = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'];

export function countWord(n: number): string {
  return WORDS[n] ?? String(n);
}

/** Anchor id for a reading part on the Readings page: "First Reading" → "first-reading". */
export function partId(kind: string, index: number): string {
  return `${kind.toLowerCase().replace(/[^a-z]+/g, '-')}-${index}`;
}
