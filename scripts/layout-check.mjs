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

  // Interactive glass must actually brighten. This is the assertion that was
  // missing while `hover:border-white/20` sat on every card doing nothing:
  // the class was present, so any class-presence check would have passed.
  const card = page.locator('.glass-hover').first();
  if (await card.count()) {
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    const rest = await card.evaluate((el) => getComputedStyle(el).borderColor);
    await card.hover();
    await page.waitForTimeout(350);
    const hovered = await card.evaluate((el) => getComputedStyle(el).borderColor);
    ok(hovered !== rest, `interactive glass brightens on hover (${rest} → ${hovered})`, ctx);
    ok(hovered === 'rgba(255, 255, 255, 0.18)', `hover resolves to --color-stroke-strong (${hovered})`, ctx);
  }
}

/* ── Contact ──────────────────────────────────────────────────────────
 * Geometry plus the invariants that make the form safe to ship: one primary
 * action, a keyboard-visible focus ring, and validation errors that are
 * announced rather than merely coloured.
 */
async function checkContact(page, ctx) {
  const section = page.locator('#contact');
  if (!(await section.count())) return;

  await section.scrollIntoViewIfNeeded();
  // The form arrives in a next/dynamic chunk; before it lands the panel shows
  // the phone/WhatsApp fallback, which is a valid state but not the one under
  // test here.
  await section.locator('form').first().waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(200);

  const sectionBox = await section.boundingBox();
  const panel = section.locator('form').first();
  ok(contains(sectionBox, await panel.boundingBox(), 2), 'the form sits inside #contact', ctx);

  // Exactly one primary action per tab. Two different treatments for the same
  // act is what this phase removed.
  const submits = section.locator('button[type="submit"]');
  ok(await submits.count() === 1, `exactly one submit button per tab (${await submits.count()})`, ctx);
  const cta = await submits.first().evaluate((el) => getComputedStyle(el).backgroundColor);
  ok(cta === 'rgb(34, 211, 238)', `the submit button wears the CTA accent (${cta})`, ctx);

  // Submitting empty must produce announced, associated errors.
  await submits.first().click();
  await page.waitForTimeout(400);
  const alerts = section.locator('[role="alert"]');
  ok(await alerts.count() >= 2, `validation errors are announced via role=alert (${await alerts.count()})`, ctx);

  const firstInput = section.locator('input#cb-name');
  ok(await firstInput.getAttribute('aria-invalid') === 'true', 'an invalid field is marked aria-invalid', ctx);
  const describedBy = await firstInput.getAttribute('aria-describedby');
  ok(!!describedBy, 'an invalid field points at its message via aria-describedby', ctx);
  if (describedBy) {
    const msg = section.locator(`#${describedBy}`);
    ok(await msg.count() === 1, 'aria-describedby resolves to exactly one element', ctx);
    ok(((await msg.innerText()).trim().length > 0), 'the referenced message is not empty', ctx);
  }

  // The invalid border must actually paint. `.liquid-glass-inset` owns the
  // `border` shorthand from theme.css, which is outside Tailwind's utilities
  // layer — so a `aria-[invalid=true]:border-*` utility at the call site is
  // silently dead, and an invalid field looks identical to an untouched one.
  const invalidBorder = await firstInput.evaluate((el) => getComputedStyle(el).borderColor);
  const cleanBorder = await section.locator('input#cb-time').evaluate((el) => getComputedStyle(el).borderColor);
  ok(invalidBorder === 'rgb(248, 113, 113)', `an invalid field paints the critical border (${invalidBorder})`, ctx);
  ok(invalidBorder !== cleanBorder, 'an invalid field is visually distinct from an untouched one', ctx);

  // The live region must be present BEFORE it has anything to say, or its
  // first message goes unannounced.
  const live = section.locator('[role="status"][aria-live="polite"]');
  ok(await live.count() >= 1, 'a persistent live region exists for submit outcomes', ctx);

  // Inputs keep the global focus ring; no `focus:outline-none` survives here.
  await firstInput.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  const ring = await firstInput.evaluate((el) => {
    const s = getComputedStyle(el);
    return { fv: el.matches(':focus-visible'), style: s.outlineStyle, width: parseFloat(s.outlineWidth) };
  });
  ok(ring.fv && ring.style === 'solid' && ring.width >= 2, 'a focused input shows the keyboard ring', ctx);

  // The honeypot is off-screen, not display:none — a bot that skips hidden
  // fields should still fill it.
  const pot = section.locator('input[name="company"]');
  ok(await pot.count() === 1, 'exactly one honeypot field is present', ctx);
  const potBox = await pot.boundingBox();
  ok(potBox === null || potBox.x < -1000, 'the honeypot is positioned off-screen', ctx);
  ok(await pot.evaluate((el) => el.tabIndex) === -1, 'the honeypot is out of the tab order', ctx);
}

/* ── Footer ───────────────────────────────────────────────────────────
 * Every assertion here reads a COMPUTED PROPERTY, never a class name. The
 * standing rule exists because a class-presence check passes happily while
 * the property it implies is being overridden by a component class that owns
 * it — which is exactly how the contact form shipped a dead invalid border.
 */
async function checkFooter(page, ctx) {
  const footer = page.locator('footer');
  if (!(await footer.count())) return;

  await footer.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  const footerBox = await footer.boundingBox();

  // The gradient wordmark must actually paint. `.text-growth` sets
  // `-webkit-text-fill-color: transparent` and clips a background to the
  // glyphs; if anything else wins the `background` the text renders invisible
  // rather than wrong, and nothing else on the page would show it.
  const mark = footer.locator('.text-growth').first();
  if (await mark.count()) {
    const paint = await mark.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        clip: s.webkitBackgroundClip || s.backgroundClip,
        fill: s.webkitTextFillColor,
        image: s.backgroundImage,
      };
    });
    ok(paint.clip === 'text', `the wordmark clips its background to the text (${paint.clip})`, ctx);
    ok(paint.image.includes('gradient'), 'the wordmark still has a gradient to clip', ctx);
    ok(paint.fill === 'rgba(0, 0, 0, 0)', `the wordmark fill is transparent (${paint.fill})`, ctx);
    const markBox = await mark.boundingBox();
    ok(markBox.width > 0 && markBox.height > 0, 'the wordmark occupies real space', ctx);
  }

  // Footer text must be on the ink ramp, not raw white alphas.
  const tagline = footer.locator('p').first();
  const taglineColor = await tagline.evaluate((el) => getComputedStyle(el).color);
  ok(taglineColor.includes('244, 243, 248'), `footer copy uses the ink ramp (${taglineColor})`, ctx);

  // Hover state resolves to the one interactive accent — asserted by reading
  // the colour after a real hover, not by looking for `hover:text-cta`.
  const link = footer.locator('nav a').first();
  const before = await link.evaluate((el) => getComputedStyle(el).color);
  await link.hover();
  await page.waitForTimeout(250);
  const after = await link.evaluate((el) => getComputedStyle(el).color);
  ok(after === 'rgb(34, 211, 238)', `a footer link hovers to the CTA accent (${after})`, ctx);
  ok(before !== after, 'the hover colour actually differs from the resting colour', ctx);

  // Every published phone renders as a real tel: link inside the footer.
  const tels = footer.locator('a[href^="tel:"]');
  ok(await tels.count() >= 1, `footer publishes tel: links (${await tels.count()})`, ctx);
  for (let i = 0; i < await tels.count(); i++) {
    ok(contains(footerBox, await tels.nth(i).boundingBox(), 2), `tel link ${i + 1} sits inside the footer`, ctx);
  }

  // No link may point at a placeholder.
  const hrefs = await footer.locator('a[href]').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
  ok(!hrefs.some((h) => h === '#' || h === ''), 'no footer link points at a placeholder', ctx);
}

/* ── Legal shell ──────────────────────────────────────────────────────
 * /privacy and /terms share one component, so one of them proves both. The
 * assertions are colour-resolution rather than class presence: the whole
 * point of migrating this shell was that its ink was raw white alphas.
 */
async function checkLegal(page, ctx) {
  const h2 = page.locator('h2').first();
  if (!(await h2.count())) return;

  ok((await h2.evaluate((el) => getComputedStyle(el).color)).includes('244, 243, 248'),
     'legal headings resolve to the ink ramp', ctx);
  const prose = await page.locator('section p').first().evaluate((el) => getComputedStyle(el).color);
  ok(prose.includes('244, 243, 248'), `legal prose resolves to the ink ramp (${prose})`, ctx);
  const tel = await page.locator('a[href^="tel:"]').first().evaluate((el) => getComputedStyle(el).color);
  ok(tel === 'rgb(34, 211, 238)', `the legal contact link is the CTA accent (${tel})`, ctx);

  // The escaped apostrophes must still render as apostrophes, not entities.
  const text = await page.locator('body').innerText();
  ok(!text.includes('&apos;') && !text.includes('&#x27;'), 'no raw HTML entity leaks into the rendered text', ctx);
}

const SECTIONS = [
  {
    path: '/',
    run: async (page, ctx) => {
      await checkFaq(page, ctx);
      await checkContact(page, ctx);
      await checkFooter(page, ctx);
    },
  },
  { path: '/privacy', run: checkLegal },
  { path: '/terms', run: checkLegal },
];

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
