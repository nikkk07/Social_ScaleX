import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { AccountClient } from '@/components/app/AccountClient';

export const metadata: Metadata = { title: 'Instagram account' };

type Props = { params: Promise<{ id: string }> };

export default async function AccountPage({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense>
      <AccountClient accountId={id} />
    </Suspense>
  );
}
