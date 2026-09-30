/** Locale-free date helpers, so server HTML and the browser always agree. */
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/** "2026-09-30" → "30 Sep 2026". */
export function formatDay(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
}

/** "2026-09-30" → "Sep". */
export const monthShort = (iso: string) => MONTHS[Number(iso.slice(5, 7)) - 1]!;
