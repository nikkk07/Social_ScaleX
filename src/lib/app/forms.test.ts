// Pure-function checks for sign-up and Instagram search input. Run with: npm run test:unit
import { LoginInput, normalizeMobile, parseInstagramInput, prettyMobile, ProfileInput, RegisterInput } from './forms';

declare const process: { exit(code: number): never };

let failures = 0;
function check(name: string, cond: boolean): void {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`);
  if (!cond) failures++;
}

// mobile
check('plain 10 digits', normalizeMobile('9876543210') === '+919876543210');
check('spaces and dashes', normalizeMobile('98765-43 210') === '+919876543210');
check('+91 prefix', normalizeMobile('+91 98765 43210') === '+919876543210');
check('91 prefix', normalizeMobile('919876543210') === '+919876543210');
check('leading 0', normalizeMobile('09876543210') === '+919876543210');
check('starts with 5 rejected', normalizeMobile('5876543210') === null);
check('9 digits rejected', normalizeMobile('987654321') === null);
check('letters rejected', normalizeMobile('abcdefghij') === null);
check('pretty', prettyMobile('+919876543210') === '98765 43210');

// register
const good = { name: 'Rajan', mobile: '98765 43210', whatsappSame: true, email: 'Rajan@Gmail.com', password: 'secret123', confirm: 'secret123' };
const r1 = RegisterInput.safeParse(good);
check('valid register', r1.success && r1.data.whatsapp === '+919876543210' && r1.data.email === 'rajan@gmail.com');
check('any email domain allowed', RegisterInput.safeParse({ ...good, email: 'a@yahoo.co.in' }).success);
check('password mismatch', !RegisterInput.safeParse({ ...good, confirm: 'secret124' }).success);
check('short password', !RegisterInput.safeParse({ ...good, password: 'abc', confirm: 'abc' }).success);
check('bad email', !RegisterInput.safeParse({ ...good, email: 'rajan@gmail' }).success);
check('separate WhatsApp required', !RegisterInput.safeParse({ ...good, whatsappSame: false, whatsapp: '' }).success);
const r2 = RegisterInput.safeParse({ ...good, whatsappSame: false, whatsapp: '9123456780' });
check('separate WhatsApp kept', r2.success && r2.data.whatsapp === '+919123456780');
check('one-letter name rejected', !RegisterInput.safeParse({ ...good, name: 'R' }).success);

// profile
check('profile ok', ProfileInput.safeParse({ name: 'Riya', mobile: '9876543210', whatsappSame: true }).success);
check('login needs password', !LoginInput.safeParse({ identifier: 'a@b.co', password: '' }).success);

// instagram search input
check('plain username', parseInstagramInput('saini_telecom__') === 'saini_telecom__');
check('@ and caps', parseInstagramInput('@PraGO.Outdoors ') === 'prago.outdoors');
check('profile link', parseInstagramInput('https://www.instagram.com/prago.outdoors/?igsh=abc') === 'prago.outdoors');
check('short link', parseInstagramInput('instagr.am/social_scalex') === 'social_scalex');
check('post link is not a user', parseInstagramInput('https://www.instagram.com/p/Cxyz123/') === null);
check('spaces rejected', parseInstagramInput('my shop') === null);
check('too long rejected', parseInstagramInput('a'.repeat(31)) === null);
check('double dot rejected', parseInstagramInput('a..b') === null);
check('empty', parseInstagramInput('  ') === null);

if (failures) {
  console.log(`\n${failures} forms check(s) failed`);
  process.exit(1);
}
console.log('\nall forms checks pass');
