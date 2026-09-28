// All CRM times are stored as UTC timestamptz and shown in India time
// (Asia/Kolkata, UTC+05:30, no daylight saving), whatever the device's zone.
export const TZ = 'Asia/Kolkata';
const IST_OFFSET_MIN = 330;

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-IN', { timeZone: TZ, ...opts });
const fTime = fmt({ hour: 'numeric', minute: '2-digit', hour12: true });
const fDay = fmt({ day: 'numeric', month: 'short' });
const fDayYear = fmt({ day: 'numeric', month: 'short', year: 'numeric' });
const fWeekday = fmt({ weekday: 'short', day: 'numeric', month: 'short' });
const fFull = fmt({ weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

/** YYYY-MM-DD of a moment, in IST. */
export function istDateKey(d: Date | string | number): string {
  const t = new Date(d).getTime() + IST_OFFSET_MIN * 60_000;
  return new Date(t).toISOString().slice(0, 10);
}

export function todayKey(): string {
  return istDateKey(Date.now());
}

export function addDaysKey(key: string, days: number): string {
  const d = new Date(key + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatTime(d: string | Date): string {
  return fTime.format(new Date(d));
}

export function formatDate(d: string | Date): string {
  const key = istDateKey(d);
  const now = todayKey();
  if (key === now) return 'Today';
  if (key === addDaysKey(now, 1)) return 'Tomorrow';
  if (key === addDaysKey(now, -1)) return 'Yesterday';
  return key.slice(0, 4) === now.slice(0, 4) ? fWeekday.format(new Date(d)) : fDayYear.format(new Date(d));
}

export function formatDateOnly(dateKey: string): string {
  return fDayYear.format(new Date(dateKey + 'T12:00:00+05:30'));
}

export function formatDateTime(d: string | Date): string {
  return `${formatDate(d)}, ${formatTime(d)}`;
}

export function formatFull(d: string | Date): string {
  return fFull.format(new Date(d));
}

export function shortDay(d: string | Date): string {
  return fDay.format(new Date(d));
}

/** "in 2 h", "3 d ago", "just now". */
export function relative(d: string | Date, now = Date.now()): string {
  const diff = new Date(d).getTime() - now;
  const abs = Math.abs(diff);
  const m = Math.round(abs / 60_000);
  let s: string;
  if (m < 1) return 'just now';
  if (m < 60) s = `${m} min`;
  else if (m < 60 * 24) s = `${Math.round(m / 60)} h`;
  else s = `${Math.round(m / 1440)} d`;
  return diff > 0 ? `in ${s}` : `${s} ago`;
}

/** How late an overdue item is, e.g. "2 h late". */
export function lateBy(d: string | Date, now = Date.now()): string | null {
  const diff = now - new Date(d).getTime();
  if (diff <= 0) return null;
  return relative(d, now).replace(' ago', ' late');
}

/** Value for <input type="datetime-local"> showing the IST wall-clock time. */
export function toIstLocalInput(d: Date | string): string {
  const t = new Date(d).getTime() + IST_OFFSET_MIN * 60_000;
  return new Date(t).toISOString().slice(0, 16);
}

/** Parse an <input type="datetime-local"> value as IST → ISO UTC string. */
export function fromIstLocalInput(v: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return null;
  const d = new Date(v + ':00+05:30');
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Round up to the next quarter hour, n minutes from now. */
export function suggestedTime(minutesAhead: number): Date {
  const d = new Date(Date.now() + minutesAhead * 60_000);
  d.setSeconds(0, 0);
  const m = d.getMinutes();
  d.setMinutes(m + ((15 - (m % 15)) % 15));
  return d;
}

/** Start of an IST day as an ISO string. */
export function istDayStart(key: string): string {
  return new Date(key + 'T00:00:00+05:30').toISOString();
}

export function isOverdue(due: string, now = Date.now()): boolean {
  return new Date(due).getTime() < now;
}
