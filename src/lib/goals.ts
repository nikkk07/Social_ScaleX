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
    faqs: [
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
      { metric: 'Sends and shares', why: 'The signal Instagram weighs most for reaching people who don’t follow you.' },
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
    faqs: [
      {
        q: 'How do you measure brand awareness on Instagram?',
        a: 'With reach to non-followers, shares and sends, profile visits and new follows, all from your own Insights. Ad campaigns add reach and frequency from Meta Ads Manager.',
      },
      {
        q: 'How long does brand growth take?',
        a: 'The first month sets the content and tests formats. Most accounts show measurable movement in reach by day 60 and compounding growth from day 90.',
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
    faqs: [
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
