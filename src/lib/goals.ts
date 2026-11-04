// ─────────────────────────────────────────────────────────────────────
// Goal pages: what people search when they know the result they want
// ("increase sales", "brand awareness", "product promotion") but not the
// service. Each maps the goal to the services and automations that serve it.
// ─────────────────────────────────────────────────────────────────────
import type { Faq, Step } from './content';

export interface Goal {
  slug: string;
  name: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  lede: string;
  measures: { metric: string; why: string }[];
  plan: Step[];
  services: string[];
  automations: string[];
  /** Who this goal's plan suits, in the buyer's own terms. */
  fit: string[];
  /** What usually goes wrong for this goal, and why. */
  pitfalls: { title: string; text: string }[];
  /** PORTFOLIO ids shown as proof, and the heading over them. */
  caseIds: string[];
  caseTitle: string;
  /** Guide slugs that go deeper on this goal. */
  guides: string[];
  faqs: Faq[];
}

export const GOALS: Goal[] = [
  {
    slug: 'increase-sales',
    name: 'Increase sales and leads',
    metaTitle: 'Increase Sales & Leads with Social Media',
    metaDescription:
      'Turn Instagram, Facebook and WhatsApp into a sales channel: lead ads, comment-to-DM, Click-to-WhatsApp and tracked ads for Delhi NCR businesses.',
    h1: 'Increase sales and leads with social media',
    lede:
      'Likes don’t pay the rent. We set up social media to bring enquiries and sales: ads that start WhatsApp chats, Reels that end in a DM with a link, lead forms inside Instagram and Facebook, and tracking that shows which rupee brought which customer.',
    measures: [
      { metric: 'Cost per lead', why: 'What each enquiry costs you, from Meta and Google’s own reports.' },
      { metric: 'Chats started', why: 'How many WhatsApp and Instagram conversations each post or ad begins.' },
      { metric: 'Sales from social', why: 'Orders or bookings traced back to a post, DM or ad.' },
    ],
    plan: [
      { title: 'Fix tracking', desc: 'Meta Pixel and Conversions API, Google conversion tracking, and a way to count WhatsApp enquiries.' },
      { title: 'Build the path to buy', desc: 'Every post ends somewhere: a DM, a WhatsApp chat, a form or a product page.' },
      { title: 'Run lead ads', desc: 'Meta lead forms, Click-to-WhatsApp and Google Search ads, tested weekly.' },
      { title: 'Follow up fast', desc: 'Auto-replies and comment-to-DM so no enquiry waits for office hours.' },
    ],
    services: ['meta-ads', 'google-ads', 'instagram-marketing'],
    automations: ['instagram-comment-to-dm', 'whatsapp-automation'],
    fit: [
      'A shop, clinic or service people can visit, call or order from',
      'You already get DMs or WhatsApp questions, but nobody counts them',
      'Someone on your team can reply to enquiries the same day',
    ],
    pitfalls: [
      { title: 'Boosting posts for likes', text: 'A boost buys the engagement you ask it for. For sales, set the ad goal to messages or leads instead.' },
      { title: 'No way to count enquiries', text: 'Without the Meta Pixel, the Conversions API or a WhatsApp count, nobody can say which rupee brought which customer.' },
      { title: 'Slow replies', text: 'An enquiry that waits until tomorrow often goes to whoever answered first. Auto-replies hold the chat until you can.' },
      { title: 'Every post is an offer', text: 'People follow accounts that also show the shop, the team and how things are used. Keep hard offers to the posts and ads built for them.' },
    ],
    caseIds: ['saini-telecom', 'prago', 'big-discount-mart'],
    caseTitle: 'Stores where Instagram is a sales channel',
    guides: ['boost-post-vs-click-to-whatsapp-ads', 'free-instagram-comment-to-dm-automation', 'meta-ads-vs-google-ads'],
    faqs: [
      {
        q: 'Should I use Meta ads or Google Ads for leads?',
        a: 'Google Ads reach people already searching for what you sell. Meta ads reach people who look like your customers but aren’t searching yet. Start with the one that matches how your customers buy; our guide compares both.',
      },
      {
        q: 'How do I know which post or ad brought a sale?',
        a: 'Use a different keyword or offer per post, ask new customers how they found you, and connect the Meta Pixel and Conversions API so Ads Manager reports leads and purchases.',
      },
      {
        q: 'Can social media really increase sales for a small business?',
        a: 'Yes, when every post and ad leads somewhere you can sell: a DM, a WhatsApp chat or a product page. prago.outdoors, an outdoor-gear store we manage, uses Instagram to send people to its store rather than to collect followers.',
      },
      {
        q: 'What is the fastest way to get leads from Instagram?',
        a: 'Paid lead ads and Click-to-WhatsApp ads bring enquiries from day one. Organically, a “comment a keyword” call to action with an automatic DM turns viewers into conversations.',
      },
    ],
  },
  {
    slug: 'brand-awareness',
    name: 'Brand awareness and growth',
    metaTitle: 'Brand Awareness & Brand Growth on Social Media',
    metaDescription:
      'Build brand awareness on Instagram, Facebook and YouTube with original Reels, creator collabs and reach campaigns, measured on real reach, not vanity metrics.',
    h1: 'Brand awareness and brand growth on social media',
    lede:
      'People buy the brand they remember. We build awareness with original Reels made to be shared, creator collaborations that borrow trust, and reach campaigns that put you in front of the right city, then measure it in reach to new people, not follower count.',
    measures: [
      { metric: 'Reach to non-followers', why: 'How many new people saw you, from your own Insights.' },
      { metric: 'Sends and shares', why: 'Instagram’s head has said sends count slightly more when a post reaches people who don’t follow you.' },
      { metric: 'Profile visits and follows', why: 'How many of those new people came to look, and stayed.' },
    ],
    plan: [
      { title: 'Find your story', desc: 'What you want to be known for, in one line your customers would repeat.' },
      { title: 'Make shareable content', desc: 'Original Reels and carousels people send to a friend.' },
      { title: 'Borrow audiences', desc: 'Creator collaborations and collab posts with the right accounts.' },
      { title: 'Amplify', desc: 'Awareness and reach campaigns on Meta and YouTube for the posts that already work.' },
    ],
    services: ['reels-production', 'influencer-marketing', 'instagram-marketing'],
    automations: ['instagram-comment-to-dm'],
    fit: [
      'A new brand, or a known one entering a new city',
      'Customers buy later, so first they need to remember your name',
      'You can show real products, people or places on camera',
    ],
    pitfalls: [
      { title: 'Chasing follower count', text: 'Followers say little about who actually saw you. Reach to non-followers and sends show awareness growing.' },
      { title: 'Reposted or watermarked videos', text: 'Instagram says it shows fewer people Reels already posted on Instagram or carrying another app’s watermark. Original footage travels further.' },
      { title: 'Creators picked by size alone', text: 'A big audience in the wrong city or age group is reach you pay for and can’t use. Check where a creator’s viewers are first.' },
      { title: 'Hidden paid posts', text: 'In India, ASCI requires a clear label such as Ad, Sponsored or Collaboration on paid creator posts.' },
    ],
    caseIds: ['wanna-party', 'acdelhivlogs', 'subh'],
    caseTitle: 'Accounts built on reach and recognition',
    guides: ['instagram-reels-reach', 'increase-instagram-followers', 'choose-social-media-agency'],
    faqs: [
      {
        q: 'Do I need ads for brand awareness?',
        a: 'Not always. Original Reels that people send to friends reach non-followers on their own. Reach campaigns help the posts that already work travel further, to the city you choose.',
      },
      {
        q: 'How do you measure brand awareness on Instagram?',
        a: 'With reach to non-followers, shares and sends, profile visits and new follows, all from your own Insights. Ad campaigns add reach and frequency from Meta Ads Manager.',
      },
      {
        q: 'How long does brand growth take?',
        a: 'Instagram publishes no timeline, and every account starts from a different place. The first month sets the content and tests formats; judge reach to new people over two or three months, not one week.',
      },
    ],
  },
  {
    slug: 'product-launch',
    name: 'Product launch and promotion',
    metaTitle: 'Product Launch & Promotion on Social Media',
    metaDescription:
      'Launch or boost a product on Instagram and Facebook: product shoots, teaser Reels, influencer seeding, comment-to-DM links and launch ads. Delhi NCR.',
    h1: 'Product launch and product promotion on social media',
    lede:
      'A product launch needs noise in the right week. We shoot the product in use, build a teaser-to-launch Reel plan, seed it with creators, send buyers the link by DM when they comment, and run launch ads for the posts that catch on.',
    measures: [
      { metric: 'Launch-week reach', why: 'How many people saw the product in its first days.' },
      { metric: 'Comments and DMs', why: 'Buying intent: people asking for price, size or the link.' },
      { metric: 'Orders from launch posts', why: 'Sales traced to the launch Reels, DMs and ads.' },
    ],
    plan: [
      { title: 'Shoot', desc: 'Product photos and Reels in real use, in one planned shoot.' },
      { title: 'Tease', desc: 'Countdown Reels and stories that build interest before launch day.' },
      { title: 'Seed', desc: 'Creators who fit your audience post with clear ad disclosure.' },
      { title: 'Convert', desc: '“Comment LINK” posts with automatic DMs, and ads on the winners.' },
    ],
    services: ['product-shoots', 'reels-production', 'influencer-marketing'],
    automations: ['instagram-comment-to-dm'],
    fit: [
      'A new product, range or store opening with a date',
      'You can give us the product, or the space, for a shoot day',
      'You want buyers asking for the price or the link, not just liking the post',
    ],
    pitfalls: [
      { title: 'Announcing on launch day only', text: 'With no teasers, launch posts start cold. Tease it for a week or two first so people are waiting.' },
      { title: 'No easy way to buy', text: '“DM for price” loses people at the last step. A keyword comment that sends the link by DM keeps them.' },
      { title: 'Ads before stock and delivery are ready', text: 'Ads that sell out-of-stock products burn budget and goodwill. Start launch ads once the product page and stock are live.' },
      { title: 'Hidden paid posts', text: 'Seeded creator posts still need a clear Ad, Sponsored or Collaboration label under ASCI’s guidelines.' },
    ],
    caseIds: ['prago', 'saini-telecom'],
    caseTitle: 'Stores we shoot products for',
    guides: ['free-instagram-comment-to-dm-automation', 'diwali-social-media-plan', 'boost-post-vs-click-to-whatsapp-ads'],
    faqs: [
      {
        q: 'How early should we start planning a launch?',
        a: 'Plan the shoot two to three weeks ahead, so teaser Reels can run in the week before launch. Festive launches, like Diwali, need booking earlier.',
      },
      {
        q: 'Can you shoot the product at our store?',
        a: 'Yes. We shoot on location across Delhi NCR, from Delhi and Noida to Gurugram, Ghaziabad and Faridabad: your store, office or a place that suits the product.',
      },
      {
        q: 'How do I promote a new product on Instagram?',
        a: 'Show it in use in original Reels, tease it before launch, get relevant creators to post it with clear disclosure, and make buying easy: a keyword comment that sends the link by DM, plus ads on the posts that perform.',
      },
      {
        q: 'Do influencer posts for a product need an “Ad” label?',
        a: 'Yes. In India, ASCI’s guidelines require a clear label such as Ad, Sponsored, Collaboration or Partnership, or the platform’s paid-partnership tag, not hidden among hashtags.',
      },
    ],
  },
];

export function getGoal(slug: string): Goal | undefined {
  return GOALS.find((g) => g.slug === slug);
}
