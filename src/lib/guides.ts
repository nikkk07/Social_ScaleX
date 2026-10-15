// ─────────────────────────────────────────────────────────────────────
// Guides: long-form answers to what our buyers search before hiring.
//
// Every platform fact below is taken from the source listed in the guide's
// `sources`, checked on the guide's `updated` date. Inline markup is deliberately
// tiny: **bold** and [text](url). See src/components/site/Rich.tsx.
// ─────────────────────────────────────────────────────────────────────

import type { Faq } from './content';

export type Block =
  | { t: 'h2'; text: string }
  | { t: 'p'; text: string }
  | { t: 'ul'; items: string[] }
  | { t: 'ol'; items: string[] }
  | { t: 'quote'; text: string; cite: string }
  /** Done-for-you offer box (₹99 comment-to-DM plan). */
  | { t: 'offer'; variant: 'mid' | 'end' }
  /** The do-it-yourself vs done-for-you table from automation.ts. */
  | { t: 'compare' };

export interface Source {
  label: string;
  url: string;
}

export interface Guide {
  slug: string;
  title: string;
  metaTitle: string;
  /** Short label for navigation and the footer. */
  navTitle: string;
  description: string;
  /** Answer-first summary shown under the H1. */
  summary: string;
  published: string;
  updated: string;
  author: string;
  blocks: Block[];
  /** Question-and-answer pairs shown at the end (and as FAQPage schema). */
  faqs?: Faq[];
  /** Step list mirrored as HowTo schema for answer engines. */
  howTo?: { name: string; steps: { name: string; text: string }[] };
  sources: Source[];
  services: string[];
}

const S = {
  rankingExplained: { label: 'Instagram: Instagram ranking explained (31 May 2023)', url: 'https://about.instagram.com/blog/announcements/instagram-ranking-explained' },
  mosseri2025: { label: 'Social Media Today: Instagram shares algorithm insights (22 Jan 2025)', url: 'https://www.socialmediatoday.com/news/instagram-shares-algorithm-insights-2025/738034/' },
  watchSeconds: { label: 'Social Media Today: watch time vs completion rate (25 Feb 2025)', url: 'https://www.socialmediatoday.com/news/instagram-longer-video-watch-time-versus-completion-rate/740916/' },
  engagementRates: { label: 'Social Media Today: engagement rates and reach (26 May 2026)', url: 'https://www.socialmediatoday.com/news/instagram-engagement-rates-provide-insight-into-reach/821170/' },
  originality2024: { label: 'Social Media Today: Instagram prioritises original creators (30 Apr 2024)', url: 'https://www.socialmediatoday.com/news/instagram-algorithm-prioritize-original-emerging-creators/714777/' },
  originality2026: { label: 'Instagram for Creators: Rewarding original creators (30 Apr 2026)', url: 'https://creators.instagram.com/blog/rewarding-original-creators-on-instagram' },
  originalHelp: { label: 'Instagram Help: About original content', url: 'https://help.instagram.com/1800814370401535/' },
  trialReels: { label: 'Instagram for Creators: Trial Reels (10 Dec 2024)', url: 'https://creators.instagram.com/blog/instagram-trial-reels' },
  threeMinutes: { label: 'MediaNama: Instagram Reels up to 3 minutes (19 Jan 2025)', url: 'https://www.medianama.com/2025/01/223-instagram-reels-3-minutes-us-tiktok-ban/' },
  edits: { label: 'Instagram for Creators: Edits app (22 Apr 2025)', url: 'https://creators.instagram.com/blog/edits-video-creation-app' },
  indexing: { label: 'Instagram Help: Search engine indexing of public content', url: 'https://help.instagram.com/147542625391305' },
  reposts: { label: 'Meta: New Instagram features, including reposts (6 Aug 2025)', url: 'https://about.fb.com/news/2025/08/new-instagram-features-help-you-connect/' },
  skipRate: { label: 'Social Media Today: Instagram adds retention insights and skip rate for Reels (24 Aug 2025)', url: 'https://www.socialmediatoday.com/news/instagram-adds-retention-insights-reels/758464/' },
  indiaReelsFirst: { label: 'Meta: In India, Instagram tests a Reels-first app (28 Sep 2025)', url: 'https://about.fb.com/news/2025/09/in-india-instagram-debuts-a-reels-first-experience-for-its-mobile-app/' },
  yourAlgorithm: { label: 'TechCrunch: Instagram’s Your Algorithm tool (10 Dec 2025)', url: 'https://techcrunch.com/2025/12/10/instagrams-new-your-algorithm-tool-gives-you-more-control-over-the-reels-you-see' },
  hashtags: { label: 'Social Samosa: Instagram limits hashtags to five per post (19 Dec 2025)', url: 'https://www.socialsamosa.com/news-2/instagram-hashtags-five-per-post-10923075' },
  aiLabel: { label: 'Instagram for Creators: AI-generated profile label (31 Aug 2026)', url: 'https://creators.instagram.com/blog/ai-generated-profile-label/' },
  recGuidelines: { label: 'Instagram Help: Recommendations guidelines', url: 'https://help.instagram.com/313829416281232/' },
  accountStatus: { label: 'Instagram Help: Account Status', url: 'https://help.instagram.com/653964212890722' },
  gSearch: { label: 'Google Ads Help: About Search campaigns', url: 'https://support.google.com/google-ads/answer/2567043' },
  gPmax: { label: 'Google Ads Help: About Performance Max campaigns', url: 'https://support.google.com/google-ads/answer/10724817' },
  gPmaxStore: { label: 'Google Ads Help: Performance Max for store goals', url: 'https://support.google.com/google-ads/answer/12971048' },
  gCallAds: { label: 'Google Ads Help: About call ads', url: 'https://support.google.com/google-ads/answer/6341403' },
  gAdRank: { label: 'Google Ads Help: About Ad Rank', url: 'https://support.google.com/google-ads/answer/1722122' },
  gAuction: { label: 'Google Ads Help: The ad auction', url: 'https://support.google.com/google-ads/answer/6366577' },
  gEnhanced: { label: 'Google Ads Help: About enhanced conversions', url: 'https://support.google.com/google-ads/answer/9888656' },
  mAuction: { label: 'Meta Business Help: About ad auctions', url: 'https://www.facebook.com/business/help/430291176997542' },
  mAdvantage: { label: 'Meta Business Help: About Advantage+ audience', url: 'https://www.facebook.com/business/help/273363992030035' },
  mLeadAds: { label: 'Meta Business Help: About lead ads', url: 'https://www.facebook.com/business/help/761812391313386' },
  mCtwa: { label: 'Meta Business Help: Ads that click to WhatsApp', url: 'https://www.facebook.com/business/help/447934475640650' },
  mLearning: { label: 'Meta Business Help: About the learning phase', url: 'https://www.facebook.com/business/help/112167992830700' },
  mBudget: { label: 'Meta Business Help: About ad budgets', url: 'https://www.facebook.com/business/help/203183363050448' },
  mCapi: { label: 'Meta Business Help: About the Conversions API', url: 'https://www.facebook.com/business/help/AboutConversionsAPI' },
  mPartners: { label: 'Meta Business Help: Give a partner access to your assets', url: 'https://www.facebook.com/business/help/1717412048538897' },
  igApps: { label: 'Instagram Help: Third-party apps that offer likes or followers', url: 'https://help.instagram.com/263751177667145' },
  igTerms: { label: 'Instagram Terms of Use', url: 'https://help.instagram.com/581066165581870' },
  gThirdParty: { label: 'Google: Advertiser guide to working with third parties', url: 'https://support.google.com/adspolicy/answer/9457109' },
  gThirdPartyPolicy: { label: 'Google Ads: Third-party policy', url: 'https://support.google.com/adspolicy/answer/6086450' },
  gAccess: { label: 'Google Ads Help: Access levels in your account', url: 'https://support.google.com/google-ads/answer/6372672' },
  asci: { label: 'ASCI: Guidelines for influencer advertising in digital media', url: 'https://www.ascionline.in/wp-content/uploads/2023/08/GUIDELINES-FOR-INFLUENCER-ADVERTISING-IN-DIGITAL-MEDIA.pdf' },
  asciReport: { label: 'ASCI: Influencer disclosure report (6 Feb 2025)', url: 'https://www.ascionline.in/wp-content/uploads/2025/02/Press-Release-Influencer-Disclosure-Guidelines-ASCI-Report.pdf' },
  doca: { label: 'PIB: Department of Consumer Affairs, Endorsements Know-hows! (20 Jan 2023)', url: 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=1892527' },
  mbsSetup: { label: 'Meta Business Help: Set up Inbox automations in Meta Business Suite on desktop', url: 'https://www.facebook.com/business/help/318238182723007' },
  mbsAbout: { label: 'Meta Business Help: About Inbox automations in Meta Business Suite', url: 'https://www.facebook.com/business/help/395965998733706' },
  mbsConnectIg: { label: 'Meta Business Help: Connect your Instagram account to Meta Business Suite', url: 'https://www.facebook.com/business/help/428687951269163' },
  igProfessional: { label: 'Meta Business Help: Set up a professional Instagram account', url: 'https://www.facebook.com/business/help/502981923235522' },
  privateReplies: { label: 'Meta for Developers: Instagram Platform, Private Replies', url: 'https://developers.facebook.com/docs/instagram-platform/private-replies/' },
  msgPolicy: { label: 'Meta for Developers: Messenger Platform and IG Messaging API policy', url: 'https://developers.facebook.com/documentation/business-messaging/messenger-platform/policy' },
  diwali2026: { label: 'DoPT: Holidays in Central Government offices, 2026 (OM dated 3 Jul 2025), via StaffNews', url: 'https://www.staffnews.in/2025/07/list-of-holidays-2026-dopt-order-reg-closed-and-restricted-holidays.html' },
  gbpHours: { label: 'Google Business Profile Help: How to set special hours', url: 'https://support.google.com/business/answer/6303076' },
  gReviews: { label: 'Google Maps User Generated Content Policy: Prohibited & restricted content', url: 'https://support.google.com/contributionpolicy/answer/7400114' },
  waPolicy: { label: 'WhatsApp Business Messaging Policy', url: 'https://business.whatsapp.com/policy' },
  manychat: { label: 'ManyChat: Pricing', url: 'https://manychat.com/pricing' },
} satisfies Record<string, Source>;

export const GUIDES: Guide[] = [
  {
    slug: 'free-instagram-comment-to-dm-automation',
    title: 'Instagram comment to DM automation: free setup guide (2026)',
    metaTitle: 'Instagram Comment to DM Automation: Free Guide',
    navTitle: 'Comment-to-DM setup (free)',
    description:
      'Set up Instagram comment to DM automation free with Meta Business Suite. 4 steps, the best keywords, Meta’s DM rules and fixes. Updated for 2026.',
    summary:
      'Yes, Instagram comment to DM automation is free. Meta Business Suite has a built-in “Comment to message” automation on desktop. Switch to a professional account, connect Instagram to Meta Business Suite, go to Inbox → Automations → Create automation → Comment to message, add your keyword and write the DM. Meta allows one automatic DM per comment, within 7 days.',
    published: '2026-09-30',
    updated: '2026-09-30',
    author: 'Social ScaleX team',
    blocks: [
      { t: 'h2', text: 'What is Instagram comment to DM automation?' },
      {
        t: 'p',
        text: 'Comment to DM automation sends a direct message to everyone who comments a chosen keyword on your Instagram post or Reel. You write “Comment PRICE for the price list”, and each person who comments PRICE gets your DM with the link, automatically.',
      },
      {
        t: 'p',
        text: 'It works for two reasons. Comments tell Instagram people care about the post, and the DM moves the buyer into a private chat where they can ask, book or pay.',
      },
      { t: 'h2', text: 'Is comment to DM automation free on Instagram?' },
      {
        t: 'p',
        text: 'Yes. Meta Business Suite includes it at no cost. Meta calls it **Comment to message**: “Send a message reply to comments on your posts that contain specific keywords or phrases.” It is available on the desktop version of Meta Business Suite. [Meta Business Help](https://www.facebook.com/business/help/318238182723007)',
      },
      { t: 'h2', text: 'What you need before you start' },
      {
        t: 'ul',
        items: [
          '**An Instagram professional account** (Business or Creator).',
          '**A laptop or desktop.** Meta says keyword automations are only available in Meta Business Suite on desktop.',
          '**Meta Business Suite access**, with the right business portfolio selected in the top-left menu.',
          '**One keyword and one link**: what people comment, and where your DM sends them.',
        ],
      },
      { t: 'h2', text: 'Step 1: Switch to a professional Instagram account' },
      {
        t: 'ol',
        items: [
          'Open Instagram and go to your profile.',
          'Tap **More** (the menu) to open Settings and activity.',
          'Under **For professionals**, tap **Account type and tools**.',
          'Tap **Switch to professional account**, pick a category, then choose **Business** or **Creator**.',
          'Add contact details, or skip. Connecting a Facebook Page is optional.',
        ],
      },
      {
        t: 'p',
        text: 'Heads-up: a private account becomes public when you switch, and pending follow requests are accepted. [Meta Business Help](https://www.facebook.com/business/help/502981923235522)',
      },
      { t: 'h2', text: 'Step 2: Connect Instagram to Meta Business Suite' },
      {
        t: 'ol',
        items: [
          'On a computer, open Meta Business Suite.',
          'Log in with your **Instagram** username and password. No Facebook Page is needed.',
          'Asked to link a Facebook Page and don’t want to? Sign out of Facebook or use a private window, then log in with Instagram again.',
          'Have a Facebook Page? Connect Instagram to it, or add both to the same business portfolio.',
        ],
      },
      { t: 'p', text: 'Source: [Connect your Instagram account to Meta Business Suite](https://www.facebook.com/business/help/428687951269163)' },
      { t: 'h2', text: 'Step 3: Create the Comment to message automation' },
      {
        t: 'ol',
        items: [
          'In Meta Business Suite, open **Inbox**.',
          'Click **Automations**.',
          'Click **Create automation** (top right).',
          'Choose **Comment to message**, then click **Create automation**.',
          'Follow the on-screen steps: add your keywords and write the DM.',
          'Save. It can take a few minutes to appear; refresh if you don’t see it.',
          'Use the **Status** toggle to turn it on or off. Click **Edit** to change it.',
        ],
      },
      { t: 'p', text: 'Source: [Set up Inbox automations in Meta Business Suite on desktop](https://www.facebook.com/business/help/318238182723007)' },
      { t: 'h2', text: 'Step 4: Test your auto DM before you post' },
      {
        t: 'ol',
        items: [
          'From a second account, comment your keyword on the post.',
          'Check the DM arrives and the link opens on a phone.',
          'Comment a different word and check nothing is sent.',
          'Now announce the keyword in your Reel and caption.',
        ],
      },
      { t: 'offer', variant: 'mid' },
      { t: 'h2', text: 'Best keywords for comment to DM' },
      {
        t: 'ul',
        items: [
          '**One short word**: PRICE, LINK, MENU, GUIDE, BOOK. Easy to type on a phone.',
          '**Say it three times**: on screen, out loud in the Reel, and in the caption.',
          '**Avoid everyday words** like “nice” or “wow”, or every comment triggers a DM.',
          '**Add spellings.** Meta says keyword automations are case-sensitive and match exactly, so add PRICE, Price and price.',
          '**One keyword, one job.** Meta allows each keyword in only one keyword automation.',
        ],
      },
      { t: 'h2', text: 'How to write an auto DM that gets clicked' },
      {
        t: 'ul',
        items: [
          'Start with what they asked for: “Here’s the price list you wanted.”',
          'Put the link in the first two lines.',
          'Say it’s automated. Meta’s messaging policy requires automated chats to disclose that a person is talking to an automated service. [Meta policy](https://developers.facebook.com/documentation/business-messaging/messenger-platform/policy)',
          'End with one next step: “Reply here and we’ll call you.”',
        ],
      },
      { t: 'h2', text: 'Instagram’s rules for automated DMs' },
      {
        t: 'ul',
        items: [
          '**One DM per comment.** Only one private reply can be sent to each commenter. [Meta for Developers](https://developers.facebook.com/docs/instagram-platform/private-replies/)',
          '**Within 7 days** of the comment.',
          '**Follow-ups only if they reply**, within 24 hours of their reply.',
          '**Never share your password.** Instagram warns against apps that ask for your login, and its terms forbid collecting other people’s login details. [Instagram Help](https://help.instagram.com/263751177667145)',
        ],
      },
      { t: 'h2', text: 'Free comment to DM tools compared' },
      {
        t: 'ul',
        items: [
          '**Meta Business Suite (free):** built in, official, desktop only. Best place to start.',
          '**ManyChat Free:** 25 active contacts a month and up to 4 active automations. Essential costs $14 a month for 250 active contacts. [ManyChat pricing](https://manychat.com/pricing)',
          '**Any tool you use** should connect through Meta’s official login, never by asking for your Instagram password.',
        ],
      },
      { t: 'h2', text: 'Comment to DM not working? Quick fixes' },
      {
        t: 'ul',
        items: [
          '**Automation not showing:** wait a few minutes, then refresh.',
          '**Can’t find Automations:** select the right business portfolio (top-left) and use a computer, not the app.',
          '**Automations stopped:** turning on Meta Business Agent pauses existing automations.',
          '**No DM for an old comment:** replies only work within 7 days of the comment.',
          '**Keyword ignored:** check the spelling and capital letters match exactly.',
        ],
      },
      { t: 'h2', text: 'Do it yourself, or let us do it?' },
      { t: 'compare' },
      { t: 'offer', variant: 'end' },
    ],
    faqs: [
      {
        q: 'Is Instagram comment to DM automation free?',
        a: 'Yes. Meta Business Suite’s Comment to message automation is free and built in. You need an Instagram professional account and a computer, because keyword automations are desktop-only.',
      },
      {
        q: 'How do I auto DM people who comment on my Instagram post?',
        a: 'Connect Instagram to Meta Business Suite, open Inbox, click Automations, then Create automation and choose Comment to message. Add your keyword, write the DM and turn it on. Test it from a second account first.',
      },
      {
        q: 'Does Instagram allow comment to DM automation?',
        a: 'Yes, through Meta’s official tools. Meta allows one private reply per comment within 7 days, follow-ups only if the person replies within 24 hours, and requires automated chats to say they are automated.',
      },
      {
        q: 'Can I use comment to DM on Reels?',
        a: 'Yes. Meta’s private-reply rules cover comments on posts and Reels. Say the keyword in the Reel and in the caption, and test it from a second account before you post.',
      },
      {
        q: 'Why is my Instagram comment to DM automation not working?',
        a: 'The most common causes: the wrong business portfolio is selected, the keyword’s spelling or capitals don’t match, the comment is older than 7 days, or Meta Business Agent is on, which pauses other automations.',
      },
      {
        q: 'Can someone set up comment to DM for me?',
        a: 'Yes. Social ScaleX sets up, tests and manages Instagram comment to DM automation for ₹99 a month: one account, unlimited posts and keywords, and you pay after it works.',
      },
    ],
    howTo: {
      name: 'How to set up Instagram comment to DM automation for free',
      steps: [
        { name: 'Switch to a professional Instagram account', text: 'In Instagram, go to Settings and activity, then Account type and tools, and switch to a Business or Creator account.' },
        { name: 'Connect Instagram to Meta Business Suite', text: 'On a computer, open Meta Business Suite and log in with your Instagram account.' },
        { name: 'Create the Comment to message automation', text: 'Go to Inbox, Automations, Create automation, choose Comment to message, add your keywords and write the DM, then turn it on.' },
        { name: 'Test before you post', text: 'Comment the keyword from a second account and check the DM and link arrive.' },
      ],
    },
    sources: [S.mbsSetup, S.mbsAbout, S.mbsConnectIg, S.igProfessional, S.privateReplies, S.msgPolicy, S.igApps, S.igTerms, S.manychat],
    services: [],
  },
  {
    slug: 'increase-instagram-followers',
    title: 'How to increase Instagram followers, likes and views without buying them',
    metaTitle: 'How to Increase Instagram Followers Organically',
    navTitle: 'Grow Instagram followers',
    description:
      'Grow Instagram followers, likes, views and comments the way Instagram rewards: original Reels, sends and watch time, Trial Reels. Why bought followers backfire.',
    summary:
      'Instagram grows accounts whose Reels people watch, share and like. Post original Reels with a strong opening, make content people send to friends, test new formats with Trial Reels, and keep your account eligible for recommendations. Bought followers, likes and comments can be removed by Instagram and can stop it recommending your account at all.',
    published: '2026-09-30',
    updated: '2026-09-30',
    author: 'Social ScaleX team',
    blocks: [
      { t: 'h2', text: 'Why buying followers, likes or views backfires' },
      {
        t: 'p',
        text: 'Instagram warns that apps selling likes or followers can get complete access to your account, that it may remove the engagement they create, and that it can limit your account. [Instagram Help](https://help.instagram.com/263751177667145) Repeatedly buying likes can also make an account ineligible for recommendations, which means none of its content is shown to non-followers. [Recommendations guidelines](https://help.instagram.com/313829416281232/)',
      },
      { t: 'p', text: 'Bought numbers also don’t buy anything from you. Real growth comes from people who choose to follow.' },
      { t: 'h2', text: 'What Instagram actually rewards' },
      {
        t: 'quote',
        text: 'The most important predictions we make are how likely you are to reshare a reel, watch a reel all the way through, like it, and go to the audio page.',
        cite: 'Instagram, “Instagram ranking explained”, 31 May 2023',
      },
      {
        t: 'p',
        text: 'In 2025 Adam Mosseri named watch time, likes per reach and sends per reach as the top signals. Likes matter more with followers; sends matter more for reaching new people. [Social Media Today](https://www.socialmediatoday.com/news/instagram-shares-algorithm-insights-2025/738034/) Our [Reels reach guide](/guides/instagram-reels-reach) explains each signal.',
      },
      { t: 'h2', text: '10 ways to increase Instagram followers' },
      {
        t: 'ol',
        items: [
          '**Switch to a professional account** so you can see Insights and use business tools. It’s free. [Meta Business Help](https://www.facebook.com/business/help/502981923235522)',
          '**Win the first seconds.** Show the result, the question or the product straight away.',
          '**Make it worth sending.** Useful, local and specific content gets shared; sends reach people who don’t follow you yet.',
          '**Post original content.** Instagram recommends the original when it finds identical posts, and stops recommending accounts that mostly repost. [Instagram for Creators](https://creators.instagram.com/blog/rewarding-original-creators-on-instagram)',
          '**Export clean files.** Instagram shows watermarked, low-resolution or bordered Reels to fewer people. [Instagram](https://about.instagram.com/blog/announcements/instagram-ranking-explained)',
          '**Test with Trial Reels.** They go to non-followers first, so you can test a new format without your followers seeing a miss. [Trial Reels](https://creators.instagram.com/blog/instagram-trial-reels)',
          '**Collaborate.** A collab post with a creator or partner brand puts you in front of their audience.',
          '**Turn comments into conversations.** A “comment PRICE” call to action with an automatic DM gets you comments and leads. See our [free comment-to-DM guide](/guides/free-instagram-comment-to-dm-automation).',
          '**Write searchable captions.** Public professional content can be indexed by search engines, so say plainly what the post is and where it was shot. [Instagram Help](https://help.instagram.com/147542625391305)',
          '**Check Account Status** in settings. If you are not eligible for recommendations, fix that first. [Account Status](https://help.instagram.com/653964212890722)',
        ],
      },
      { t: 'h2', text: 'How to get more likes on Instagram' },
      {
        t: 'p',
        text: 'Likes come mostly from people who already follow you. Post what your followers came for, reply to comments so they come back, and ask a simple question they can answer by liking or commenting. Track likes per reach, not total likes.',
      },
      { t: 'h2', text: 'How to get more views on Reels' },
      {
        t: 'p',
        text: 'Views from non-followers depend on sends and watch time. Instagram measures both the share of a video watched and the seconds watched, so longer Reels are not penalised if people keep watching. [Social Media Today](https://www.socialmediatoday.com/news/instagram-longer-video-watch-time-versus-completion-rate/740916/)',
      },
      { t: 'h2', text: 'How to get more comments' },
      {
        t: 'p',
        text: 'Give people a reason to comment: a keyword that gets them something (a price list, a guide, a discount), a choice between two options, or a question only your audience can answer. Reply to the first comments quickly to start the thread.',
      },
      { t: 'h2', text: 'Real numbers from accounts we manage' },
      {
        t: 'p',
        text: 'prago.outdoors passed 6M views in 30 days with 35.3K followers, and saini_telecom__ passed 4M views in 30 days with 12K followers: reach far beyond the following, driven by Reels. See the details in our [client results](/case-studies).',
      },
    ],
    faqs: [
      {
        q: 'How can I increase my Instagram followers for free?',
        a: 'Post original Reels with a strong opening, make content people send to friends, test new formats with Trial Reels, collaborate with related accounts, and keep your account eligible for recommendations. All of it is free.',
      },
      {
        q: 'Is it safe to buy Instagram followers or likes?',
        a: 'No. Instagram may remove engagement from apps that sell likes or followers and can limit the account. Repeatedly buying likes can also make an account ineligible for recommendations to non-followers.',
      },
      {
        q: 'What matters most for Instagram reach in 2026?',
        a: 'Watch time, likes per reach and sends per reach, according to Instagram head Adam Mosseri. Sends matter most for reaching people who don’t follow you yet.',
      },
      {
        q: 'How do I get more comments on Instagram?',
        a: 'Give people a reason to comment: a keyword that gets them something by DM, a choice between two options, or a question only your audience can answer. Reply to the first comments quickly.',
      },
    ],
    sources: [S.igApps, S.recGuidelines, S.rankingExplained, S.mosseri2025, S.originality2026, S.watchSeconds, S.trialReels, S.indexing, S.accountStatus, S.igProfessional],
    services: ['instagram-marketing', 'reels-production'],
  },
  {
    slug: 'instagram-reels-reach',
    title: 'How the Instagram Reels algorithm works in 2026',
    metaTitle: 'Instagram Reels Algorithm 2026: What’s Confirmed',
    navTitle: 'Reels algorithm 2026',
    description:
      'What Instagram has confirmed about ranking Reels in 2026: watch time, sends, likes, originality, Your Algorithm controls and AI labels. Dated and sourced.',
    summary:
      'Instagram ranks Reels by predicting what each viewer will do: share it, watch it to the end, like it or open its audio page. Adam Mosseri has named watch time, likes per reach and sends per reach as the signals that matter most. Originality rules, AI-profile labels and each viewer’s own topic settings now shape who sees a Reel too. Instagram publishes no formula and no signal weights.',
    published: '2026-09-30',
    updated: '2026-10-15',
    author: 'Social ScaleX team',
    blocks: [
      { t: 'h2', text: 'What Instagram says it predicts for every Reel' },
      {
        t: 'p',
        text: 'Instagram does not use one algorithm. Its own explainer describes separate ranking systems for Feed, Stories, Explore and Reels, each built around what people do in that part of the app. For Reels, the goal is entertainment, and most of what you see comes from accounts you don’t follow. [Instagram ranking explained](https://about.instagram.com/blog/announcements/instagram-ranking-explained)',
      },
      {
        t: 'quote',
        text: 'The most important predictions we make are how likely you are to reshare a reel, watch a reel all the way through, like it, and go to the audio page.',
        cite: 'Instagram, “Instagram ranking explained”, 31 May 2023',
      },
      { t: 'p', text: 'The same page lists the signals behind those predictions, roughly in order of importance:' },
      {
        t: 'ol',
        items: [
          '**Your activity:** which Reels you have liked, saved, reshared, commented on and engaged with recently.',
          '**Your history with the account that posted:** whether you have interacted with them before, even if you don’t follow them.',
          '**Information about the Reel:** the audio, the visuals and how popular it is.',
          '**Information about the account that posted:** how popular it is and how many people engage with it.',
        ],
      },
      {
        t: 'p',
        text: 'That 2023 page is still Instagram’s most complete public explanation. Everything since has come as product changes and comments from Instagram’s head, Adam Mosseri, not as a new formula.',
      },
      { t: 'h2', text: 'The three numbers Adam Mosseri says to watch' },
      {
        t: 'p',
        text: 'In January 2025, Mosseri said the top three ranking signals are watch time, likes and sends, and told creators to track **average watch time, likes per reach and sends per reach**. He added that likes matter slightly more for content shown to your followers, and sends matter slightly more for content shown to people who don’t follow you. [Social Media Today, 22 Jan 2025](https://www.socialmediatoday.com/news/instagram-shares-algorithm-insights-2025/738034/)',
      },
      {
        t: 'p',
        text: 'Longer Reels are not punished for it. Mosseri said in February 2025 that Instagram looks at both the percentage of a video watched and the number of seconds watched, so it doesn’t penalise longer videos. [Social Media Today, 25 Feb 2025](https://www.socialmediatoday.com/news/instagram-longer-video-watch-time-versus-completion-rate/740916/) He repeated the follower and non-follower split in May 2026. [Social Media Today, 26 May 2026](https://www.socialmediatoday.com/news/instagram-engagement-rates-provide-insight-into-reach/821170/)',
      },
      {
        t: 'p',
        text: 'The practical reading: a Reel that people send to a friend is the one that travels to new audiences. A Reel your followers like keeps your existing audience engaged. Both depend on people watching past the first few seconds.',
      },
      { t: 'h2', text: 'What changed in 2025 and 2026' },
      {
        t: 'ul',
        items: [
          '**Reposts (August 2025).** People can repost public Reels and posts. Instagram says reposts are recommended to the reposter’s friends and followers and stay credited to the original creator, so a repost can carry your Reel to people who don’t follow you. [Meta, 6 Aug 2025](https://about.fb.com/news/2025/08/new-instagram-features-help-you-connect/)',
          '**Skip rate and a retention chart (August 2025).** Instagram said Insights would show where viewers drop off in each Reel, and a skip rate: the share of views where people skipped within the first three seconds. [Social Media Today, 24 Aug 2025](https://www.socialmediatoday.com/news/instagram-adds-retention-insights-reels/758464/)',
          '**A Reels-first app test in India (September 2025).** Instagram began testing an app that opens straight into Reels for a limited group of users in India. It is a test, not the app everyone has. [Meta, 28 Sep 2025](https://about.fb.com/news/2025/09/in-india-instagram-debuts-a-reels-first-experience-for-its-mobile-app/)',
          '**Your Algorithm (December 2025).** Viewers can now see the topics shaping their Reels recommendations and ask for more or less of each. It launched in the US on 10 December 2025, with a global English rollout announced. Your Reel reaches people whose chosen topics it clearly fits. [TechCrunch, 10 Dec 2025](https://techcrunch.com/2025/12/10/instagrams-new-your-algorithm-tool-gives-you-more-control-over-the-reels-you-see)',
          '**Five hashtags at most (December 2025).** Instagram said, through its @creators account, that it would gradually limit captions on Reels and posts to five hashtags, and that fewer, more targeted hashtags work better. [Social Samosa, 19 Dec 2025](https://www.socialsamosa.com/news-2/instagram-hashtags-five-per-post-10923075)',
          '**Originality beyond Reels (April 2026).** The rule that recommends only the original of duplicate content was extended from Reels to photos and carousels. [Instagram for Creators, 30 Apr 2026](https://creators.instagram.com/blog/rewarding-original-creators-on-instagram)',
          '**AI-generated profile label (August 2026).** Instagram limits the reach of unlabelled profiles that feature an AI-generated person. Using AI tools while making a Reel does not need the label. [Instagram for Creators, 31 Aug 2026](https://creators.instagram.com/blog/ai-generated-profile-label/)',
        ],
      },
      { t: 'h2', text: 'What gets a Reel shown to fewer people' },
      {
        t: 'p',
        text: 'Instagram says it makes some Reels less visible: low-resolution or watermarked Reels, Reels that are muted or have borders, Reels that are mostly text, and Reels already posted on Instagram. [Instagram ranking explained](https://about.instagram.com/blog/announcements/instagram-ranking-explained)',
      },
      {
        t: 'p',
        text: 'Originality is the biggest rule. Since April 2024, when Instagram finds two or more identical pieces of content it recommends only the original, and accounts that post unoriginal content ten or more times in 30 days are removed from recommendations. [Social Media Today, 30 Apr 2024](https://www.socialmediatoday.com/news/instagram-algorithm-prioritize-original-emerging-creators/714777/) Adding a border, a watermark, subtitles or a credit in the caption does not make a repost original. [Instagram for Creators, 30 Apr 2026](https://creators.instagram.com/blog/rewarding-original-creators-on-instagram)',
      },
      {
        t: 'p',
        text: 'Instagram’s help centre adds that simply stitching clips together or adding a watermark doesn’t count as material editing, and suggests using the repost or story-share features instead of re-uploading someone else’s video. [About original content](https://help.instagram.com/1800814370401535/)',
      },
      { t: 'h2', text: 'When a whole account stops being recommended' },
      {
        t: 'p',
        text: 'Instagram’s recommendations guidelines list content that is allowed but may not be recommended, including unoriginal content with only minor edits and coordinated comment networks built to fake engagement. Accounts can lose recommendations for repeatedly buying likes or similar tactics, or for recent Community Guidelines violations. [Recommendations guidelines](https://help.instagram.com/313829416281232/)',
      },
      {
        t: 'p',
        text: 'If that happens, **none** of the account’s content is recommended to non-followers, though followers still see it. Professional accounts can check this under Account Status in settings and request a review. [Account Status](https://help.instagram.com/653964212890722)',
      },
      { t: 'h2', text: 'Metrics to watch in Insights' },
      {
        t: 'p',
        text: 'Judge each Reel against your own recent Reels, not against other accounts. Metric names change from time to time, so check the labels in your professional dashboard.',
      },
      {
        t: 'ul',
        items: [
          '**Skip rate and the retention chart:** whether the opening works and where people leave.',
          '**Average watch time:** one of the three signals Mosseri named.',
          '**Sends per reach:** shares divided by accounts reached. Your best guide to reach beyond your followers.',
          '**Likes per reach:** likes divided by accounts reached. Your best guide to how followers respond.',
          '**Profile visits, follows, link taps and messages:** what tells a business whether reach is turning into enquiries.',
        ],
      },
      { t: 'h2', text: 'Myths that don’t hold up' },
      {
        t: 'ul',
        items: [
          '**“Trending audio guarantees reach.”** Instagram counts audio as one piece of information about a Reel, alongside the visuals and how people respond. No Instagram source says a sound guarantees distribution.',
          '**“There’s a magic number of hashtags.”** Instagram now caps captions at five and says targeted hashtags beat many. It has never said hashtags guarantee reach.',
          '**“There’s one best time to post.”** Instagram has published no universal posting time. Your own Insights show when your followers are active.',
          '**“Reels must be under a set length.”** Mosseri said Instagram weighs both the share and the seconds watched so longer videos aren’t penalised.',
          '**“Low reach means a shadowban.”** Account Status tells you whether your account can be recommended. If it says yes, look at the Reel’s skip rate and retention first.',
          '**“A border or a credit makes a repost original.”** Instagram says it doesn’t.',
        ],
      },
      { t: 'h2', text: 'Low reach? Check these in order' },
      {
        t: 'ol',
        items: [
          'Open Account Status and confirm the account is eligible for recommendations.',
          'Check originality: your own footage, no other app’s watermark, not a re-upload of someone else’s video.',
          'If your profile features an AI-generated person, turn on the AI-generated profile label.',
          'Read the skip rate and retention chart. Most fixes start with the first three seconds.',
          'Compare sends per reach and likes per reach with your last ten Reels.',
          'Try the next idea as a Trial Reel shown to non-followers first.',
          'Give a new format several posts before judging it. One Reel is a small sample.',
        ],
      },
      { t: 'h2', text: 'Tools worth using' },
      {
        t: 'ul',
        items: [
          '**Trial Reels** (December 2024) show a Reel to non-followers first. Results arrive after about 24 hours, and you can have it shared to followers automatically if it performs well within 72 hours. [Trial Reels](https://creators.instagram.com/blog/instagram-trial-reels)',
          '**Reels up to three minutes** replaced the old 90-second limit in January 2025. [MediaNama](https://www.medianama.com/2025/01/223-instagram-reels-3-minutes-us-tiktok-ban/)',
          '**Edits**, Instagram’s free editing app launched in April 2025, exports without a watermark. [Edits](https://creators.instagram.com/blog/edits-video-creation-app)',
        ],
      },
      { t: 'h2', text: 'Your Reels can show up on Google too' },
      {
        t: 'p',
        text: 'For public professional accounts whose owners are over 18, search engines may index photos and videos from public posts and Reels uploaded since 2020. It can be switched off in privacy settings. [Instagram Help](https://help.instagram.com/147542625391305) This is one more reason to write captions and on-screen text that say plainly what the Reel is about and where it was shot.',
      },
      { t: 'h2', text: 'How we apply this to client Reels' },
      {
        t: 'ul',
        items: [
          'Plan the first three seconds before the shoot, then check the skip rate after posting.',
          'Make things people want to send: useful, local and specific beats generic.',
          'Track likes per reach and sends per reach per Reel, not follower count.',
          'Shoot original footage and export clean files. No reposts, no other app’s watermark.',
          'Use up to five hashtags that describe the Reel, and say what it is about in the caption.',
          'Test new formats as Trial Reels before they reach the whole following.',
          'Never buy likes, follows or comments. It costs the whole account its recommendations.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Does Instagram have one algorithm for Reels and posts?',
        a: 'No. Instagram describes separate ranking systems for Feed, Stories, Explore and Reels, each based on how people use that part of the app.',
      },
      {
        q: 'What are the most important Reels ranking signals in 2026?',
        a: 'Instagram has not published weights. Its 2023 explainer says Reels ranking predicts whether you will share, finish, like or open the audio page of a Reel, and in January 2025 Adam Mosseri named watch time, likes per reach and sends per reach as the top three.',
      },
      {
        q: 'Can viewers change which Reels Instagram shows them?',
        a: 'Yes. Your Algorithm, launched in the US in December 2025 with a global English rollout announced, shows viewers the topics behind their Reels recommendations and lets them ask for more or less of each.',
      },
      {
        q: 'How many hashtags should a Reel have?',
        a: 'Five at most. Instagram said in December 2025 it would limit captions to five hashtags and that fewer, targeted hashtags work better. Hashtags help describe a Reel; they don’t guarantee reach.',
      },
      {
        q: 'Do longer Reels get less reach?',
        a: 'Not for being long. Adam Mosseri said in February 2025 that Instagram weighs both the percentage and the seconds watched, so longer videos aren’t penalised. A long Reel still has to hold attention.',
      },
      {
        q: 'Can an agency guarantee Reels reach?',
        a: 'No. Nobody outside Instagram controls its recommendations. An agency can control what Instagram rewards: original footage, a strong opening, ideas people want to send, and honest measurement.',
      },
    ],
    sources: [S.rankingExplained, S.mosseri2025, S.watchSeconds, S.engagementRates, S.reposts, S.skipRate, S.indiaReelsFirst, S.yourAlgorithm, S.hashtags, S.originality2024, S.originality2026, S.originalHelp, S.aiLabel, S.recGuidelines, S.accountStatus, S.trialReels, S.threeMinutes, S.edits, S.indexing],
    services: ['reels-production', 'instagram-marketing'],
  },
  {
    slug: 'meta-ads-vs-google-ads',
    title: 'Meta ads or Google Ads: which should a local business start with?',
    metaTitle: 'Meta Ads vs Google Ads for Local Businesses',
    navTitle: 'Meta Ads vs Google Ads',
    description:
      'How Meta and Google Ads find customers, how each auction sets your price, which lead formats suit local businesses, and a simple way to choose where to start.',
    summary:
      'Start with Google Search ads if people already search for what you sell: the ad appears at the moment of intent. Start with Meta ads if they don’t search for it yet: Meta finds people by interest and behaviour, and they can reply through a form or WhatsApp without leaving the app. Most local businesses end up using both, but rarely on day one.',
    published: '2026-09-30',
    updated: '2026-09-30',
    author: 'Social ScaleX team',
    blocks: [
      { t: 'h2', text: 'How each platform finds your customer' },
      {
        t: 'p',
        text: 'Google describes Search campaigns as text ads that reach people **while they are searching on Google** for the products and services you offer. [Google Ads Help](https://support.google.com/google-ads/answer/2567043) The customer has already decided they need something; your ad competes to be the answer.',
      },
      {
        t: 'p',
        text: 'Meta works the other way round. People are scrolling, not searching, and Meta’s system decides who is most likely to act on your ad. Advantage+ audience uses Meta’s AI to find that audience for you, and Meta suggests testing it for almost every campaign except retargeting. [Meta Business Help](https://www.facebook.com/business/help/273363992030035)',
      },
      { t: 'h2', text: 'How each auction decides what you pay' },
      {
        t: 'p',
        text: 'Google runs an auction every time someone searches. Your Ad Rank depends on your bid, the quality of your ad and landing page, Ad Rank thresholds, the competition, the searcher’s context and the assets you use. Google says higher-quality ads can often lead to lower costs per click, and what you pay is often less than your maximum bid. [Ad Rank](https://support.google.com/google-ads/answer/1722122), [The ad auction](https://support.google.com/google-ads/answer/6366577)',
      },
      {
        t: 'p',
        text: 'Meta picks the ad with the highest “total value”, a combination of your bid, how likely the person is to take the action you want, and ad quality. In Meta’s words, an ad that’s more relevant to a person could win an auction against ads with higher bids. [About ad auctions](https://www.facebook.com/business/help/430291176997542)',
      },
      { t: 'p', text: 'On both platforms, a better ad costs less. Creative and landing pages are not decoration; they change the price.' },
      { t: 'h2', text: 'Start with Google Ads when…' },
      {
        t: 'ul',
        items: [
          'People already type what you sell into Google: “dentist near me”, “AC repair Noida”, “IELTS coaching Delhi”.',
          'The buyer is ready now and the order value can carry a click cost.',
          'You have a Google Business Profile with reviews, and calls or visits are the result you want.',
        ],
      },
      { t: 'h2', text: 'Start with Meta ads when…' },
      {
        t: 'ul',
        items: [
          'Nobody searches for your product yet, because it is new, visual or an impulse buy.',
          'Seeing it sells it: food, fashion, décor, events, gear.',
          'You want conversations. People can reply on WhatsApp or fill a form without leaving Instagram or Facebook.',
        ],
      },
      { t: 'h2', text: 'Lead formats that suit local businesses' },
      {
        t: 'ul',
        items: [
          '**Meta lead ads** collect details through an instant form inside Facebook or Instagram, with contact fields prefilled. [Lead ads](https://www.facebook.com/business/help/761812391313386)',
          '**Click-to-WhatsApp ads** open a chat with your business. They need a WhatsApp Business account connected to your Page or business portfolio. [Click to WhatsApp](https://www.facebook.com/business/help/447934475640650)',
          '**Google call assets** add a tap-to-call number to Search ads. Google removed the option to create new call-only ads in February 2026, and existing ones stop showing by February 2027. [About call ads](https://support.google.com/google-ads/answer/6341403)',
          '**Performance Max for store goals** optimises for store visits, calls and direction clicks across Maps, Search, YouTube and more. It needs a linked Business Profile. [Store goals](https://support.google.com/google-ads/answer/12971048)',
        ],
      },
      { t: 'h2', text: 'Budget: what the platforms themselves say' },
      {
        t: 'p',
        text: 'Meta publishes no fixed minimum in rupees; it varies by country and objective. If you set a cost-per-result goal, Meta says your daily budget should be at least five times that goal. [About ad budgets](https://www.facebook.com/business/help/203183363050448) An ad set usually leaves the learning phase after about 50 results in the week after its last significant edit, and Meta advises against editing during learning. [Learning phase](https://www.facebook.com/business/help/112167992830700)',
      },
      {
        t: 'p',
        text: 'That second number is the useful one for small budgets. If your budget can’t produce around 50 results a week, choose a result higher up the funnel, such as landing-page views or conversations, until it can.',
      },
      { t: 'h2', text: 'Fix tracking before you spend' },
      {
        t: 'p',
        text: 'Meta says its Conversions API is less affected by browser loading errors, connectivity issues and ad blockers than the Pixel, and that using both helps lower cost per result. [Conversions API](https://www.facebook.com/business/help/AboutConversionsAPI) On Google, enhanced conversions send hashed first-party data, such as the email from a form, to measure conversions more accurately. [Enhanced conversions](https://support.google.com/google-ads/answer/9888656)',
      },
      { t: 'p', text: 'Without tracking, both systems optimise for the cheapest clicks. With it, they optimise for customers.' },
      { t: 'h2', text: 'A simple way to decide' },
      {
        t: 'ol',
        items: [
          'Search for what you sell, the way a customer would. If competitors’ ads and a map pack appear, there is demand: start with Google.',
          'If results are thin or irrelevant, start with Meta and create the demand.',
          'Set up tracking on your website or WhatsApp before either goes live.',
          'Give one platform enough budget to learn before splitting spend across two.',
          'Add the second platform once the first produces leads at a cost you can live with.',
        ],
      },
    ],
    sources: [S.gSearch, S.gPmax, S.gPmaxStore, S.gCallAds, S.gAdRank, S.gAuction, S.gEnhanced, S.mAuction, S.mAdvantage, S.mLeadAds, S.mCtwa, S.mLearning, S.mBudget, S.mCapi],
    services: ['meta-ads', 'google-ads'],
  },
  {
    slug: 'choose-social-media-agency',
    title: 'How to choose a social media marketing agency: 10 checks before you sign',
    metaTitle: 'How to Choose a Social Media Marketing Agency',
    navTitle: 'Choosing an agency',
    description:
      'Ten checks before you hire a social media agency in Delhi NCR or anywhere in India: ownership, passwords, real numbers, reporting, disclosure and exit terms.',
    summary:
      'Hire the agency that lets you keep ownership of every account, reports from your own dashboards, shows client numbers you can verify, and gets reach without shortcuts like bought followers. Before you sign, check who does the work, how influencer posts are disclosed, how ad fees are shown, and what you keep if you leave.',
    published: '2026-09-30',
    updated: '2026-09-30',
    author: 'Social ScaleX team',
    blocks: [
      {
        t: 'p',
        text: 'We are an agency, so read this knowing that. Every check below is one we expect to be held to ourselves, and each one links to the platform’s own rules so you don’t have to take our word for it.',
      },
      { t: 'h2', text: '1. Will you own every account?' },
      {
        t: 'p',
        text: 'Your Instagram, Facebook Page, ad accounts and YouTube channel should sit in your name, with the agency given access. Meta lets a business give a partner full or partial access to its assets, and a partner cannot share those assets with another business; only the owner can. [Meta Business Help](https://www.facebook.com/business/help/1717412048538897) For Google Ads, Google says an agency must set up a separate Ads account for you. [Google](https://support.google.com/adspolicy/answer/9457109)',
      },
      { t: 'h2', text: '2. Do they ask for your password?' },
      {
        t: 'p',
        text: 'They shouldn’t need it. Instagram’s terms forbid soliciting, collecting or using other people’s login credentials. [Instagram Terms](https://help.instagram.com/581066165581870) Partner access in Meta’s business tools and channel permissions in YouTube Studio exist so that nobody has to share a password.',
      },
      { t: 'h2', text: '3. Can they show real client numbers?' },
      {
        t: 'p',
        text: 'Ask to see results from named clients, taken from those clients’ own Insights, with dates. Percentages without a starting number, or screenshots with the account name cropped out, prove little.',
      },
      { t: 'h2', text: '4. Do reports come from your own dashboards?' },
      {
        t: 'p',
        text: 'Monthly reports should use numbers you can open yourself: Instagram Insights, YouTube Studio, Meta Ads Manager, Google Ads. On Google, you have the right to know the clicks, impressions and total cost of your ads, and agencies must give you your customer ID on request. [Google third-party policy](https://support.google.com/adspolicy/answer/6086450)',
      },
      { t: 'h2', text: '5. Do they buy followers or use engagement apps?' },
      {
        t: 'p',
        text: 'Instagram warns against apps that offer likes or followers: they can gain complete access to your account, Instagram may remove the engagement they generate, and it can limit your account. [Instagram Help](https://help.instagram.com/263751177667145) Buying likes can also make your account ineligible for recommendations. [Recommendations guidelines](https://help.instagram.com/313829416281232/)',
      },
      { t: 'h2', text: '6. How do they plan to get you reach?' },
      {
        t: 'p',
        text: 'A good answer mentions original content, watch time and shares. Instagram now recommends only the original when it finds identical content, and removes accounts that mostly post unoriginal material from recommendations. [Instagram for Creators](https://creators.instagram.com/blog/rewarding-original-creators-on-instagram) An agency built on reposting trending clips is building on a rule that no longer works. Our [Reels reach guide](/guides/instagram-reels-reach) covers the details.',
      },
      { t: 'h2', text: '7. Who actually does the work?' },
      {
        t: 'p',
        text: 'Ask who will shoot, edit, write captions and run ads, and whether you can speak to them. Many agencies sell with senior people and deliver with freelancers you never meet.',
      },
      { t: 'h2', text: '8. How do they handle influencer disclosure?' },
      {
        t: 'p',
        text: 'In India, influencer posts must carry a clear label such as Ad, Sponsored, Collaboration or Partnership, or the platform’s paid-partnership tag, and the label must not be buried among hashtags. [ASCI guidelines](https://www.ascionline.in/wp-content/uploads/2023/08/GUIDELINES-FOR-INFLUENCER-ADVERTISING-IN-DIGITAL-MEDIA.pdf) The Department of Consumer Affairs’ 2023 guidelines say disclosures must be prominent and extremely hard to miss. [PIB](https://www.pib.gov.in/PressReleasePage.aspx?PRID=1892527)',
      },
      {
        t: 'p',
        text: 'This is not a formality. ASCI reported in February 2025 that 69% of India’s top 100 digital stars failed to meet its guidelines, and 43.2% of violations were disclosures buried in hashtags. [ASCI report](https://www.ascionline.in/wp-content/uploads/2025/02/Press-Release-Influencer-Disclosure-Guidelines-ASCI-Report.pdf) Ask to see a past brief.',
      },
      { t: 'h2', text: '9. Are ad budgets and fees kept separate?' },
      {
        t: 'p',
        text: 'Your ad spend should be billed to your own card or account, separate from the agency fee. Google’s third-party policy requires agencies to disclose management fees in writing before the first sale and on invoices. [Google third-party policy](https://support.google.com/adspolicy/answer/6086450)',
      },
      { t: 'h2', text: '10. What happens if you leave?' },
      {
        t: 'p',
        text: 'Ask it before you sign. You should keep the accounts, the content, the raw footage and the strategy documents. On Google Ads, keep at least one admin on your side; Google suggests having more than one admin in an account. [Access levels](https://support.google.com/google-ads/answer/6372672)',
      },
      { t: 'h2', text: 'Red flags in one list' },
      {
        t: 'ul',
        items: [
          'A guaranteed number of followers or views.',
          'A request for your Instagram or Google password.',
          'Ad accounts created in the agency’s name.',
          'Reports built from screenshots instead of your dashboards.',
          'No named clients, or results you can’t verify.',
          'Influencer posts with the disclosure hidden in hashtags.',
        ],
      },
    ],
    sources: [S.mPartners, S.gThirdParty, S.igTerms, S.gThirdPartyPolicy, S.igApps, S.recGuidelines, S.originality2026, S.asci, S.doca, S.asciReport, S.gAccess],
    services: ['social-media-strategy', 'instagram-marketing', 'influencer-marketing'],
  },
  {
    slug: 'diwali-social-media-plan',
    title: 'Diwali 2026 social media plan for Delhi NCR small businesses',
    metaTitle: 'Diwali 2026 Social Media Plan for Small Business',
    navTitle: 'Diwali 2026 plan',
    description:
      'A dated Diwali 2026 plan for Delhi NCR shops, clinics and cafés: what to post each week, Reels ideas by business, WhatsApp and Meta ads setup, what to measure.',
    summary:
      'Diwali falls on Sunday 8 November 2026. From mid-October that leaves about three weeks: one to set up your offer, profile and replies, one to build interest with Reels and ads, and Diwali week to answer every enquiry fast. Start paid ads by the end of October so they have time to settle before the rush.',
    published: '2026-10-15',
    updated: '2026-10-15',
    author: 'Social ScaleX team',
    blocks: [
      { t: 'h2', text: 'The dates that set the plan' },
      {
        t: 'p',
        text: 'The Government of India’s 2026 holiday list puts Diwali (Deepavali) on **Sunday 8 November 2026**. [DoPT holiday list 2026](https://www.staffnews.in/2025/07/list-of-holidays-2026-dopt-order-reg-closed-and-restricted-holidays.html) Dhanteras falls in the days just before it; check your local panchang for the exact date if your offer depends on it.',
      },
      {
        t: 'ul',
        items: [
          '**15–21 October: set up.** One offer, your profile, your replies and your tracking.',
          '**22–31 October: build interest.** Reels, Stories and paid ads, launched by the end of the month.',
          '**1–8 November: convert.** Fast replies, reminders to people who asked for them, clear opening hours.',
          '**After Diwali: follow up.** Thank customers, ask happy ones for a Google review, and read the numbers.',
        ],
      },
      { t: 'h2', text: 'Week 1: set up before you post' },
      {
        t: 'ol',
        items: [
          '**Pick one offer and one end date.** A gift box, a festive menu, a pre-Diwali appointment slot. One clear offer is easier to post about and easier to measure than five.',
          '**Fix your Instagram profile.** Say the offer and your area in the bio, pin the offer post, and add a link or WhatsApp button that opens a chat.',
          '**Set holiday hours on Google.** Google Business Profile lets you set special hours for holidays, and Google suggests confirming them even when they don’t change. [Google Business Profile Help](https://support.google.com/business/answer/6303076)',
          '**Prepare WhatsApp replies.** Write quick replies for price, stock, delivery area and timings, and a greeting message that says when you’ll reply. Our [WhatsApp automation page](/automation/whatsapp-automation) covers the setup.',
          '**Decide how you’ll count enquiries.** A different pre-typed WhatsApp message for the bio link, each ad and the website tells you where each chat came from.',
        ],
      },
      { t: 'h2', text: 'Week 2: Reels that people send to each other' },
      {
        t: 'p',
        text: 'Instagram says the Reels it predicts people will share and watch to the end are the ones it shows more, and it recommends only the original when it finds duplicates. [Instagram ranking explained](https://about.instagram.com/blog/announcements/instagram-ranking-explained) So shoot your own footage in your own shop, and make something a customer would forward to the person they’re shopping with. Our [Reels algorithm guide](/guides/instagram-reels-reach) explains the rest.',
      },
      {
        t: 'ul',
        items: [
          '**Sweet shop or bakery:** one box packed start to finish, with the price and the last order date on screen.',
          '**Jewellery or gifting:** three choices at three budgets, filmed at the counter.',
          '**Boutique:** one outfit styled three ways for the three days of the festival.',
          '**Salon or clinic:** the slots still open before Diwali, filmed as a walk through the space.',
          '**Café or restaurant:** the festive menu plated in one take, with how to book a table.',
          '**Home décor or electronics:** a quick set-up at a real customer’s home, with their permission.',
          '**Any local shop:** name your market and the landmark beside you. Shoppers in Delhi NCR search by market name.',
        ],
      },
      {
        t: 'p',
        text: 'Test a new idea as a Trial Reel shown to non-followers first. [Trial Reels](https://creators.instagram.com/blog/instagram-trial-reels) If you pay a creator to feature your offer, the post must be labelled as an ad under ASCI’s influencer guidelines. [ASCI guidelines](https://www.ascionline.in/wp-content/uploads/2023/08/GUIDELINES-FOR-INFLUENCER-ADVERTISING-IN-DIGITAL-MEDIA.pdf)',
      },
      { t: 'h2', text: 'Paid ads: start by the end of October' },
      {
        t: 'p',
        text: 'Meta’s delivery system goes through a learning phase after an ad set launches and again after significant edits. [Meta: learning phase](https://www.facebook.com/business/help/112167992830700) Launching in late October and leaving the ads alone gives them time to settle before Diwali week, when you want them delivering steadily.',
      },
      {
        t: 'ul',
        items: [
          '**You sell through conversations:** ads that open a WhatsApp chat. [Meta: click-to-WhatsApp ads](https://www.facebook.com/business/help/447934475640650)',
          '**You call people back:** lead ads with a short form. [Meta: lead ads](https://www.facebook.com/business/help/761812391313386)',
          '**People already search for what you sell:** Google Search ads may catch them first. Our [Meta vs Google Ads guide](/guides/meta-ads-vs-google-ads) helps you choose.',
          '**Keep the target area tight.** A store doesn’t need to pay to reach people across the city who will never visit.',
        ],
      },
      { t: 'h2', text: 'Diwali week: answer fast, message only people who asked' },
      {
        t: 'p',
        text: 'Most festive enquiries arrive as DMs and WhatsApp chats, and a slow reply loses the sale to the next shop. Check messages several times a day and use your saved replies.',
      },
      {
        t: 'p',
        text: 'Don’t broadcast offers to every contact in your phone. WhatsApp’s Business Messaging Policy lets you message people only if they gave you their number and agreed to hear from you, and you must respect anyone who asks you to stop. [WhatsApp Business Messaging Policy](https://business.whatsapp.com/policy)',
      },
      { t: 'h2', text: 'After Diwali: what to measure' },
      {
        t: 'ul',
        items: [
          '**Enquiries by source:** bio link, each ad, website, walk-ins who mention Instagram.',
          '**Enquiries that bought:** the number that matters; reach and likes only explain it.',
          '**Cost per enquiry and per sale** for each ad.',
          '**Which Reels people sent:** sends per reach, for next year’s ideas.',
        ],
      },
      {
        t: 'p',
        text: 'Then ask customers who were happy to leave a Google review. Don’t offer anything in return: Google removes reviews given for payment, discounts or free goods. [Google Maps content policy](https://support.google.com/contributionpolicy/answer/7400114)',
      },
    ],
    faqs: [
      {
        q: 'When is Diwali 2026?',
        a: 'Sunday 8 November 2026, according to the Government of India’s 2026 holiday list.',
      },
      {
        q: 'Is mid-October too late to plan Diwali social media?',
        a: 'No, if you keep it to one offer. Set up in the first week, post and launch ads in the second, and spend Diwali week replying to enquiries.',
      },
      {
        q: 'Can I send my Diwali offer to all my WhatsApp contacts?',
        a: 'Only to people who gave you their number and agreed to receive messages from you. WhatsApp’s Business Messaging Policy requires that opt-in and requires you to stop when someone asks.',
      },
      {
        q: 'Should I use Meta ads or Google Ads for a Diwali sale?',
        a: 'Meta ads create interest among people nearby who aren’t searching yet; Google Search ads reach people already looking for what you sell. Many local shops start with Meta ads that open a WhatsApp chat.',
      },
    ],
    sources: [S.diwali2026, S.gbpHours, S.rankingExplained, S.trialReels, S.asci, S.mLearning, S.mCtwa, S.mLeadAds, S.waPolicy, S.gReviews],
    services: ['meta-ads', 'reels-production'],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

/** Plain text of a guide's blocks, for word counts and schema. */
export function guideWordCount(g: Guide): number {
  const text = [g.summary, ...g.blocks.map((b) => ('text' in b ? b.text : 'items' in b ? b.items.join(' ') : ''))].join(' ');
  return text.split(/\s+/).filter(Boolean).length;
}
