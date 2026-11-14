'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { CRM_COLLECT } from '@/lib/crm-collect';

/**
 * One tiny beacon per page view to the CRM's cookie-free counter (path, referrer, utm_source, screen width).
 * sendBeacon never blocks the page; the CRM and login paths are never counted.
 */
export function CrmBeacon() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || /^\/(crm|login)(\/|$)/.test(pathname) || typeof navigator.sendBeacon !== 'function') return;
    const u = new URLSearchParams(location.search).get('utm_source') ?? undefined;
    const body = JSON.stringify({ h: location.hostname, p: pathname, r: document.referrer || undefined, u, w: innerWidth });
    try { navigator.sendBeacon(CRM_COLLECT, new Blob([body], { type: 'text/plain' })); } catch { /* never break the page */ }
  }, [pathname]);
  return null;
}
