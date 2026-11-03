/** Lower-case a label's first letter for running text, keeping platform names as written. */
export const lc = (s: string): string =>
  /^(Instagram|YouTube|Facebook|WhatsApp|Meta|Google)\b/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1);
