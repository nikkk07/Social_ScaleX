'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { CrmBoot } from '@/crm/CrmBoot';
import type { CrmViewProps } from '@/crm/CrmViews';

/**
 * The one server/client boundary for the CRM.
 *
 * `ssr: false` is load-bearing, not a convenience. The CRM's session lives in
 * localStorage and src/lib/supabase.ts throws at module load without its env
 * vars, so prerendering any of it would fail the build — and there is nothing
 * to gain from server-rendering an auth-gated internal tool. Keeping the
 * boundary here also guarantees no Supabase code reaches a marketing bundle.
 */
const CrmViews = dynamic(() => import('@/crm/CrmViews'), {
  ssr: false,
  loading: () => <CrmBoot />,
});

export function CrmPage(props: CrmViewProps) {
  return <CrmViews {...props} />;
}
