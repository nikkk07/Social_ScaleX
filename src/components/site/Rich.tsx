import React from 'react';
import Link from 'next/link';

// Renders the tiny inline markup used in src/lib/guides.ts: **bold** and
// [text](url). Internal links use next/link; external ones open in a new tab.
const TOKEN = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

export function Rich({ text }: { text: string }) {
  const out: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of text.matchAll(TOKEN)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    if (m[1] !== undefined) {
      out.push(<strong key={key++}>{m[1]}</strong>);
    } else if (m[2] !== undefined && m[3] !== undefined) {
      const href = m[3];
      out.push(
        href.startsWith('/') ? (
          <Link key={key++} href={href}>{m[2]}</Link>
        ) : (
          <a key={key++} href={href} target="_blank" rel="noopener noreferrer">{m[2]}</a>
        ),
      );
    }
    last = at + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

/** Same text with the markup stripped, for meta tags and JSON-LD. */
export function plain(text: string): string {
  return text.replace(TOKEN, (_m, b?: string, t?: string) => b ?? t ?? '');
}
