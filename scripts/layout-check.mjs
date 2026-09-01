#!/usr/bin/env node
/* ─────────────────────────────────────────────────────────────────────
 * Layout assertions that only a real browser can make.
 *
 * WHY THIS EXISTS. Standing decision, tokens.css: an absolutely positioned
 * element must never sit inside a transformed or animated wrapper (.reveal,
 * .rise-in, .parallax-layer), because a transformed ancestor becomes the
 * containing block and the child anchors to the wrapper instead of the
 * intended parent. That bug is invisible to TypeScript, invisible to the
 * build, and invisible in the HTML — it only exists in geometry. So the
 * rule is enforced in geometry: every section whose layout depends on it
 * keeps a rectangle-intersection assertion here, permanently.
 *
 * Usage:
 *   npm run build && npm run start &     # or any running server
 *   npm run test:layout                  # BASE_URL overrides localhost:3000
 *
 * Add a section by pushing a checker into SECTIONS. Keep assertions about
 * geometry and computed style; content and schema belong in unit checks.
 *
 * Two traps worth knowing before you write an assertion here:
 *   - Tailwind v4 emits `rotate: 180deg` as an independent property, not a
 *     `transform` matrix. Reading `transform` reports `none` on a correctly
 *     rotated element.
 *   - `el.focus()` from script does not put an element into :focus-visible.
 *     A focus-ring assertion has to come from real keyboard input.
 * ───────────────────────────────────────────────────────────────────── */

import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const VIEWPORTS = [
  { name: '390', width: 390, height: 844 },
  { name: '768', width: 768, height: 1024 },
  { name: '1440', width: 1440, height: 900 },
];

const failures = [];
let checks = 0;

function ok(cond, msg, ctx) {
  checks++;
  if (!cond) failures.push(`${ctx} — ${msg}`);
  if (process.env.VERBOSE) console.log(`  ${cond ? 'ok  ' : 'FAIL'}  ${msg}`);
}

/** Do two DOMRects share any area at all? */
const overlaps = (a, b) =>
  a.x < b.x + b.width && b.x < a.x + a.width &&
  a.y < b.y + b.height && b.y < a.y + a.height;

/** Is `inner` fully within `outer`, allowing a pixel of rounding slack? */
const contains = (outer, inner, slack = 1) =>
  inner.x >= outer.x - slack &&
  inner.y >= outer.y - slack &&
  inner.x + inner.width <= outer.x + outer.width + slack &&
  inner.y + inner.height <= outer.y + outer.height + slack;

/* ── FAQ ──────────────────────────────────────────────────────────────
 * Every row is a <details> inside its own .reveal wrapper. The wrapper is
 * transformed, so this is exactly the shape the standing rule governs:
 * nothing inside a row may be positioned against anything but the row.
 */
async function checkFaq(page, ctx) {
  const section = page.locator('#faq');
  if (!(await section.count())) return;

  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  const sectionBox = await section.boundingBox();
  const rows = section.locator('details');
  const count = await rows.count();
  ok(count > 0, 'FAQ renders at least one row', ctx);

  const boxes = [];
  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    const rowBox = await row.boundingBox();
    const question = await row.locator('h3').boundingBox();
    const chevron = await row.locator('svg').boundingBox();
    boxes.push(rowBox);

    ok(contains(sectionBox, rowBox), `row ${i + 1} sits inside #faq`, ctx);
    ok(contains(rowBox, question), `row ${i + 1} question sits inside its own row`, ctx);
    ok(contains(rowBox, chevron), `row ${i + 1} chevron sits inside its own row`, ctx);
    ok(!overlaps(question, chevron), `row ${i + 1} question and chevron do not overlap`, ctx);
    ok(chevron.x > question.x + question.width - 1, `row ${i + 1} chevron follows the question`, ctx);
  }

  for (let i = 1; i < boxes.length; i++) {
    ok(boxes[i].y >= boxes[i - 1].y + boxes[i - 1].height - 1,
       `row ${i + 1} stacks below row ${i} without overlapping`, ctx);
  }

  // Disclosure works with no JavaScript of ours.
  const second = rows.nth(1);
  const closedHeight = (await second.boundingBox()).height;
  await second.locator('summary').click();
  await page.waitForTimeout(200);
  ok(await second.evaluate((el) => el.open), 'a closed row opens on click', ctx);
  ok((await second.boundingBox()).height > closedHeight, 'an opened row grows', ctx);
  await second.locator('summary').click();
  await page.waitForTimeout(200);
  ok(!(await second.evaluate((el) => el.open)), 'an opened row closes again', ctx);

  // Row 3, not the row toggled above: a just-closed chevron is still
  // transitioning back through intermediate angles when this reads it.
  ok(await rows.nth(0).locator('svg').evaluate((el) => getComputedStyle(el).rotate) === '180deg',
     'the open row chevron is rotated', ctx);
  ok(await rows.nth(2).locator('svg').evaluate((el) => getComputedStyle(el).rotate) === 'none',
     'a closed row chevron is not rotated', ctx);

  // Keyboard focus must be visible. This section once carried
  // `focus-visible:outline-none` with no replacement, which silently removed
  // the global ring from every question on the page.
  const summary = section.locator('summary').first();
  await summary.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  const ring = await summary.evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      focusVisible: el.matches(':focus-visible'),
      style: s.outlineStyle,
      width: parseFloat(s.outlineWidth),
    };
  });
  ok(ring.focusVisible, 'a question matches :focus-visible under keyboard focus', ctx);
  ok(ring.style === 'solid' && ring.width >= 2, 'a keyboard-focused question shows an outline', ctx);
}

/* ── Whole-page invariants ───────────────────────────────────────────── */
async function checkPage(page, ctx, width) {
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  ok(scrollWidth <= width + 1, `no horizontal overflow (scrollWidth ${scrollWidth} ≤ ${width})`, ctx);
}

const SECTIONS = [{ path: '/', run: checkFaq }];

const browser = await chromium.launch();
try {
  for (const { path, run } of SECTIONS) {
    for (const vp of VIEWPORTS) {
      const ctx = `${path} @ ${vp.name}px`;
      if (process.env.VERBOSE) console.log(`\n── ${ctx}`);
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      try {
        await page.goto(BASE + path, { waitUntil: 'networkidle' });
        await run(page, ctx);
        await checkPage(page, ctx, vp.width);
      } finally {
        await page.close();
      }
    }
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(`\nLAYOUT CHECKS FAILED (${failures.length} of ${checks})`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`ALL LAYOUT CHECKS PASS (${checks})`);
