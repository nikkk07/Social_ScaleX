/**
 * Tailwind CSS v4 under Next.js.
 *
 * The Vite build used @tailwindcss/vite; Next compiles CSS through PostCSS,
 * so the equivalent plugin is @tailwindcss/postcss. It pulls in everything
 * Tailwind needs — do not add `tailwindcss` or `autoprefixer` alongside it.
 */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
