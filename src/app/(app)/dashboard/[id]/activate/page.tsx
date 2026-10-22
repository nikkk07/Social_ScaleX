import React from 'react';
import type { Metadata } from 'next';
import { PayClient } from '@/components/app/PayClient';

export const metadata: Metadata = { title: 'Pay ₹99' };

type Props = { params: Promise<{ id: string }> };

export default async function ActivatePage({ params }: Props) {
  const { id } = await params;
  return <PayClient accountId={id} />;
}
