// Pathless layout for the CRM/auth subtree. Provides a SINGLE AuthProvider
// that stays mounted across /login ↔ /crm navigation (so the session and its
// onAuthStateChange subscription persist). Marketing routes live OUTSIDE this
// layout and therefore never mount AuthProvider or the Supabase client.
import React from 'react';
import { Outlet } from 'react-router';
import { Toaster } from 'sonner';
import { AuthProvider } from './auth/AuthProvider';

export default function CrmLayout() {
  return (
    <AuthProvider>
      <Outlet />
      {/* CRM toasts (optimistic-update failures, etc.). The marketing site
          mounts its own Toaster in Contact; this one serves the CRM subtree. */}
      <Toaster position="bottom-center" theme="dark" richColors />
    </AuthProvider>
  );
}
