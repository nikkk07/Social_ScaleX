'use client';

// ─────────────────────────────────────────────────────────────────────
// The whole CRM behind a single client entry point.
//
// This replaces the react-router pathless layout. It exists as ONE component
// rather than one per route for a specific reason: AuthProvider must stay
// mounted across /login ↔ /crm so the session and its onAuthStateChange
// subscription survive navigation. A per-route provider would tear down and
// re-initialise the session on every move.
//
// It is loaded through next/dynamic with ssr:false (see
// src/components/crm/CrmPage.tsx), so nothing in this subtree — including the
// Supabase client, which reads localStorage at module load — is ever evaluated
// on the server or during `next build`.
// ─────────────────────────────────────────────────────────────────────

import React from 'react';
import { Toaster } from 'sonner';
import { AuthProvider } from './auth/AuthProvider';
import LoginPage from './auth/LoginPage';
import DashboardRoute from './DashboardRoute';
import EnquiriesRoute from './EnquiriesRoute';
import LeadFormRoute from './LeadFormRoute';
import LeadDetailRoute from './LeadDetailRoute';

export type CrmViewProps =
  | { view: 'login' }
  | { view: 'dashboard' }
  | { view: 'enquiries' }
  | { view: 'lead-new' }
  | { view: 'lead-detail'; id: string }
  | { view: 'lead-edit'; id: string };

function View(props: CrmViewProps) {
  switch (props.view) {
    case 'login':
      return <LoginPage />;
    case 'dashboard':
      return <DashboardRoute />;
    case 'enquiries':
      return <EnquiriesRoute />;
    case 'lead-new':
      return <LeadFormRoute />;
    case 'lead-edit':
      return <LeadFormRoute id={props.id} />;
    case 'lead-detail':
      return <LeadDetailRoute id={props.id} />;
  }
}

export default function CrmViews(props: CrmViewProps) {
  return (
    <AuthProvider>
      <View {...props} />
      {/* CRM toasts (optimistic-update failures, etc.). The marketing site
          mounts its own Toaster in Contact; this one serves the CRM subtree. */}
      <Toaster position="bottom-center" theme="dark" richColors />
    </AuthProvider>
  );
}
