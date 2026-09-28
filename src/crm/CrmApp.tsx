'use client';
// ─────────────────────────────────────────────────────────────────────
// The CRM application: providers + a tiny view router keyed on the URL.
// Mounted once by src/app/(crm)/layout.tsx, so the session, caches and the
// call-outcome state survive every navigation inside the CRM.
// ─────────────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from './auth/AuthProvider';
import { RequireAuth } from './auth/RequireAuth';
import LoginPage from './auth/LoginPage';
import { ThemeProvider, useTheme } from './theme';
import { AppShell } from './layout/AppShell';
import { OutcomeProvider } from './outcome/OutcomeProvider';
import { TodayPage } from './today/TodayPage';
import { LeadsPage } from './leads/LeadsPage';
import { LeadDetailPage } from './leads/LeadDetailPage';
import { LeadFormPage } from './leads/LeadFormPage';
import { FollowUpsPage } from './followups/FollowUpsPage';
import { EnquiriesPage } from './enquiries/EnquiriesPage';
import { TeamPage } from './team/TeamPage';
import { InsightsPage } from './insights/InsightsPage';
import { SettingsPage } from './settings/SettingsPage';
import { AccountPage } from './account/AccountPage';
import { NotFoundView } from './layout/NotFoundView';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function route(pathname: string): React.ReactNode {
  const p = pathname.replace(/\/+$/, '') || '/';
  if (p === '/crm') return <TodayPage />;
  if (p === '/crm/leads') return <LeadsPage />;
  if (p === '/crm/leads/new') return <LeadFormPage mode="add" />;
  const detail = /^\/crm\/leads\/([^/]+)$/.exec(p);
  if (detail?.[1] && UUID.test(detail[1])) return <LeadDetailPage id={detail[1]} />;
  const edit = /^\/crm\/leads\/([^/]+)\/edit$/.exec(p);
  if (edit?.[1] && UUID.test(edit[1])) return <LeadFormPage mode="edit" id={edit[1]} />;
  if (p === '/crm/follow-ups') return <FollowUpsPage />;
  if (p === '/crm/enquiries') return <EnquiriesPage />;
  if (p === '/crm/team') return <RequireAuth adminOnly><TeamPage /></RequireAuth>;
  if (p === '/crm/insights') return <InsightsPage />;
  if (p === '/crm/settings') return <RequireAuth adminOnly><SettingsPage /></RequireAuth>;
  if (p === '/crm/account') return <AccountPage />;
  return <NotFoundView />;
}

function BodyTheme() {
  const { resolved } = useTheme();
  useEffect(() => {
    const b = document.body.classList;
    b.add('crm-root');
    b.toggle('dark', resolved === 'dark');
    b.toggle('light', resolved === 'light');
    return () => {
      b.remove('crm-root', 'dark', 'light');
    };
  }, [resolved]);
  return null;
}

function Views() {
  const pathname = usePathname() ?? '/crm';
  const { resolved } = useTheme();
  if (pathname === '/login') return <LoginPage />;
  return (
    <RequireAuth>
      <OutcomeProvider>
        <AppShell>{route(pathname)}</AppShell>
      </OutcomeProvider>
      <Toaster position="bottom-right" theme={resolved} closeButton toastOptions={{ classNames: { toast: '!bg-card !text-card-foreground !border-border', description: '!text-muted-foreground' } }} />
    </RequireAuth>
  );
}

export default function CrmApp() {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 20_000, retry: 1, refetchOnWindowFocus: true },
          mutations: { retry: 0 },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <BodyTheme />
        <AuthProvider>
          <Views />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
