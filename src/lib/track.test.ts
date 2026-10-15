// Pure-function checks for contact-link detection. Run with: npm run test:unit
import { contactMethod } from './track';

declare const process: { exit(code: number): never };

let failures = 0;
function check(name: string, cond: boolean): void {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`);
  if (!cond) failures++;
}

check('tel link → phone', contactMethod('tel:+918077727669') === 'phone');
check('mailto link → email', contactMethod('mailto:info@socialscalex.in') === 'email');
check('wa.me link → whatsapp', contactMethod('https://wa.me/918077727669') === 'whatsapp');
check('wa.me with prefilled text → whatsapp', contactMethod('https://wa.me/918077727669?text=Hi%20there') === 'whatsapp');
check('api.whatsapp.com → whatsapp', contactMethod('https://api.whatsapp.com/send?phone=918077727669') === 'whatsapp');
check('uppercase scheme still matches', contactMethod('TEL:+918077727669') === 'phone');
check('internal path → null', contactMethod('/services/meta-ads') === null);
check('Instagram profile → null', contactMethod('https://www.instagram.com/social_scalex/') === null);
check('look-alike host → null', contactMethod('https://wa.me.example.com/918077727669') === null);
check('empty href → null', contactMethod('') === null);

if (failures) {
  console.log(`\n${failures} track check(s) failed`);
  process.exit(1);
}
console.log('\nall track checks pass');
