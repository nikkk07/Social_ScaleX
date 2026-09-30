import React from 'react';
import type { Faq } from '@/lib/content';

/** Native <details>: every answer is in the served HTML and needs no JS. */
export function FaqList({ faqs }: { faqs: Faq[] }) {
  return (
    <div>
      {faqs.map((f, i) => (
        <details key={f.q} className="faq" open={i === 0}>
          <summary>{f.q}</summary>
          <div><p>{f.a}</p></div>
        </details>
      ))}
    </div>
  );
}
