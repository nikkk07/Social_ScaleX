'use client';

// ─────────────────────────────────────────────────────────────────────
// React Router → Next.js App Router compatibility layer.
//
// The CRM was written against react-router 7. Next's navigation primitives
// cover most of it one-for-one, with two genuine gaps this file fills:
//
//   useSearchParams — Next returns a read-only URLSearchParams. React Router
//     returns [params, setParams]. The CRM's list views drive all their
//     filter/sort/page state through the setter, so the setter is rebuilt
//     here on top of router.replace().
//
//   useBlocker — Next has no navigation-blocking API at all. Losing it would
//     mean a half-filled lead form is silently discarded by any stray click,
//     so it is reimplemented below: a module-level guard that both this file's
//     useNavigate() and a capture-phase click listener consult before letting
//     a navigation through.
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  usePathname,
  useRouter,
  useSearchParams as useNextSearchParams,
} from 'next/navigation';

export interface NavigateOptions {
  replace?: boolean;
}

// ── Navigation guard registry ────────────────────────────
// At most one guarded form is mounted at a time (the lead form), so a single
// slot is sufficient and avoids the bookkeeping a set would need.
interface Guard {
  shouldBlock: () => boolean;
  request: (proceed: () => void) => void;
}

let activeGuard: Guard | null = null;

export interface Blocker {
  state: 'unblocked' | 'blocked';
  proceed?: () => void;
  reset?: () => void;
}

/**
 * Blocks navigation away from a dirty form.
 *
 * Covers the two ways the CRM leaves a page: programmatic navigation through
 * `useNavigate()` below, and clicks on in-app links. Both consult the guard
 * before navigating. A browser Back press cannot be intercepted in the App
 * Router, which is why `useUnsavedGuard` keeps its separate `beforeunload`
 * handler for the hard-exit cases.
 */
export function useBlocker(shouldBlock: () => boolean): Blocker {
  const [pending, setPending] = useState<{ run: () => void } | null>(null);

  // A ref so the registered guard always reads current state rather than the
  // values captured when the effect first ran.
  const shouldBlockRef = useRef(shouldBlock);
  shouldBlockRef.current = shouldBlock;

  const router = useRouter();

  useEffect(() => {
    const guard: Guard = {
      shouldBlock: () => shouldBlockRef.current(),
      request: (proceed) => setPending({ run: proceed }),
    };
    activeGuard = guard;

    // Capture phase, so this runs before Next's own Link handler.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (!guard.shouldBlock()) return;

      const anchor = (e.target as HTMLElement | null)?.closest?.('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      if (anchor.target && anchor.target !== '_self') return;

      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;

      e.preventDefault();
      e.stopPropagation();
      setPending({ run: () => router.push(url.pathname + url.search) });
    };

    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      if (activeGuard === guard) activeGuard = null;
    };
  }, [router]);

  return {
    state: pending ? 'blocked' : 'unblocked',
    proceed: pending
      ? () => {
          const run = pending.run;
          setPending(null);
          run();
        }
      : undefined,
    reset: pending ? () => setPending(null) : undefined,
  };
}

/** React Router's `useNavigate`, routed through the guard above. */
export function useNavigate() {
  const router = useRouter();
  return useCallback(
    (to: string, options?: NavigateOptions) => {
      const go = () =>
        options?.replace ? router.replace(to) : router.push(to);
      if (activeGuard?.shouldBlock()) {
        activeGuard.request(go);
        return;
      }
      go();
    },
    [router],
  );
}

/**
 * React Router's `[params, setParams]` tuple.
 *
 * The setter uses `replace`, not `push`: typing in a filter box should not
 * bury the previous page under a dozen history entries.
 */
export function useSearchParams(): [
  URLSearchParams,
  (next: URLSearchParams, options?: NavigateOptions) => void,
] {
  const router = useRouter();
  const pathname = usePathname();
  const readOnly = useNextSearchParams();

  // Copied so callers can mutate freely without touching Next's cached object.
  const params = new URLSearchParams(readOnly?.toString() ?? '');

  const setParams = useCallback(
    (next: URLSearchParams, options?: NavigateOptions) => {
      const qs = next.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      if (options?.replace === false) router.push(url);
      else router.replace(url);
    },
    [router, pathname],
  );

  return [params, setParams];
}
