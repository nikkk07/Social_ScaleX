import React from 'react';
import type { Metadata } from 'next';
import { CrmPage } from '@/components/crm/CrmPage';

// Internal tool. noindex belt-and-braces alongside the robots.txt Disallow:
// Disallow stops crawling, not the indexing of a URL discovered elsewhere.
export const metadata: Metadata = {
  title: 'Team Login',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CrmPage view="login" />;
}
