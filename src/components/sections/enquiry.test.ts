// Pure-function checks for the contact-form throttle. Run with: npm run test:unit
import {
  checkThrottle,
  pruneSends,
  MIN_GAP_MS,
  WINDOW_MS,
  MAX_PER_WINDOW,
} from './submitEnquiry';

declare const process: { exit(code: number): never };

let failures = 0;
function check(name: string, cond: boolean, detail = ''): void {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${!cond && detail ? `  — ${detail}` : ''}`);
  if (!cond) failures++;
}

const NOW = 1_800_000_000_000;

// ── First-ever send ─────────────────────────────────────────────────────
check('no history → allowed', checkThrottle([], NOW).allowed);

// ── Minimum gap between consecutive sends ───────────────────────────────
check(
  'immediate double-tap → blocked',
  checkThrottle([NOW], NOW).allowed === false,
);
check(
  'double-tap reason is too-soon',
  checkThrottle([NOW], NOW).reason === 'too-soon',
);
check(
  '1ms before the gap elapses → still blocked',
  checkThrottle([NOW - (MIN_GAP_MS - 1)], NOW).allowed === false,
);
check(
  'exactly at the gap → allowed (boundary is inclusive)',
  checkThrottle([NOW - MIN_GAP_MS], NOW).allowed,
);
check(
  'retryAfterMs counts down rather than repeating the full gap',
  checkThrottle([NOW - 10_000], NOW).retryAfterMs === MIN_GAP_MS - 10_000,
  String(checkThrottle([NOW - 10_000], NOW).retryAfterMs),
);

// ── Rolling hourly cap ──────────────────────────────────────────────────
// Spread far enough apart that MIN_GAP never fires — this isolates the cap.
const spread = (n: number, from: number) =>
  Array.from({ length: n }, (_, i) => from - (i + 1) * MIN_GAP_MS * 2);

check(
  `${MAX_PER_WINDOW - 1} sends this hour → still allowed`,
  checkThrottle(spread(MAX_PER_WINDOW - 1, NOW), NOW).allowed,
);
check(
  `${MAX_PER_WINDOW} sends this hour → blocked`,
  checkThrottle(spread(MAX_PER_WINDOW, NOW), NOW).allowed === false,
);
check(
  'hourly block reports the hourly-cap reason, not too-soon',
  checkThrottle(spread(MAX_PER_WINDOW, NOW), NOW).reason === 'hourly-cap',
  String(checkThrottle(spread(MAX_PER_WINDOW, NOW), NOW).reason),
);

// The window ROLLS: sends older than an hour must stop counting, or a visitor
// who sent 5 enquiries last week would be locked out forever.
const lastWeek = Array.from({ length: 20 }, (_, i) => NOW - WINDOW_MS - i * 1000);
check('sends older than the window are ignored', checkThrottle(lastWeek, NOW).allowed);
check(
  'a full hour of old sends + one recent → gap rule applies, not the cap',
  checkThrottle([...lastWeek, NOW - 1000], NOW).reason === 'too-soon',
);

// ── Pruning keeps stored history bounded ────────────────────────────────
check('pruneSends drops out-of-window entries', pruneSends(lastWeek, NOW).length === 0);
check(
  'pruneSends keeps in-window entries',
  pruneSends([NOW - 1000, NOW - WINDOW_MS - 1], NOW).length === 1,
);

// ── Ordering must not matter (localStorage could hold any order) ─────────
check(
  'unsorted history still finds the most recent send',
  checkThrottle([NOW - 100_000, NOW - 500, NOW - 50_000], NOW).allowed === false,
);

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
