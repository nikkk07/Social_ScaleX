/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== 'production';

// Supabase origin for the CRM's connect-src (REST + realtime websocket).
let supabaseOrigin = '';
try {
  supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
    : '';
} catch {
  supabaseOrigin = '';
}
const supabaseWs = supabaseOrigin.replace(/^http/, 'ws');

// Applied to every route.
const baseHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  },
];

// The internal CRM (and its login) additionally get a strict CSP. Next.js
// needs inline scripts for hydration, so 'unsafe-inline' stays for scripts,
// but every other origin is shut: data can only go to our Supabase project.
const crmCsp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseOrigin} ${supabaseWs}${isDev ? ' ws: http://127.0.0.1:* http://localhost:*' : ''}`.trim(),
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const crmHeaders = [
  { key: 'Content-Security-Policy', value: crmCsp },
  { key: 'Cache-Control', value: 'no-store' },
  { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
];

// Once NEXT_PUBLIC_SITE_URL points at the owned domain, every request to the
// old production host is 301'd there, path and query kept. Until then this is
// a no-op, so the site keeps working on vercel.app.
const LEGACY_HOST = 'social-scalex.vercel.app';
let canonicalOrigin = '';
try {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? '').trim();
  canonicalOrigin = raw ? new URL(raw).origin : '';
} catch {
  canonicalOrigin = '';
}
const hostRedirects =
  canonicalOrigin && new URL(canonicalOrigin).host !== LEGACY_HOST
    ? [{ source: '/:path*', has: [{ type: 'host', value: LEGACY_HOST }], destination: `${canonicalOrigin}/:path*`, permanent: true }]
    : [];

const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return hostRedirects;
  },
  // Vercel already advertises itself; one less response header on every request.
  poweredByHeader: false,
  async headers() {
    return [
      { source: '/:path*', headers: baseHeaders },
      ...(process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production'
        ? [{ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }]
        : []),
      { source: '/crm', headers: crmHeaders },
      { source: '/crm/:path*', headers: crmHeaders },
      { source: '/login', headers: crmHeaders },
      { source: '/reset-password', headers: crmHeaders },
      { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }, { key: 'X-Robots-Tag', value: 'noindex' }] },
    ];
  },
};

export default nextConfig;
