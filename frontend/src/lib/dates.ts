// Dates from the API are ISO "YYYY-MM-DD" calendar days. They are handled as UTC midnight
// so formatting never shifts them across a day boundary.

export function parseDay(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso: string, n: number): string {
  const d = parseDay(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return toIso(d);
}

function locale(lang: string): string {
  return lang === 'ta' ? 'ta-IN' : 'en-GB';
}

function fmt(iso: string, lang: string, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(locale(lang), { timeZone: 'UTC', ...opts }).format(parseDay(iso));
}

/** "Saturday, 24 October 2026" */
export function longDate(iso: string, lang = 'en', withYear = true): string {
  const s = fmt(iso, lang, { weekday: 'long', day: 'numeric', month: 'long', ...(withYear ? { year: 'numeric' } : {}) });
  // en-GB puts no comma after the weekday; the design does.
  return lang === 'ta' ? s : s.replace(/^(\w+) /, '$1, ');
}

/** "Sat, 24 October" */
export function mediumDate(iso: string, lang = 'en'): string {
  const s = fmt(iso, lang, { weekday: 'short', day: 'numeric', month: 'long' });
  return lang === 'ta' ? s : s.replace(/^(\w+) /, '$1, ');
}

/** "24 Oct" */
export function shortDate(iso: string, lang = 'en'): string {
  return fmt(iso, lang, { day: 'numeric', month: 'short' });
}

export function weekdayShort(iso: string, lang = 'en'): string {
  return fmt(iso, lang, { weekday: 'short' });
}

export function weekdayLong(iso: string, lang = 'en'): string {
  return fmt(iso, lang, { weekday: 'long' });
}

export function monthShort(iso: string, lang = 'en'): string {
  return fmt(iso, lang, { month: 'short' });
}

export function dayNumber(iso: string): number {
  return parseDay(iso).getUTCDate();
}

export function weekdayIndex(iso: string): number {
  return parseDay(iso).getUTCDay();
}

/** "October 2026" for a "YYYY-MM" month. */
export function monthTitle(month: string): string {
  return fmt(`${month}-01`, 'en', { month: 'long', year: 'numeric' });
}

export function shiftMonth(month: string, n: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

/** Portal timestamps: "Today, 3:42 pm", "Yesterday", "20 Oct". */
export function relativeTime(instant: string | null | undefined, now = new Date()): string {
  if (!instant) return '—';
  const t = new Date(instant);
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(t)) / 86_400_000);
  const time = t.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/\s?([ap])m/i, ' $1m');
  if (days === 0) return `Today, ${time}`;
  if (days === 1) return `Yesterday, ${time}`;
  return t.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: t.getFullYear() === now.getFullYear() ? undefined : 'numeric' });
}

/** "1 h ago", "5 h ago", "Yesterday", "20 Oct" for the dashboard's draft list. */
export function ago(instant: string, now = new Date()): string {
  const mins = Math.round((now.getTime() - new Date(instant).getTime()) / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return relativeTime(instant, now).replace(/, .*$/, '');
}

export function greeting(now = new Date()): string {
  const h = now.getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}
