'use client';
import { useEffect } from 'react';

const SEEN_KEY = 'ssx-seen-stories';

/**
 * Opens and closes the server-rendered client stories (CaseStories.tsx).
 * Links are plain `#id` anchors, so the browser handles history: Back closes
 * a story, and /case-studies#<id> from any page opens it. Moving between
 * stories replaces the entry, so one Back always returns to the page.
 * Renders nothing.
 */
export function StoryController() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-stories]');
    if (!root) return;
    root.dataset.js = '';
    const ids = [...root.querySelectorAll<HTMLElement>('[data-story]')].map((e) => e.dataset.story!);
    let current: string | null = null;
    let openedByLink = false;
    let returnFocus: HTMLElement | null = null;

    const read = (): string[] => {
      try { return JSON.parse(sessionStorage.getItem(SEEN_KEY) ?? '[]'); } catch { return []; }
    };
    const markSeen = (id: string) => {
      const seen = new Set(read()); seen.add(id);
      try { sessionStorage.setItem(SEEN_KEY, JSON.stringify([...seen])); } catch { /* private mode */ }
      paintSeen(seen);
    };
    const paintSeen = (seen: Set<string>) => {
      document.querySelectorAll<HTMLElement>('[data-story-link]').forEach((a) => {
        if (seen.has(a.dataset.storyLink!)) a.dataset.seen = '';
      });
    };
    paintSeen(new Set(read()));

    const el = (id: string) => root.querySelector<HTMLElement>(`[data-story="${CSS.escape(id)}"]`);

    const show = (id: string) => {
      const next = el(id);
      if (!next) return;
      if (current && current !== id) el(current)?.removeAttribute('data-open');
      if (!current) {
        returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        document.documentElement.classList.add('story-lock');
      }
      current = id;
      next.setAttribute('data-open', '');
      const panel = next.querySelector<HTMLElement>('[data-story-panel]');
      if (panel) panel.scrollTop = 0;
      next.querySelector<HTMLElement>('.story-close')?.focus({ preventScroll: true });
      markSeen(id);
    };

    const hide = () => {
      if (!current) return;
      el(current)?.removeAttribute('data-open');
      current = null;
      document.documentElement.classList.remove('story-lock');
      returnFocus?.focus({ preventScroll: true });
      returnFocus = null;
    };

    const clearHash = () => history.replaceState(history.state, '', location.pathname + location.search);

    const close = () => {
      if (!current) return;
      if (openedByLink) {
        openedByLink = false;
        history.back(); // hashchange then hides it
      } else {
        clearHash();
        hide();
      }
    };

    const go = (id: string) => {
      history.replaceState(history.state, '', `#${id}`);
      show(id);
    };

    const step = (d: 1 | -1) => {
      if (!current) return;
      const i = ids.indexOf(current);
      go(ids[(i + d + ids.length) % ids.length]!);
    };

    const sync = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      if (ids.includes(id)) show(id);
      else hide();
    };

    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const a = t.closest<HTMLAnchorElement>('a');
      if (!a) return;
      if (a.hasAttribute('data-story-close')) {
        e.preventDefault();
        close();
        return;
      }
      const link = a.dataset.storyLink;
      if (link && current) {
        // Already in a story: swap without adding history.
        e.preventDefault();
        go(link);
        return;
      }
      if (link) openedByLink = true; // the browser follows the #id and fires hashchange
      if (a.hasAttribute('data-story-exit') && current) {
        // Leave the story for the form: replace the story entry, then scroll.
        e.preventDefault();
        const target = a.hash;
        history.replaceState(history.state, '', target);
        openedByLink = false;
        hide();
        document.querySelector(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (!current) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'Tab') {
        const box = el(current);
        const f = box ? [...box.querySelectorAll<HTMLElement>('a[href]:not([tabindex="-1"]), button')].filter((x) => x.offsetParent !== null) : [];
        if (!f.length) return;
        const first = f[0]!, last = f[f.length - 1]!;
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    // Swipe left or right on phones to move between stories.
    let sx = 0, sy = 0;
    const onTouchStart = (e: TouchEvent) => { const t = e.touches[0]; if (t) { sx = t.clientX; sy = t.clientY; } };
    const onTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      if (!t || !current) return;
      const dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 2) step(dx < 0 ? 1 : -1);
    };

    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', sync);
    root.addEventListener('touchstart', onTouchStart, { passive: true });
    root.addEventListener('touchend', onTouchEnd, { passive: true });
    sync();

    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('hashchange', sync);
      root.removeEventListener('touchstart', onTouchStart);
      root.removeEventListener('touchend', onTouchEnd);
      document.documentElement.classList.remove('story-lock');
    };
  }, []);

  return null;
}
