/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Vercel already advertises itself; one less response header on every request.
  poweredByHeader: false,
};

export default nextConfig;
