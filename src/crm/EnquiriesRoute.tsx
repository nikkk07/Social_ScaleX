// The protected /crm/enquiries entry. Its own lazy module for the same reason
// as DashboardRoute: RequireAuth (and the whole auth + Supabase stack behind
// it) must stay out of the marketing bundle.
import React from 'react';
import { RequireAuth } from './auth/RequireAuth';
import { CrmHeader } from './CrmHeader';
import { EnquiriesList } from './enquiries/EnquiriesList';

export default function EnquiriesRoute() {
  return (
    <RequireAuth>
      <div className="crm-root dark min-h-screen bg-[var(--color-void-black)] text-[var(--color-ink)]">
        <CrmHeader />
        <main>
          <EnquiriesList />
        </main>
      </div>
    </RequireAuth>
  );
}
