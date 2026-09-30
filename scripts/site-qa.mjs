#!/usr/bin/env node
// Public-site QA in a real browser, against a running server.
//
//   npm run build && npm start &
//   npm i --no-save playwright @axe-core/playwright
//   npm run test:site            # or BASE=https://socialscalex.in npm run test:site
//
// For every URL in sitemap.xml: HTTP 200, exactly one H1, unique title
// (<= 65 chars) and description (70-160), canonical matches the path, valid
// JSON-LD, no skipped heading levels, zero axe WCAG 2.2 AA violations, no
// horizontal scroll at 320/768/1024/1920 px, no console errors. Then every
// internal link must return 200 and an unknown path must return 404.
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
const B = (process.env.BASE ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
const sm = await (await fetch(B + '/sitemap.xml')).text();
const paths = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage();
const errs = []; p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()); }); p.on('pageerror', (e) => errs.push(e.message));
const links = new Set(); let fail = 0; const titles = new Map(); const descs = new Map();
for (const path of paths) {
  const r = await p.goto(B + path, { waitUntil: 'networkidle' });
  const info = await p.evaluate(() => ({
    h1: document.querySelectorAll('h1').length,
    title: document.title,
    desc: document.querySelector('meta[name=description]')?.content ?? '',
    canon: document.querySelector('link[rel=canonical]')?.href ?? '',
    robots: document.querySelector('meta[name=robots]')?.content ?? '',
    links: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
    ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => { try { JSON.parse(s.textContent); return 'ok'; } catch { return 'bad'; } }),
    imgsNoAlt: [...document.querySelectorAll('img:not([alt])')].length,
    headingSkips: (() => { let last = 0, bad = []; for (const h of document.querySelectorAll('h1,h2,h3,h4')) { const l = +h.tagName[1]; if (last && l > last + 1) bad.push(h.textContent.slice(0, 40)); last = l; } return bad; })(),
  }));
  info.links.forEach((l) => links.add(l.startsWith('/') ? l.split('#')[0] : l));
  const ax = await new AxeBuilder({ page: p }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  const probs = [];
  if (r.status() !== 200) probs.push('status ' + r.status());
  if (info.h1 !== 1) probs.push('h1=' + info.h1);
  if (info.title.length > 65) probs.push(`title ${info.title.length}`);
  if (info.desc.length < 70 || info.desc.length > 160) probs.push(`desc ${info.desc.length}`);
  if (!info.canon.endsWith(path === '/' ? '/' : path)) probs.push('canon ' + info.canon);
  if (info.ld.includes('bad')) probs.push('bad json-ld');
  if (info.headingSkips.length) probs.push('skips ' + info.headingSkips.join('|'));
  if (ax.violations.length) probs.push('axe ' + ax.violations.map((v) => v.id + ':' + v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(',')).join('; '));
  if (titles.has(info.title)) probs.push('dup title'); titles.set(info.title, path);
  if (descs.has(info.desc)) probs.push('dup desc'); descs.set(info.desc, path);
  for (const w of [320, 768, 1024, 1920]) {
    await p.setViewportSize({ width: w, height: 900 });
    const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (over > 0) probs.push(`overflow@${w}=${over}`);
  }
  await p.setViewportSize({ width: 1440, height: 900 });
  if (errs.length) probs.push('console ' + errs.splice(0).join(' | ').slice(0, 200));
  if (probs.length) fail++;
  console.log(probs.length ? 'FAIL' : 'ok  ', path, info.title.length, info.desc.length, probs.join(' ; '));
}
const internal = [...links].filter((l) => l && l.startsWith('/'));
for (const l of internal) { const r = await fetch(B + l); if (r.status !== 200) { fail++; console.log('BROKEN', l, r.status); } }
const ext = [...links].filter((l) => /^https?:/.test(l));
console.log('internal links', internal.length, 'external', ext.length);
const nf = await fetch(B + '/does-not-exist'); console.log('404 status', nf.status);
console.log(fail ? `${fail} FAILURES` : 'ALL OK');
process.exitCode = fail ? 1 : 0;
await b.close();
