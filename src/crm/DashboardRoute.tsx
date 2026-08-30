// The protected /crm entry. Kept as its own lazy module so RequireAuth (and,
// through it, the whole auth stack) stays out of the initial marketing bundle.
import React from 'react';
import { RequireAuth } from './auth/RequireAuth';
import Dashboard from './Dashboard';

export default function DashboardRoute() {
  return (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  );
}
