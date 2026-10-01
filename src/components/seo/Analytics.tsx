'use client';

import React, { useEffect, useRef } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * GA4 and Meta Pixel, loaded once the browser is idle after page load so they never
 * delay the first paint. GA4 records client-side navigations itself
 * (enhanced measurement, "page changes based on browser history");
 * the Pixel needs a PageView per route change, sent below.
 */
export function Analytics({ gaId, pixelId }: { gaId: string; pixelId: string }) {
  const pathname = usePathname();
  const first = useRef(true);
  // The internal CRM and its login are never tracked.
  const internal = /^\/(crm|login)(\/|$)/.test(pathname ?? '');

  useEffect(() => {
    if (internal) return;
    if (first.current) {
      first.current = false;
      return;
    }
    window.fbq?.('track', 'PageView');
  }, [pathname, internal]);

  if (internal) return null;
  return (
    <>
      {gaId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="lazyOnload" />
          <Script id="ga4" strategy="lazyOnload">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
          </Script>
        </>
      ) : null}
      {pixelId ? (
        <Script id="meta-pixel" strategy="lazyOnload">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`}
        </Script>
      ) : null}
    </>
  );
}
