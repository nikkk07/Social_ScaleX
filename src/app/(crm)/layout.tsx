import React from 'react';
import type { Metadata } from 'next';
import { CrmRoot } from '@/components/crm/CrmRoot';

export const metadata: Metadata = {
  title: { default: 'CRM', template: '%s · Social ScaleX CRM' },
  robots: { index: false, follow: false, nocache: true },
};

// One client-only boundary for the whole CRM: session, providers and the
// view router live here and persist across navigations. Pages under this
// group return null — they exist for routing and metadata only.
export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CrmRoot />
      {children}
    </>
  );
}
