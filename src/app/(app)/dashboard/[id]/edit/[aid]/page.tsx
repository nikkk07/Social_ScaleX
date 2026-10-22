import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { BuilderClient } from '@/components/app/BuilderClient';

export const metadata: Metadata = { title: 'Edit automation' };

type Props = { params: Promise<{ id: string; aid: string }> };

export default async function EditAutomationPage({ params }: Props) {
  const { id, aid } = await params;
  return (
    <Suspense>
      <BuilderClient accountId={id} automationId={aid} />
    </Suspense>
  );
}
