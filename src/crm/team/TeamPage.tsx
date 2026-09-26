'use client';

import React, { useState } from 'react';
import { CrmHeader } from '../CrmHeader';
import { useAuth } from '../auth/AuthProvider';
import { TeamList } from './TeamList';
import { AddUserDialog } from './AddUserDialog';
import { Plus } from 'lucide-react';

export function TeamPage() {
  const { role } = useAuth();
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Only owner, admin, and super_admin can add users
  const canAddUsers = role === 'owner' || role === 'admin' || role === 'super_admin';

  return (
    <div className="crm-root dark min-h-screen bg-[var(--color-void-black)] text-[var(--color-ink)]">
      <CrmHeader />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Team Members</h1>
            <p className="text-sm text-white/50">Manage your team and their access</p>
          </div>
          {canAddUsers && (
            <button
              type="button"
              onClick={() => setAddUserOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-violet-cta)] px-3 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.03] active:scale-95"
            >
              <Plus size={15} />
              Add User
            </button>
          )}
        </div>

        <TeamList key={refreshKey} />

        {canAddUsers && (
          <AddUserDialog
            open={addUserOpen}
            onClose={() => setAddUserOpen(false)}
            onSuccess={() => {
              setAddUserOpen(false);
              setRefreshKey(prev => prev + 1);
            }}
          />
        )}
      </main>
    </div>
  );
}
