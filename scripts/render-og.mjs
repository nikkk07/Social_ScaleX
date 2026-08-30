// ─────────────────────────────────────────────────────────────────────
// Renders public/og-image.svg -> public/og-image.png at exactly 1200x630.
//
// Why a script and not a one-liner: the obvious macOS command,
// `qlmanage -t -s 1200`, pads its output to a SQUARE and silently writes
// 1200x1200. Facebook, WhatsApp, LinkedIn and X all crop or reject that.
// This renders at the SVG's real viewBox and asserts the result, so a wrong
// size fails loudly instead of shipping.
//
// Run: npm run og   (needs playwright: npm i --no-save playwright)
// ─────────────────────────────────────────────────────────────────────
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import path from 'node:path';

const W = 1200;
const H = 630;
const SRC = path.resolve('public/og-image.svg');
const OUT = path.resolve('public/og-image.png');

const browser = await chromium.launch();
// deviceScaleFactor 1: OG images are served at literal pixel size, so a 2x
// render would emit 2400x1260 and break the contract.
const ctx = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
});
const page = await ctx.newPage();
await page.goto(`file://${SRC}`);
await page.evaluate(() => document.fonts?.ready);
await page.screenshot({ path: OUT, clip: { x: 0, y: 0, width: W, height: H } });
await browser.close();

// Assert, don't assume.
const out = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', OUT], {
  encoding: 'utf8',
});
const w = Number(out.match(/pixelWidth:\s*(\d+)/)?.[1]);
const h = Number(out.match(/pixelHeight:\s*(\d+)/)?.[1]);
const bytes = statSync(OUT).size;

if (w !== W || h !== H) {
  console.error(`og-image.png is ${w}x${h}, expected ${W}x${H}`);
  process.exit(1);
}
if (bytes > 1_000_000) {
  console.error(`og-image.png is ${bytes} bytes; keep it under 1 MB`);
  process.exit(1);
}
console.log(`og-image.png  ${w}x${h}  ${(bytes / 1024).toFixed(0)} KB  OK`);
