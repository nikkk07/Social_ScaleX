// Team management route - protected by RequireAuth
import React from 'react';
import { RequireAuth } from './auth/RequireAuth';
import { TeamPage } from './team/TeamPage';

export default function TeamRoute() {
  return (
    <RequireAuth>
      <TeamPage />
    </RequireAuth>
  );
}
