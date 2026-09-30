// Crawl audit: start at /, follow internal links like a search engine, and
// compare with sitemap.xml. Run against a running server:
//   BASE=http://localhost:3000 npm run test:crawl
const B = process.env.BASE ?? 'http://127.0.0.1:3000';
const norm = (h) => { const u = new URL(h, B); u.hash = ''; u.search = ''; return u.pathname.replace(/\/$/, '') || '/'; };
const seen = new Map([['/', 0]]); const inbound = new Map(); const q = ['/']; const bad = [];
while (q.length) {
  const p = q.shift(); const r = await fetch(B + p, { redirect: 'manual' });
  if (r.status !== 200) { bad.push(p + ' ' + r.status); continue; }
  const h = await r.text();
  if (/<meta name="robots" content="[^"]*noindex/.test(h)) bad.push(p + ' noindex');
  const links = new Set([...h.matchAll(/<a [^>]*href="([^"]+)"/g)].map((m) => m[1]).filter((x) => x.startsWith('/') && !x.startsWith('//')).map(norm));
  for (const l of links) {
    if (/^\/(crm|login|api|_next)/.test(l) || /\.(txt|xml|png|webp|svg)$/.test(l)) continue;
    inbound.set(l, (inbound.get(l) ?? 0) + 1);
    if (!seen.has(l)) { seen.set(l, seen.get(p) + 1); q.push(l); }
  }
}
const sm = [...(await (await fetch(B + '/sitemap.xml')).text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname.replace(/\/$/, '') || '/');
const orphans = sm.filter((p) => !seen.has(p)); const notInSitemap = [...seen.keys()].filter((p) => !sm.includes(p));
const depths = [...seen.values()]; const minIn = [...seen.keys()].filter((p) => p !== '/').map((p) => [p, inbound.get(p) ?? 0]).sort((a, b) => a[1] - b[1]).slice(0, 5);
console.log('crawled', seen.size, 'sitemap', sm.length, 'max depth', Math.max(...depths));
console.log('orphans (in sitemap, unreachable):', orphans.length ? orphans : 'none');
console.log('reachable but not in sitemap:', notInSitemap.length ? notInSitemap : 'none');
console.log('bad:', bad.length ? bad : 'none');
console.log('fewest inbound (pages linking in):', minIn.map(([p, n]) => `${p}=${n}`).join(', '));
if (orphans.length || notInSitemap.length || bad.length) process.exit(1);
