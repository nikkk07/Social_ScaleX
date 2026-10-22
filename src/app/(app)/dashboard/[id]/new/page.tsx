import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { BuilderClient } from '@/components/app/BuilderClient';

export const metadata: Metadata = { title: 'New automation' };

type Props = { params: Promise<{ id: string }> };

export default async function NewAutomationPage({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense>
      <BuilderClient accountId={id} />
    </Suspense>
  );
}
