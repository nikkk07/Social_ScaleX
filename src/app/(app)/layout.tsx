import React from 'react';
import type { Metadata } from 'next';

// The customer app: private, never indexed, no canonical.
export const metadata: Metadata = {
  title: { default: 'Comment-to-DM', template: '%s · Social ScaleX' },
  robots: { index: false, follow: false, nocache: true },
  alternates: { canonical: null },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
