'use client';
import React, { useEffect, useRef, useState } from 'react';

export interface TocItem {
  id: string;
  text: string;
}

/** Offset below the sticky header at which a heading counts as "current". */
const LINE = 140;

/**
 * "On this page" list that highlights the section being read. Server HTML
 * has every link (works without JS); the client only adds the highlight.
 * One passive scroll listener, throttled to one layout read per frame.
 */
export function TocSpy({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string>(items[0]?.id ?? '');
  const list = useRef<HTMLOListElement>(null);

  // Keep the highlighted entry visible inside the (scrollable) list without
  // moving the page itself.
  useEffect(() => {
    const box = list.current?.parentElement;
    const el = list.current?.querySelector<HTMLElement>('[aria-current]');
    if (!box || !el) return;
    const top = el.offsetTop; // box is position:relative, so this is relative to it
    if (top < box.scrollTop + 24) box.scrollTop = Math.max(0, top - 24);
    else if (top + el.offsetHeight > box.scrollTop + box.clientHeight - 24) box.scrollTop = top + el.offsetHeight - box.clientHeight + 24;
  }, [active]);

  useEffect(() => {
    const heads = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!heads.length) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = heads[0]!.id;
      for (const h of heads) {
        if (h.getBoundingClientRect().top - LINE <= 0) current = h.id;
        else break;
      }
      // At the very bottom the last short sections can never reach the line.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        current = heads[heads.length - 1]!.id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [items]);

  return (
    <ol ref={list} className="border-l border-line text-sm">
      {items.map((h) => {
        const on = h.id === active;
        return (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              aria-current={on ? 'location' : undefined}
              onClick={() => setActive(h.id)}
              className={`-ml-px block border-l-2 py-1.5 pl-4 leading-snug transition-colors ${
                on ? 'border-coral font-semibold text-ink' : 'border-transparent text-ink-3 hover:text-ink'
              }`}
            >
              {h.text}
            </a>
          </li>
        );
      })}
    </ol>
  );
}
