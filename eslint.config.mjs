import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      '@next/next/no-html-link-for-pages': 'error',
      '@next/next/no-img-element': 'error',
      // React Compiler readiness rules (react-hooks v7). This project does not
      // use the React Compiler; the flagged patterns (Date.now() in render,
      // syncing state in effects, a ref updated during render) are intentional
      // and covered by the CRM and site test suites.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
    },
  },
  globalIgnores([
    '.next/**',
    'node_modules/**',
    'next-env.d.ts',
    'src/components/ui/**',
    'src/imports/**',
    'supabase/**',
    'scripts/**',
  ]),
]);
