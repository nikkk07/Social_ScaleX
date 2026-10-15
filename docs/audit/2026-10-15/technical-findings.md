# Technical findings — 15 Oct 2026

| # | Finding | Evidence | Severity | Root cause | Status |
|---|---|---|---|---|---|
| T1 | 35 pages had no og:image; X card showed homepage title | Live HTML before 5440c02 | P2 | Next.js shallow metadata merge (page `openGraph` replaces layout's) | Fixed and live (`socialMeta()`) |
| T2 | `/login` and `/crm` canonical pointed at `/` | Live HTML: `<link rel="canonical" href="https://www.socialscalex.in">` plus noindex | P2 | (crm) layout inherited root `alternates.canonical` | Fixed locally (`alternates: { canonical: null }`); verified no canonical on local `/login` |
| T3 | Private routes correctly excluded | Live: `x-robots-tag: noindex, nofollow`, meta robots noindex, robots.txt Disallow `/crm`, `/login`, `/api/` | — | Intended | Pass |
| T4 | GA4 and Pixel did not load on live before 15 Oct | Env IDs unset | P1 | Missing Vercel vars | GA4 set by owner and live; Pixel pending |
| T5 | `test:site` imports `@axe-core/playwright`, which is not in `package.json` | `ERR_MODULE_NOT_FOUND` on clean install | P2 | Undeclared dev dependency | Open: add as devDependency on approval |
| T6 | Host and redirects | Apex and `social-scalex.vercel.app` → 308 → www; http apex is 2 hops (http→https→www) | P3 | Vercel default | Accept |
| T7 | Trailing slash | `/x/` 308 → `/x` | — | Next default | Pass |
| T8 | Unknown paths | `/does-not-exist` → 404 | — | — | Pass |
| T9 | Duplicate TOC report on guides | Two TOC elements in HTML: desktop sidebar (`hidden lg:block`) and mobile `<details>` (`lg:hidden`). Only one renders per viewport; hidden one is out of the a11y tree | — | Responsive pattern | Not a defect; no change |
| T10 | Mobile lab performance 83–94 | Lighthouse 12, simulated slow 4G, container CPU (benchmark index 2304) | P2 | LCP is the H1 text (font swap and CSS); GA4 about 240 ms main-thread time | Monitor CrUX/field data; no score-chasing change |

Full per-URL data: `url-inventory.csv`.
