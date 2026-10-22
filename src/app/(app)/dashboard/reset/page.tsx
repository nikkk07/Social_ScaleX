import React from 'react';
import type { Metadata } from 'next';
import { ResetClient } from '@/components/app/ResetClient';

export const metadata: Metadata = { title: 'Reset password' };

export default function ResetPage() {
  return <ResetClient />;
}
