// Route for /crm/leads/:id — the lead detail view, behind RequireAuth.
import React from 'react';
import { RequireAuth } from './auth/RequireAuth';
import { LeadDetail } from './leads/LeadDetail';

export default function LeadDetailRoute({ id }: { id: string }) {
  return (
    <RequireAuth>
      <div className="crm-root dark min-h-screen bg-[var(--color-void-black)] text-[var(--color-ink)]">
        {id ? <LeadDetail id={id} /> : null}
      </div>
    </RequireAuth>
  );
}
