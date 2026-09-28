'use client';

import dynamic from 'next/dynamic';
import { CrmBoot } from '@/crm/CrmBoot';

/**
 * `ssr: false` is load-bearing: the CRM session lives in localStorage and
 * src/lib/supabase.ts throws at module load without its env vars, so none
 * of it may run during the build. It also keeps every byte of Supabase and
 * CRM code out of the marketing bundles.
 */
export const CrmRoot = dynamic(() => import('@/crm/CrmApp'), {
  ssr: false,
  loading: () => <CrmBoot />,
});
