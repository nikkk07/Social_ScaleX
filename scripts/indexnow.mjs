// Tells Bing, Yandex and the other IndexNow engines that every page in the
// sitemap is new or updated. Run after each production deploy:
//   BASE=https://socialscalex.in npm run indexnow
// The key file is public/<key>.txt; the key proves we own the host.
const KEY = 'a7ed10d4cdc3f3e76c5bb3e9d82b79ca';
const BASE = (process.env.BASE ?? 'https://www.socialscalex.in').replace(/\/$/, '');
const host = new URL(BASE).host;

const xml = await (await fetch(BASE + '/sitemap.xml')).text();
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter((u) => new URL(u).host === host);
if (!urlList.length) throw new Error('No URLs for ' + host + ' in the sitemap. Is NEXT_PUBLIC_SITE_URL set to this host?');

const keyCheck = await fetch(BASE + '/' + KEY + '.txt');
if (!keyCheck.ok || (await keyCheck.text()).trim() !== KEY) throw new Error('Key file not served at ' + BASE + '/' + KEY + '.txt');

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key: KEY, keyLocation: BASE + '/' + KEY + '.txt', urlList }),
});
console.log('IndexNow', res.status, res.statusText, '-', urlList.length, 'URLs submitted for', host);
if (res.status >= 400) process.exit(1);
