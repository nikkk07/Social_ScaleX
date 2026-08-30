import React from 'react';
import type { Metadata } from 'next';
import { CrmPage } from '@/components/crm/CrmPage';

export const metadata: Metadata = {
  title: 'Leads',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CrmPage view="dashboard" />;
}
