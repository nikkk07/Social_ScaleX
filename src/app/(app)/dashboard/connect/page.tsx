import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { ConnectClient } from '@/components/app/ConnectClient';

export const metadata: Metadata = { title: 'Find your Instagram account' };

export default function ConnectPage() {
  return (
    <Suspense>
      <ConnectClient />
    </Suspense>
  );
}
