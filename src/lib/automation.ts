// ─────────────────────────────────────────────────────────────────────
// Automation services: Instagram comment-to-DM, DM auto-reply, WhatsApp,
// Facebook and YouTube. Same rules as content.ts: only what we deliver,
// only facts we can source. Sources: src/lib/guides.ts (S.* entries).
//
// The one public price on the site is PLAN_99 (owner decision, Sep 2026).
// Everything else is quoted on the free strategy call.
// ─────────────────────────────────────────────────────────────────────
import type { Faq, Step } from './content';

export interface Feature {
  title: string;
  desc: string;
}

export interface Automation {
  slug: string;
  name: string;
  /** Short label for menus and cards. */
  short: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  lede: string;
  outcome: string;
  /** Plain-English "what it does" with an example conversation. */
  example: { trigger: string; reply: string };
  features: Feature[];
  steps: Step[];
  useCases: string[];
  faqs: Faq[];
  priced: boolean;
  related: string[];
  guide?: string;
}

export const PLAN_99 = {
  price: 99,
  currency: 'INR',
  period: 'month',
  name: 'Comment-to-DM, done for you',
  includes: [
    '1 Instagram professional account',
    'Unlimited posts and Reels',
    'Unlimited trigger keywords',
    'Setup done by us on Meta’s official tools',
    'DM message and link written for you',
    'Changes any time on WhatsApp',
    'Tool fees included',
  ],
  note: 'Billed monthly. No long contract.',
} as const;

export const AUTOMATIONS: Automation[] = [
  {
    slug: 'instagram-comment-to-dm',
    name: 'Instagram comment-to-DM automation',
    short: 'Comment-to-DM',
    metaTitle: 'Instagram Comment to DM Automation at ₹99/month',
    metaDescription:
      'Auto DM everyone who comments a keyword on your post or Reel. Set up and run for you on Meta’s official tools. ₹99/month, unlimited posts.',
    h1: 'Instagram comment to DM automation for ₹99 a month',
    lede:
      'Someone comments a keyword like “PRICE” on your post or Reel. They get your DM with the link automatically. We set it up on your Instagram through Meta’s official tools and keep it running for ₹99 a month: one account, unlimited posts, tool fees included.',
    outcome: 'Every comment becomes a conversation, even at 2 AM.',
    example: { trigger: 'Comments “PRICE” on your Reel', reply: 'Gets a DM: “Here’s the price list and the order link 👇”' },
    features: [
      { title: 'Keyword triggers', desc: 'Pick the words that start the DM: PRICE, LINK, MENU, INFO. Use them on any post or Reel.' },
      { title: 'Instant DM with your link', desc: 'Send the product page, price list, booking link or WhatsApp number straight to their inbox.' },
      { title: 'Works on every post', desc: 'Unlimited posts and Reels on one account. Add a new keyword whenever you post.' },
      { title: 'Official and safe', desc: 'Runs on Meta’s own automation tools. No password sharing, no bots logging into your account.' },
      { title: 'Written for you', desc: 'We write the DM so it reads like you, and label it as automated, as Meta’s rules require.' },
      { title: 'Changed on request', desc: 'New offer, new link, new Reel? Message us on WhatsApp and we update it.' },
    ],
    steps: [
      { title: 'You message us', desc: 'Send the form or WhatsApp us. Tell us the post, the keyword and where the DM should send people.' },
      { title: 'We set it up', desc: 'We connect your Instagram in Meta Business Suite and build the comment-to-DM automation with you.' },
      { title: 'We test it', desc: 'We comment the keyword from a test account and check the DM arrives with a working link.' },
      { title: 'It runs every day', desc: 'Every matching comment gets the DM. You focus on the replies that turn into orders.' },
    ],
    useCases: [
      'Send a price list when people comment “PRICE”',
      'Share a product or checkout link from a Reel',
      'Deliver a free guide or menu when people comment a word',
      'Collect enquiries for a class, clinic or event',
      'Send your WhatsApp number to serious buyers',
    ],
    faqs: [
      {
        q: 'What is comment to DM on Instagram?',
        a: 'It is an automation that sends a direct message to anyone who comments a chosen keyword on your post or Reel. Meta Business Suite calls it “Comment to message”. It turns a public comment into a private conversation, where you can share a link, a price or a booking slot.',
      },
      {
        q: 'Is Instagram comment-to-DM automation safe for my account?',
        a: 'Yes, when it runs on Meta’s official tools, which is how we set it up. You never share your password. Meta limits these replies itself: one private reply per comment, sent within 7 days of the comment, and follow-ups only if the person replies.',
      },
      {
        q: 'What do I need before you start?',
        a: 'An Instagram professional account (business or creator) and access to Meta Business Suite on a computer. If your account is personal, switching is free and takes a minute in Instagram’s settings. Note that switching makes a private account public.',
      },
      {
        q: 'What does ₹99 a month include?',
        a: 'Setup and management of comment-to-DM on one Instagram account, with unlimited posts, Reels and keywords, the DM text written for you, and changes on WhatsApp whenever you need them. Tool fees are included. It is billed monthly.',
      },
      {
        q: 'Can I set it up myself for free?',
        a: 'Yes. Meta Business Suite includes a free Comment to message automation on desktop. Our free step-by-step guide shows you how. The ₹99 plan is for people who would rather we set it up, test it and keep it updated.',
      },
    ],
    priced: true,
    related: ['instagram-dm-auto-reply', 'whatsapp-automation', 'facebook-auto-reply'],
    guide: 'free-instagram-comment-to-dm-automation',
  },
  {
    slug: 'instagram-dm-auto-reply',
    name: 'Instagram DM auto-reply',
    short: 'DM auto-reply',
    metaTitle: 'Instagram DM Auto Reply & Keyword Automation',
    metaDescription:
      'Instagram DM auto reply for businesses: instant welcome replies, FAQs, keyword answers and away messages, set up on Meta’s official tools. Free call.',
    h1: 'Instagram DM auto reply and keyword automation',
    lede:
      'Answer Instagram DMs automatically, day or night. We set up instant replies for first messages, FAQ buttons, keyword answers for price, location and timings, and away messages, all on Meta’s official tools. Your team only handles the chats that need a person.',
    outcome: 'No DM waits until tomorrow. Common questions answer themselves.',
    example: { trigger: 'Sends a DM with the word “timings”', reply: 'Gets your opening hours and address right away' },
    features: [
      { title: 'Instant reply', desc: 'A greeting for everyone who messages you for the first time.' },
      { title: 'FAQ buttons', desc: 'Suggested questions people tap instead of typing, each with a ready answer.' },
      { title: 'Keyword answers', desc: 'Messages that contain words like “price” or “location” get the right reply automatically.' },
      { title: 'Away message', desc: 'A polite reply when you are closed, so nobody feels ignored.' },
      { title: 'Labels and routing', desc: 'Automations can label chats and flag unanswered ones, so your team sees what needs a human.' },
      { title: 'Facebook and WhatsApp too', desc: 'The same inbox can answer Facebook Page and WhatsApp messages.' },
    ],
    steps: [
      { title: 'List the questions', desc: 'We pull your most-asked DMs: price, location, timings, delivery, booking.' },
      { title: 'Write the answers', desc: 'Short, friendly replies in your tone, with links and buttons where they help.' },
      { title: 'Build and test', desc: 'We set up the automations in Meta Business Suite and test each keyword.' },
      { title: 'Review monthly', desc: 'New questions coming in? We add answers so the automation keeps up.' },
    ],
    useCases: [
      'Restaurants and cafés answering “menu” and “location”',
      'Clinics and salons sharing timings and booking links',
      'Online stores answering “price”, “COD” and “delivery”',
      'Coaches and institutes sending course details',
    ],
    faqs: [
      {
        q: 'How do I set up auto reply on Instagram DMs?',
        a: 'Connect your Instagram professional account to Meta Business Suite, open Inbox on a computer, click Automations, then Create automation. Choose Instant reply, Away message, Frequently asked questions or Custom keywords. We can do this for you and write the replies.',
      },
      {
        q: 'How do keyword auto replies work?',
        a: 'You choose up to 5 keywords or phrases per automation. When a message contains one, the reply is sent. Meta notes that keywords are case-sensitive and must match exactly, and that a keyword reply is sent after 15 minutes unless you answer first.',
      },
      {
        q: 'Do I have to tell people it is automated?',
        a: 'Yes. Meta’s messaging policy says automated chats must disclose that a person is talking to an automated service at the start of a conversation. We build that line into every setup.',
      },
      {
        q: 'How much does it cost?',
        a: 'Meta’s inbox automations are free. Our fee depends on how many accounts and replies you need, and we quote it on the free strategy call. For comment-to-DM only, there is a ₹99 a month plan.',
      },
    ],
    priced: false,
    related: ['instagram-comment-to-dm', 'whatsapp-automation', 'facebook-auto-reply'],
    guide: 'free-instagram-comment-to-dm-automation',
  },
  {
    slug: 'whatsapp-automation',
    name: 'WhatsApp automation',
    short: 'WhatsApp automation',
    metaTitle: 'WhatsApp Business Automation & Auto Reply',
    metaDescription:
      'WhatsApp Business automation: greeting and away messages, quick replies, Click-to-WhatsApp ads and WhatsApp Business Platform setup. Delhi NCR. Free call.',
    h1: 'WhatsApp Business automation and auto reply',
    lede:
      'Many customers would rather WhatsApp you than fill a form. We set up WhatsApp Business so every chat gets a reply: greeting and away messages, quick replies for common answers, and Click-to-WhatsApp ads that bring new chats. When you outgrow the app, we move you to the WhatsApp Business Platform.',
    outcome: 'Every WhatsApp enquiry gets an answer, and ads start conversations instead of clicks.',
    example: { trigger: 'Messages you on WhatsApp at 11 PM', reply: 'Gets your greeting, price list and a “we’ll call you at 10 AM” note' },
    features: [
      { title: 'Greeting message', desc: 'Sent automatically on a customer’s first message, and again after 14 days of no chat.' },
      { title: 'Away message', desc: 'Sent outside business hours or on a custom schedule, to everyone or chosen contacts.' },
      { title: 'Quick replies', desc: 'Up to 50 saved answers your team sends with a “/” shortcut, including images and videos.' },
      { title: 'Click-to-WhatsApp ads', desc: 'Facebook and Instagram ads that open a WhatsApp chat with you, built in Ads Manager.' },
      { title: 'WhatsApp Business Platform', desc: 'For higher volume: automated flows, order updates and broadcasts through the official API.' },
      { title: 'Linked to Meta Business Suite', desc: 'Answer WhatsApp, Instagram and Facebook messages from one inbox.' },
    ],
    steps: [
      { title: 'Choose app or platform', desc: 'The free WhatsApp Business app suits most small businesses. We tell you honestly if you need more.' },
      { title: 'Set up the profile', desc: 'Business profile, hours, catalogue, greeting, away message and quick replies.' },
      { title: 'Connect ads', desc: 'Link WhatsApp to your Facebook Page or business portfolio and run Click-to-WhatsApp ads.' },
      { title: 'Measure chats', desc: 'Track how many chats each ad starts and how many turn into sales.' },
    ],
    useCases: [
      'Local shops and restaurants taking orders on WhatsApp',
      'Clinics, salons and institutes confirming bookings',
      'D2C brands answering product questions before purchase',
      'Service businesses turning ad clicks into conversations',
    ],
    faqs: [
      {
        q: 'Is WhatsApp Business automation free?',
        a: 'The WhatsApp Business app’s greeting messages, away messages and quick replies are free. On the WhatsApp Business Platform, Meta charges per delivered template message. From 1 October 2026 service messages are also charged, with 1,000 free service messages per business number each month.',
      },
      {
        q: 'What is a Click-to-WhatsApp ad?',
        a: 'A Facebook or Instagram ad that opens a WhatsApp chat with your business when someone taps it. You need a WhatsApp number connected to your Facebook Page or your business portfolio, and you create the ad in Meta Ads Manager.',
      },
      {
        q: 'Can I send broadcast messages on WhatsApp?',
        a: 'Yes. Messages to customers outside a 24-hour customer service window must use approved template messages on the WhatsApp Business Platform, and Meta charges for those. We set up the templates and show you the current rates before anything is sent.',
      },
      {
        q: 'How much do you charge for WhatsApp automation?',
        a: 'It depends on whether you need the free app set up or the Business Platform with flows. We quote it on the free strategy call.',
      },
    ],
    priced: false,
    related: ['instagram-dm-auto-reply', 'instagram-comment-to-dm', 'facebook-auto-reply'],
  },
  {
    slug: 'facebook-auto-reply',
    name: 'Facebook comment and Messenger auto-reply',
    short: 'Facebook auto-reply',
    metaTitle: 'Facebook Auto Reply for Comments & Messenger',
    metaDescription:
      'Auto reply to Facebook Page comments and Messenger chats: comment-to-message, instant replies, FAQs and away messages, set up in Meta Business Suite.',
    h1: 'Facebook comment auto reply and Messenger automation',
    lede:
      'Your Facebook Page gets the same automation as Instagram. People who comment a keyword get a Messenger reply, first-time messages get an instant greeting, and common questions answer themselves. We set it up in Meta Business Suite, next to your Instagram and WhatsApp.',
    outcome: 'Facebook comments and messages get answered as fast as Instagram ones.',
    example: { trigger: 'Comments “DETAILS” on your Page post', reply: 'Gets a Messenger reply with the details and a link' },
    features: [
      { title: 'Comment to message', desc: 'Send a Messenger reply to comments on your posts that contain your keywords.' },
      { title: 'Instant reply', desc: 'A greeting for everyone who messages your Page for the first time.' },
      { title: 'FAQs, hours, location', desc: 'Ready answers for the questions people ask most.' },
      { title: 'Away message', desc: 'An automatic reply when nobody is available.' },
      { title: 'One inbox', desc: 'Facebook, Instagram and WhatsApp messages in Meta Business Suite.' },
      { title: 'Comment clean-up', desc: 'We check the comments that need a human reply and hide spam.' },
    ],
    steps: [
      { title: 'Connect your Page', desc: 'Your Facebook Page and Instagram in one business portfolio in Meta Business Suite.' },
      { title: 'Write the replies', desc: 'Keywords, greeting and FAQs written in your brand’s voice.' },
      { title: 'Build and test', desc: 'Each automation tested from a separate profile before it goes live.' },
      { title: 'Keep it current', desc: 'Offers, links and timings updated whenever they change.' },
    ],
    useCases: [
      'Local businesses whose older customers use Facebook',
      'Pages running Facebook ads that attract comments',
      'Events and launches with a “comment for details” post',
    ],
    faqs: [
      {
        q: 'Can Facebook automatically reply to comments?',
        a: 'Yes. Meta Business Suite’s Comment to message automation sends a message reply to people who comment specific keywords on your posts. It is available on desktop. Private replies must be sent within 7 days of the comment.',
      },
      {
        q: 'Does this work for Instagram and Facebook together?',
        a: 'Inbox automations work for Facebook Pages, Instagram business accounts and WhatsApp Business accounts connected to Meta Business Suite. We set up all three together so the replies match.',
      },
      {
        q: 'How much does it cost?',
        a: 'Meta’s automations are free. Our setup fee depends on how much you need and is quoted on the free strategy call.',
      },
    ],
    priced: false,
    related: ['instagram-comment-to-dm', 'instagram-dm-auto-reply', 'whatsapp-automation'],
  },
  {
    slug: 'youtube-comment-management',
    name: 'YouTube comment management',
    short: 'YouTube comments',
    metaTitle: 'YouTube Comment Management & Moderation',
    metaDescription:
      'YouTube comment management for channels: replies from YouTube Studio, held-for-review filters, blocked words and links, and spam clean-up. Free call.',
    h1: 'YouTube comment management and moderation',
    lede:
      'YouTube has no official comment auto-reply, so we do the next best thing properly. We reply to comments from YouTube Studio, pin the right one, and set up held-for-review, blocked words and blocked links so spam never reaches your audience.',
    outcome: 'Your comments section stays clean, and real viewers get real replies.',
    example: { trigger: 'Posts a question under your video', reply: 'Gets a real reply from your channel, not a bot' },
    features: [
      { title: 'Replies from YouTube Studio', desc: 'Real replies to questions and feedback, in your channel’s voice.' },
      { title: 'Held for review', desc: 'Comments that may be inappropriate wait for approval before they show.' },
      { title: 'Blocked words and links', desc: 'Channel-wide lists that stop spam, scam links and abuse.' },
      { title: 'Hidden and approved users', desc: 'Repeat spammers hidden; trusted viewers approved.' },
      { title: 'Pinned comments', desc: 'Your link, offer or answer pinned at the top of every video.' },
      { title: 'Monthly clean-up', desc: 'A regular sweep of old videos that still get comments.' },
    ],
    steps: [
      { title: 'Audit settings', desc: 'We check your default comment settings and filters in YouTube Studio.' },
      { title: 'Set the filters', desc: 'Blocked words, blocked links and held-for-review set for your channel.' },
      { title: 'Reply and pin', desc: 'We reply to comments and pin the useful ones.' },
      { title: 'Report', desc: 'The questions viewers keep asking, so your next video can answer them.' },
    ],
    useCases: [
      'Creators whose comment section is filling with spam',
      'Brands with product videos that attract questions',
      'Channels that want more replies without more hours',
    ],
    faqs: [
      {
        q: 'Can YouTube reply to comments automatically?',
        a: 'Not officially. YouTube Studio lets you review and reply to comments, hold comments for review, block words and links, hide users, and use comment reply suggestions, but it does not send replies on its own. We reply by hand and use the filters to keep spam out.',
      },
      {
        q: 'How do I stop spam comments on YouTube?',
        a: 'In YouTube Studio, set held-for-review comments, add blocked words, block comments with links, and hide repeat spammers. We set these up for your channel and check the held comments regularly.',
      },
    ],
    priced: false,
    related: ['instagram-dm-auto-reply', 'facebook-auto-reply', 'instagram-comment-to-dm'],
  },
];

export function getAutomation(slug: string): Automation | undefined {
  return AUTOMATIONS.find((a) => a.slug === slug);
}

/** Do-it-yourself vs done-for-you, shown on the free guide and the ₹99 page. */
export const DIY_VS_DFY: { point: string; diy: string; dfy: string }[] = [
  { point: 'Cost', diy: 'Free (Meta Business Suite)', dfy: '₹99 a month' },
  { point: 'Your time', diy: 'Setup, testing and updates on a computer', dfy: 'One WhatsApp message' },
  { point: 'Keywords and DM text', diy: 'You write and test them', dfy: 'We write and test them' },
  { point: 'New post or Reel', diy: 'You add the automation each time', dfy: 'We add it for you' },
  { point: 'When a link breaks', diy: 'You notice when sales stop', dfy: 'We fix it on request' },
  { point: 'Meta’s rules', diy: 'You keep track of them', dfy: 'Handled for you' },
];

export const AUTOMATION_HUB = {
  metaTitle: 'Instagram, WhatsApp & Facebook Automation',
  metaDescription:
    'Instagram comment-to-DM from ₹99/month, DM auto reply, WhatsApp Business automation, Facebook auto reply and YouTube comment management. Official Meta tools.',
  h1: 'Instagram, WhatsApp and Facebook automation',
  lede:
    'Reply to every comment and message automatically, on Meta’s official tools. Comment-to-DM, DM auto-reply, WhatsApp auto-reply and Facebook Messenger automation, set up and managed for you. Comment-to-DM starts at ₹99 a month.',
} as const;
