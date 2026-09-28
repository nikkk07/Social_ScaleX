import type { Metadata } from 'next';

// The CRM renders client-side from (crm)/layout.tsx; this file only
// registers the route and its metadata.
export const metadata: Metadata = { title: 'Today', robots: { index: false, follow: false } };

export default function Page() {
  return null;
}
