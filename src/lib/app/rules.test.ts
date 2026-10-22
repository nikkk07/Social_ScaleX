// Pure-function checks for comment-to-DM matching. Run with: npm run test:unit
import { AutomationInput, cleanKeywords, matchesKeyword, normalize, personalize, pickReply, pickRule, type RuleForMatch } from './rules';

declare const process: { exit(code: number): never };

let failures = 0;
function check(name: string, cond: boolean): void {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`);
  if (!cond) failures++;
}

// normalize
check('normalize lowercases and strips punctuation', normalize('PRICE?!') === 'price');
check('normalize collapses spaces', normalize('  price   list ') === 'price list');
check('normalize keeps Hindi letters', normalize('दाम बताओ') === 'दाम बताओ');
check('normalize keeps emoji', normalize('🔥🔥') === '🔥🔥');

// keyword matching
check('exact word', matchesKeyword('PRICE', 'price'));
check('word inside sentence', matchesKeyword('what is the price pls', 'Price'));
check('word with punctuation', matchesKeyword('Price?', 'price'));
check('no partial word', !matchesKeyword('priceless', 'price'));
check('phrase match', matchesKeyword('send me the price list!', 'price list'));
check('phrase not split', !matchesKeyword('price of the list', 'price list'));
check('Hindi keyword', matchesKeyword('भैया दाम बताओ', 'दाम'));
check('Hinglish keyword', matchesKeyword('Bhai rate kya hai', 'rate'));
check('emoji keyword', matchesKeyword('😍🔥', '🔥'));
check('emoji keyword absent', !matchesKeyword('nice', '🔥'));
check('empty keyword never matches', !matchesKeyword('anything', '   '));
check('@mention does not break match', matchesKeyword('@friend LINK', 'link'));

// cleanKeywords
const ck = cleanKeywords(['Price', 'price', ' PRICE ', 'link', '']);
check('cleanKeywords de-duplicates case-insensitively', ck.length === 2 && ck[0] === 'Price' && ck[1] === 'link');

// pickRule
const base = { is_enabled: true, keywords: [] as string[], media_ids: [] as string[] };
const rules: RuleForMatch[] = [
  { ...base, id: 'all-any', media_scope: 'all', trigger_mode: 'any', created_at: '2026-01-01' },
  { ...base, id: 'all-kw', media_scope: 'all', trigger_mode: 'keywords', keywords: ['price'], created_at: '2026-01-02' },
  { ...base, id: 'sel-any', media_scope: 'selected', media_ids: ['111'], trigger_mode: 'any', created_at: '2026-01-03' },
  { ...base, id: 'sel-kw', media_scope: 'selected', media_ids: ['111'], trigger_mode: 'keywords', keywords: ['link'], created_at: '2026-01-04' },
  { ...base, id: 'off', media_scope: 'all', trigger_mode: 'any', is_enabled: false, created_at: '2025-01-01' },
];
check('selected+keyword wins on its post', pickRule(rules, '111', 'LINK please')?.id === 'sel-kw');
check('selected+any beats all-posts keyword', pickRule(rules, '111', 'price')?.id === 'sel-any');
check('all-posts keyword on other post', pickRule(rules, '222', 'price?')?.id === 'all-kw');
check('all-posts any on other post', pickRule(rules, '222', 'nice')?.id === 'all-any');
check('disabled rule ignored', pickRule([rules[4] as RuleForMatch], '222', 'x') === null);
check('no media id: selected rules skipped', pickRule(rules.slice(2, 4), null, 'link') === null);
check('nothing matches', pickRule([rules[1] as RuleForMatch], '222', 'hello') === null);

// personalize / pickReply
check('personalize username', personalize('Hi {username}, check DMs', 'riya') === 'Hi @riya, check DMs');
check('personalize strips extra @', personalize('{USERNAME}!', '@riya') === '@riya!');
check('personalize missing username', personalize('Hi {username}', null) === 'Hi there');
check('pickReply empty', pickReply([], 'x') === null);
check('pickReply stable', pickReply(['a', 'b', 'c'], 'seed') === pickReply(['a', 'b', 'c'], 'seed'));

// validation
const ok = AutomationInput.safeParse({
  name: 'Price list', mediaScope: 'all', media: [], triggerMode: 'keywords', keywords: ['price'],
  publicReplies: ['Sent! Check your DMs {username}'], dmText: 'Here is the price list: https://x.com',
});
check('valid input passes', ok.success);
const noKw = AutomationInput.safeParse({
  name: 'x', mediaScope: 'all', media: [], triggerMode: 'keywords', keywords: [], publicReplies: [], dmText: 'hi',
});
check('keywords mode needs a keyword', !noKw.success);
const noMedia = AutomationInput.safeParse({
  name: 'x', mediaScope: 'selected', media: [], triggerMode: 'any', keywords: [], publicReplies: [], dmText: 'hi',
});
check('selected mode needs media', !noMedia.success);
const longDm = AutomationInput.safeParse({
  name: 'x', mediaScope: 'all', media: [], triggerMode: 'any', keywords: [], publicReplies: [], dmText: 'a'.repeat(1001),
});
check('DM over 1000 chars rejected', !longDm.success);

if (failures) {
  console.log(`\n${failures} rules check(s) failed`);
  process.exit(1);
}
console.log('\nall rules checks pass');
