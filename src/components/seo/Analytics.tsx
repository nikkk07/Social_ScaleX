'use client';

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { contactMethod, trackContact } from '@/lib/track';

/**
 * GA4 and Meta Pixel, loaded on the visitor's first interaction (scroll, tap,
 * key, pointer) or 6 s after load, whichever comes first, so the ~180 KB tag
 * never competes with the page's own loading. The first PageView is still
 * sent as soon as the tag loads. GA4 records client-side navigations itself
 * (enhanced measurement, "page changes based on browser history");
 * the Pixel needs a PageView per route change, sent below.
 *
 * Clicks on call, WhatsApp and email links are caught by one delegated
 * listener, so the dozen CTA links across server components need no changes.
 */
export function Analytics({ gaId, pixelId }: { gaId: string; pixelId: string }) {
  const pathname = usePathname();
  const first = useRef(true);
  // The internal CRM and its login are never tracked.
  const internal = /^\/(crm|login)(\/|$)/.test(pathname ?? '');
  const [load, setLoad] = useState(false);

  useEffect(() => {
    if (internal || load) return;
    const events = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart', 'wheel'] as const;
    let timer: number | undefined;
    const go = () => setLoad(true);
    const arm = () => {
      timer = window.setTimeout(go, 6000);
    };
    events.forEach((e) => window.addEventListener(e, go, { once: true, passive: true }));
    if (document.readyState === 'complete') arm();
    else window.addEventListener('load', arm, { once: true });
    return () => {
      events.forEach((e) => window.removeEventListener(e, go));
      window.removeEventListener('load', arm);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [internal, load]);

  useEffect(() => {
    if (internal) return;
    if (first.current) {
      first.current = false;
      return;
    }
    window.fbq?.('track', 'PageView');
  }, [pathname, internal]);

  useEffect(() => {
    if (internal) return;
    const onClick = (e: MouseEvent) => {
      const link = e.target instanceof Element ? e.target.closest('a[href]') : null;
      const method = link ? contactMethod(link.getAttribute('href') ?? '') : null;
      if (method) trackContact(method);
    };
    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, [internal]);

  if (internal || !load) return null;
  return (
    <>
      {gaId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
          </Script>
        </>
      ) : null}
      {pixelId ? (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`}
        </Script>
      ) : null}
    </>
  );
}
