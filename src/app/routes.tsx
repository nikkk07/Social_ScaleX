import React, { Suspense, lazy } from "react";
import { createBrowserRouter } from "react-router";
import { Root } from "./Root";
import { Privacy } from "./pages/Privacy";
import { Terms } from "./pages/Terms";

// The ENTIRE CRM/auth tree is lazy — none of it (nor the Supabase client it
// pulls in) may land in the marketing homepage's initial chunk. These
// factories only run when a CRM route is actually rendered.
const CrmLayout = lazy(() => import("./crm/CrmLayout"));
const LoginPage = lazy(() => import("./crm/auth/LoginPage"));
const DashboardRoute = lazy(() => import("./crm/DashboardRoute"));
const LeadFormRoute = lazy(() => import("./crm/LeadFormRoute"));
const LeadDetailRoute = lazy(() => import("./crm/LeadDetailRoute"));

// Neutral fallback with NO imports from ./crm, so nothing CRM-related is
// pulled into the initial bundle just to render a spinner background.
const bootFallback = (
  <div className="crm-root dark min-h-screen bg-[var(--color-void-black)]" />
);

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
  },
  {
    path: "/privacy",
    Component: Privacy,
  },
  {
    path: "/terms",
    Component: Terms,
  },
  {
    // Pathless layout: one AuthProvider shared by /login and /crm. Registered
    // BEFORE the "*" catch-all below.
    element: (
      <Suspense fallback={bootFallback}>
        <CrmLayout />
      </Suspense>
    ),
    children: [
      {
        // Relative to the pathless layout → resolves to /login. Registered
        // before the "*" catch-all.
        path: "login",
        element: (
          <Suspense fallback={bootFallback}>
            <LoginPage />
          </Suspense>
        ),
      },
      {
        path: "crm",
        element: (
          <Suspense fallback={bootFallback}>
            <DashboardRoute />
          </Suspense>
        ),
      },
      {
        path: "crm/leads/new",
        element: (
          <Suspense fallback={bootFallback}>
            <LeadFormRoute />
          </Suspense>
        ),
      },
      {
        path: "crm/leads/:id/edit",
        element: (
          <Suspense fallback={bootFallback}>
            <LeadFormRoute />
          </Suspense>
        ),
      },
      {
        // Static "new" and "/edit" out-rank this dynamic segment.
        path: "crm/leads/:id",
        element: (
          <Suspense fallback={bootFallback}>
            <LeadDetailRoute />
          </Suspense>
        ),
      },
    ],
  },
  {
    // Unknown paths fall back to the homepage instead of a blank screen
    path: "*",
    Component: Root,
  },
]);
