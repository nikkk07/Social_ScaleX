import React from 'react';
import type { Metadata } from 'next';
import { CrmPage } from '@/components/crm/CrmPage';

export const metadata: Metadata = {
  title: 'Lead',
  robots: { index: false, follow: false },
};

export default function Page({ params }: { params: { id: string } }) {
  return <CrmPage view="lead-detail" id={params.id} />;
}
