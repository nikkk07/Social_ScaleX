// The /crm shell: top bar, summary tiles, then the leads list. Route
// protection and provisioning are handled upstream by RequireAuth.
import React from 'react';
import { CrmHeader } from './CrmHeader';
import { StatTiles } from './dashboard/StatTiles';
import { LeadsList } from './leads/LeadsList';

export default function Dashboard() {
  return (
    <div className="crm-root dark min-h-screen bg-[var(--color-void-black)] text-[var(--color-ink)]">
      <CrmHeader />
      <main>
        {/* Same max-width + padding as LeadsList so the tiles line up with the
            table below them rather than floating wider. */}
        <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
          <StatTiles />
        </div>
        <LeadsList />
      </main>
    </div>
  );
}
