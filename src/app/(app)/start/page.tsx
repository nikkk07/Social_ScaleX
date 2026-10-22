import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { StartClient } from '@/components/app/StartClient';

export const metadata: Metadata = { title: 'Start your ₹99 automation' };

export default function StartPage() {
  return (
    <Suspense>
      <StartClient />
    </Suspense>
  );
}
