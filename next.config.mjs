/** @type {import('next').NextConfig} */

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

// Every request to the old production host is 301'd to the live domain, path
// and query kept, so Google only ever sees www.socialscalex.in.
const LEGACY_HOST = 'social-scalex.vercel.app';
let canonicalOrigin = '';
try {
  // Same default as SITE_URL in src/lib/site.ts: the live domain.
  const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? '').trim() || 'https://www.socialscalex.in';
  canonicalOrigin = new URL(raw).origin;
} catch {
  canonicalOrigin = '';
}
const hostRedirects =
  canonicalOrigin && new URL(canonicalOrigin).host !== LEGACY_HOST
    ? [{ source: '/:path*', has: [{ type: 'host', value: LEGACY_HOST }], destination: `${canonicalOrigin}/:path*`, permanent: true }]
    : [];

// The CRM moved to its own app (Nov 2026). Old bookmarks land there.
const CRM_ORIGIN = 'https://crm.socialscalex.in';
const crmRedirects = [
  { source: '/crm', destination: CRM_ORIGIN, permanent: true },
  { source: '/crm/:path*', destination: `${CRM_ORIGIN}/:path*`, permanent: true },
  { source: '/login', destination: `${CRM_ORIGIN}/login`, permanent: true },
  { source: '/reset-password', destination: `${CRM_ORIGIN}/login`, permanent: true },
];

const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [...hostRedirects, ...crmRedirects];
  },
  // Vercel already advertises itself; one less response header on every request.
  poweredByHeader: false,
  images: {
    // Keep optimised images (client avatars, logos) cached for 31 days instead
    // of revalidating on every visit.
    minimumCacheTTL: 2678400,
  },
  async headers() {
    return [
      { source: '/:path*', headers: baseHeaders },
      ...(process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production'
        ? [{ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }]
        : []),
      // Guide illustrations are versioned in the file name (…-v1-768.avif), so
      // browsers and the CDN may keep them for a year without asking again.
      {
        source: '/guides/:dir/:file((?:.*)\\.(?:avif|webp|jpg|png))',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }, { key: 'X-Robots-Tag', value: 'noindex' }] },
    ];
  },
};

export default nextConfig;
