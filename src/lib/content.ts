// ─────────────────────────────────────────────────────────────────────
// Marketing content, typed and in one place.
//
// Every page, every JSON-LD node and /llms.txt render from this file, so
// structured data can never say something the visible page does not.
//
// Rules:
//   · Never invent a metric, a price, a client, a review or a guarantee.
//   · Facts about Instagram, Meta, Google or Indian rules cite the official
//     source in src/lib/sources.ts. If it can't be cited, it isn't written.
//   · Client figures are point-in-time snapshots from each client's own
//     dashboard, published with permission (see PORTFOLIO).
// ─────────────────────────────────────────────────────────────────────

export interface Faq {
  q: string;
  a: string;
}

export interface Step {
  title: string;
  desc: string;
}

export interface Service {
  slug: string;
  /** Short name for menus, cards and breadcrumbs. */
  name: string;
  /** <title> without the brand (the layout template appends it). */
  metaTitle: string;
  metaDescription: string;
  /** The page's one H1, written the way people search for it. */
  h1: string;
  /** 40–60 word answer directly under the H1. Stands alone when quoted. */
  lede: string;
  /** What changes for the client. Used on cards. */
  outcome: string;
  deliverables: string[];
  fit: string[];
  notFit: string[];
  steps: Step[];
  faqs: Faq[];
  /** PORTFOLIO ids whose work used this service. Empty = no case to show. */
  caseIds: string[];
  related: string[];
}

export const SERVICES: Service[] = [
  {
    slug: 'instagram-marketing',
    name: 'Instagram & Facebook management',
    metaTitle: 'Instagram Marketing Agency in Delhi NCR',
    metaDescription:
      'Instagram and Facebook page management for Delhi NCR brands: content calendar, Reels, captions, replies and profile fixes. Book a free strategy call.',
    h1: 'Instagram marketing agency in Delhi NCR',
    lede:
      'We run your Instagram day to day: planning the feed, producing and posting Reels and Stories, writing captions, replying to comments and DMs, and fixing the profile so new visitors follow. Your Facebook Page runs from the same plan. You approve the direction each month, and we handle everything after that.',
    outcome:
      'Your page runs without you. Posts go out on schedule, comments get answered, and you approve the direction once a month.',
    deliverables: [
      'Monthly content calendar built on clear content pillars',
      'Reels, carousels and Stories produced and scheduled',
      'Captions and hashtags written for every post',
      'Comment and DM replies handled for you',
      'Bio, highlights and link-in-bio rebuilt so first-time visitors follow',
      'Facebook Page posting from the same calendar',
      'Collab posts and creator partnerships',
      'Monthly report pulled from your own Instagram Insights',
    ],
    fit: [
      'Brands and shops whose customers already spend time on Instagram',
      'Creators who want to post consistently without doing all of it themselves',
      'Businesses with a quiet page that needs restarting properly',
    ],
    notFit: [
      'You want a guaranteed follower number. Nobody honest can promise one.',
      'You need a single post for an occasion, not a page run month after month.',
    ],
    steps: [
      { title: 'Audit', desc: 'We go through your page, your Insights and three competitors in your category, and write down what to keep, fix and stop.' },
      { title: 'Plan', desc: 'A monthly calendar with content pillars, formats and posting days. Nothing goes live until you approve it.' },
      { title: 'Run', desc: 'We shoot, edit, post, write captions and reply to comments and DMs, so the page stays active every day.' },
      { title: 'Review', desc: 'A monthly report from your own Insights: what reached new people, what they watched, and what changes next month.' },
    ],
    faqs: [
      {
        q: 'Is there an Instagram marketing agency near me?',
        a: 'If you are in Delhi, Noida, Gurugram, Ghaziabad or Faridabad, yes: we are based in Delhi NCR and shoot on location across all five, and you can check your area or pin code on our areas page. Page management, ads and reporting run remotely, so we also work with brands anywhere in India.',
      },
      {
        q: 'Will you need my Instagram password?',
        a: 'No. You add us as a partner in your Meta business portfolio, so the account stays yours and you can remove our access at any time. Instagram’s own terms tell people not to share or collect login details, and we don’t ask for them.',
      },
      {
        q: 'Do you buy followers or use engagement apps?',
        a: 'Never. Instagram says it may remove likes and follows that come from these apps and can limit the accounts using them, and buying likes can make an account ineligible for recommendations. Every follower on the accounts we manage arrived because of the content.',
      },
      {
        q: 'How many posts a month will you publish?',
        a: 'It is set in the plan we agree after the audit and written into the calendar you approve. We would rather post fewer Reels that people watch to the end than hit a number for its own sake, because watch time is one of the signals Instagram weighs most.',
      },
      {
        q: 'Do you manage Facebook as well?',
        a: 'Yes. Your Facebook Page is posted from the same monthly calendar, with formats adjusted for Facebook. If you also run ads, both accounts sit in one Meta business portfolio that you own.',
      },
    ],
    caseIds: ['prago', 'saini-telecom', 'big-discount-mart'],
    related: ['reels-production', 'meta-ads', 'social-media-strategy'],
  },
  {
    slug: 'reels-production',
    name: 'Reels & video production',
    metaTitle: 'Reels & Short Video Production in Delhi NCR',
    metaDescription:
      'Instagram Reels and YouTube Shorts shot, edited and captioned in-house in Delhi NCR. Hooks written for watch time and shares. Book a free strategy call.',
    h1: 'Reels and short video production in Delhi NCR',
    lede:
      'We produce the videos ourselves. Shooting, editing, motion graphics, sound and captions all happen in-house, so you are not hunting for freelancers or filming on your phone between meetings. Give us product access or a shoot date, and finished Reels, YouTube Shorts and carousels come back ready to publish.',
    outcome:
      'You stop filming on your phone between meetings. Finished Reels and posts arrive ready to publish.',
    deliverables: [
      'Reels and YouTube Shorts, shot and edited end to end',
      'Hooks and scripts planned before the shoot',
      'Static posts and carousels designed to your brand',
      'Talking-head and explainer video editing',
      'Motion graphics, on-screen captions and sound design',
      'Clean exports with no other app’s watermark',
      'Raw footage and project files handed over on request',
    ],
    fit: [
      'Brands without an in-house video team',
      'Creators who shoot plenty but have no time to edit',
      'Products that sell better when people see them being used',
    ],
    notFit: [
      'You only need template graphics, not filmed content.',
      'You are looking for a television commercial with a full studio crew.',
    ],
    steps: [
      { title: 'Brief', desc: 'We agree the message, write the hooks and plan a shot list, so the shoot day has no guesswork.' },
      { title: 'Shoot', desc: 'On location across Delhi NCR, at your store, your venue or outdoors.' },
      { title: 'Edit', desc: 'Cuts, captions, sound and graphics. You see the edit before it posts.' },
      { title: 'Learn', desc: 'We check watch time and shares on every Reel and feed what worked into the next shoot.' },
    ],
    faqs: [
      {
        q: 'Can we hire a content creator for our brand?',
        a: 'Yes. Our in-house team works as your content creator: we plan, shoot, edit and caption Reels, Shorts and posts for your brand. If you want creators with their own following to post about you, that is influencer marketing.',
      },
      {
        q: 'What makes a Reel reach more people?',
        a: 'Instagram says its most important Reels predictions are how likely someone is to share it, watch it to the end, like it and open its audio page. Adam Mosseri has named watch time, likes per reach and sends per reach as the top signals. So we edit for the first seconds and for rewatches, not for the thumbnail.',
      },
      {
        q: 'Can the same videos go on YouTube Shorts?',
        a: 'Yes. We cut the same shoot for Reels and Shorts and export clean files. Instagram says it shows watermarked Reels, and Reels already posted on Instagram, to fewer people, so we never re-upload another app’s export.',
      },
      {
        q: 'Who owns the footage?',
        a: 'You do. Every finished video belongs to your brand, and the raw footage and project files are handed over on request, including if you stop working with us.',
      },
      {
        q: 'Do you only shoot in Delhi NCR?',
        a: 'Most of our shoots happen across Delhi, Noida and Gurugram. If you are elsewhere in India, ask on the call. Editing footage you send us works from anywhere.',
      },
    ],
    caseIds: ['prago', 'acdelhivlogs', 'subh'],
    related: ['instagram-marketing', 'product-shoots', 'youtube-management'],
  },
  {
    slug: 'meta-ads',
    name: 'Meta ads (Facebook & Instagram)',
    metaTitle: 'Meta Ads Agency in Delhi NCR',
    metaDescription:
      'Facebook and Instagram ads for Delhi NCR businesses: lead forms, click-to-WhatsApp, Pixel and Conversions API, weekly creative testing. Free strategy call.',
    h1: 'Meta ads agency in Delhi NCR for Facebook and Instagram ads',
    lede:
      'We build the campaign structure, make the ad creative, set the audience, then test versions against each other until the cost per result stops falling. The ad account stays in your own Meta business portfolio under your billing, so you see every campaign, every rupee spent and every lead directly.',
    outcome:
      'Your ad spend stops guessing. Creative is tested against creative until the cost per result stops falling.',
    deliverables: [
      'Campaign, ad set and audience structure',
      'Ad creative made for paid placements, not boosted posts',
      'Lead ads with instant forms, or click-to-WhatsApp ads',
      'Meta Pixel and Conversions API set up and checked',
      'A/B tests on creative and audiences',
      'Retargeting and lookalike audiences',
      'Weekly report on spend and cost per result',
    ],
    fit: [
      'Local businesses that want enquiries, calls or WhatsApp chats',
      'Online stores selling to people who already scroll Instagram',
      'Launches and events that need reach in a specific city',
    ],
    notFit: [
      'You want ads live today, before tracking works. We fix measurement first.',
      'The budget can’t run long enough for Meta to learn. We will tell you on the call.',
    ],
    steps: [
      { title: 'Check', desc: 'Pixel, Conversions API, business portfolio and past campaigns reviewed before any money is spent.' },
      { title: 'Plan', desc: 'Offer, audience and creative angles written down, with the result we are paying for defined up front.' },
      { title: 'Launch', desc: 'Campaigns go live and are left alone through the learning phase instead of being edited every day.' },
      { title: 'Improve', desc: 'Weekly: losing ads paused, winning angles given new versions, spend and cost per result reported.' },
    ],
    faqs: [
      {
        q: 'How much should we spend on Meta ads?',
        a: 'Meta publishes no fixed minimum in rupees. Its own guidance is that a daily budget should be at least five times your cost-per-result goal, and that an ad set usually leaves the learning phase after about 50 results in a week. We size the budget from those two numbers, and you pay Meta directly.',
      },
      {
        q: 'Lead forms or WhatsApp: which works better?',
        a: 'Lead ads collect details inside Facebook or Instagram without sending people to a website. Click-to-WhatsApp ads open a chat with your business instead. We usually test both. Forms tend to give more volume and WhatsApp gives live conversations, so the winner depends on how quickly your team replies.',
      },
      {
        q: 'Why set up the Conversions API as well as the Pixel?',
        a: 'Meta says the Conversions API is less affected by browser loading errors, connectivity issues and ad blockers than the Pixel alone, and that using both helps lower cost per result. Without reliable tracking, the system optimises for cheap clicks instead of customers.',
      },
      {
        q: 'Who owns the ad account?',
        a: 'You do. We work through partner access in your Meta business portfolio. Under Meta’s rules, a partner can’t share your assets with another business; only the owner can. Remove our access and everything stays with you.',
      },
    ],
    caseIds: [],
    related: ['google-ads', 'reels-production', 'instagram-marketing'],
  },
  {
    slug: 'google-ads',
    name: 'Google Ads',
    metaTitle: 'Google Ads Management in Delhi NCR',
    metaDescription:
      'Google Ads for Delhi NCR businesses: search campaigns on the keywords buyers use, conversion tracking, weekly search-term cleanup, account in your name.',
    h1: 'Google Ads management for Delhi NCR businesses',
    lede:
      'Google Ads puts your business in front of people who are already searching for what you sell. We build Search campaigns around the words your buyers type, add Performance Max where it fits, connect conversion tracking and your Google Business Profile, and report cost per lead from an account you own.',
    outcome:
      'You reach people at the moment they search, and you can see which searches turned into customers.',
    deliverables: [
      'Keyword research and Search campaign build',
      'Ad copy with sitelink, call and location assets',
      'Performance Max for lead or store goals, where it fits',
      'Conversion tracking with enhanced conversions',
      'Weekly search-term review and negative keywords',
      'Monthly report on cost per lead and wasted spend',
    ],
    fit: [
      'Businesses people already search for: services, clinics, institutes, local stores',
      'Brands running Meta ads that want leads with clearer intent',
      'Anyone paying for clicks without knowing which ones became customers',
    ],
    notFit: [
      'Nobody searches for your product yet. Meta ads usually create that demand first.',
    ],
    steps: [
      { title: 'Demand check', desc: 'We look at what people in your area actually search for, and whether the searches are worth paying for.' },
      { title: 'Setup', desc: 'Account in your name, conversion tracking, Google Business Profile link and campaign structure.' },
      { title: 'Launch', desc: 'Search campaigns go live on a tight keyword list, with call and location assets for local intent.' },
      { title: 'Cleanup', desc: 'Every week we read the search terms, cut the ones that waste money and move budget to the ones that convert.' },
    ],
    faqs: [
      {
        q: 'Should a local business start with Google Ads or Meta ads?',
        a: 'If people already search for what you sell, Google Search ads catch them at the moment of intent. If they don’t search for it yet, Meta ads find them by interest and behaviour. Many local businesses end up using both. We start with whichever has the clearer path to a paying customer.',
      },
      {
        q: 'How does Google decide what I pay per click?',
        a: 'Google runs an auction for every search. Where your ad shows depends on your bid, the quality of your ad and landing page, and the searcher’s context. Google says higher-quality ads can often lead to lower costs per click, and what you actually pay is often less than your maximum bid.',
      },
      {
        q: 'Will I own the Google Ads account?',
        a: 'Yes. Google’s guidance for advertisers says an agency must set up a separate Ads account for you and that you have the right to know the clicks, impressions and total cost. We are added as users on your account, and you keep admin access.',
      },
      {
        q: 'Can people still call us straight from an ad?',
        a: 'Yes, through call assets. Google removed the option to create new call-only ads in February 2026, so we add your phone number as a call asset on your Search ads and people can tap to call from the results page.',
      },
    ],
    caseIds: [],
    related: ['meta-ads', 'social-media-strategy', 'instagram-marketing'],
  },
  {
    slug: 'youtube-management',
    name: 'YouTube channel management',
    metaTitle: 'YouTube Channel Management Services',
    metaDescription:
      'YouTube channel management for brands and creators: titles, thumbnails, Shorts, playlists and Studio reviews. One channel we run has passed 100K subscribers.',
    h1: 'YouTube channel management for brands and creators',
    lede:
      'We run the channel around your videos: titles, descriptions and thumbnails, Shorts cut from long-form, playlists and channel layout, the upload schedule, and a monthly review of watch time and subscribers from YouTube Studio. One channel we work on today has 101K subscribers.',
    outcome:
      'Your videos go out packaged properly, on schedule, and you know which ones are bringing subscribers.',
    deliverables: [
      'Upload schedule and video planning',
      'Titles, descriptions and thumbnail design',
      'Shorts cut from long-form videos',
      'Channel banner, sections and playlist layout',
      'Comment replies and community posts',
      'Monthly watch time and subscriber review from YouTube Studio',
    ],
    fit: [
      'Creators with plenty of footage and no time to package it',
      'Brands with product or explainer videos that nobody finds',
      'Instagram creators who want the same shoots working on a second platform',
    ],
    notFit: [
      'You expect a channel to earn from ads within a month. YouTube grows slowly, then compounds.',
    ],
    steps: [
      { title: 'Audit', desc: 'Which videos brought subscribers, where viewers drop off, and how the channel looks to a first-time visitor.' },
      { title: 'Package', desc: 'Title and thumbnail system, playlists, channel sections and an upload rhythm you can sustain.' },
      { title: 'Publish', desc: 'Long-form uploads plus Shorts cut from them, so every shoot works twice.' },
      { title: 'Review', desc: 'A monthly YouTube Studio review: views, watch time, average view duration and subscribers gained.' },
    ],
    faqs: [
      {
        q: 'Can you turn our Instagram Reels into YouTube Shorts?',
        a: 'Yes. Most creators we manage publish on both. One shoot is cut vertically for Reels and Shorts and edited long-form for the main channel, so a day of filming feeds both platforms.',
      },
      {
        q: 'What do you report on?',
        a: 'Views, watch time, average view duration, subscribers gained and lost, and which videos brought them, all from YouTube Studio. Journey Without Visa’s report, for example, showed 514 new subscribers in 28 days.',
      },
      {
        q: 'Do you need our Google account password?',
        a: 'No. YouTube lets a channel owner invite managers and editors through channel permissions in YouTube Studio, so you never share your Google password and can remove access whenever you like.',
      },
    ],
    caseIds: ['acdelhivlogs', 'journey'],
    related: ['reels-production', 'instagram-marketing', 'social-media-strategy'],
  },
  {
    slug: 'influencer-marketing',
    name: 'Influencer marketing',
    metaTitle: 'Influencer Marketing Agency in Delhi NCR',
    metaDescription:
      'Influencer campaigns in Delhi NCR: creators checked on real reach, fair rates negotiated, ASCI-compliant briefs and post-campaign reports. Free strategy call.',
    h1: 'Influencer marketing agency in Delhi NCR',
    lede:
      'We shortlist creators whose audience overlaps yours, check their real reach rather than their follower count, handle outreach and rates, then brief and schedule the collaboration. Because we manage creator accounts ourselves, we know what a fair rate looks like and where padded numbers hide.',
    outcome:
      'You reach people who already trust someone, at a rate we can tell you is fair.',
    deliverables: [
      'Creator shortlist matched to your audience',
      'Reach and audience-quality checks before outreach',
      'Outreach, negotiation and rate benchmarking',
      'Creative briefs with ASCI-compliant disclosure',
      'Campaign media plan across platforms',
      'Post-campaign performance report',
    ],
    fit: [
      'Launches that need reach in a particular city, fast',
      'Products that sell better when someone shows them in use',
      'Brands that tried influencers before and couldn’t tell what worked',
    ],
    notFit: [
      'You want creators to post without disclosing the partnership. Indian rules don’t allow it.',
    ],
    steps: [
      { title: 'Brief', desc: 'Who you want to reach, where they live and what a good result looks like.' },
      { title: 'Shortlist', desc: 'Creators checked on their own Insights: reach, audience cities and age, and past sponsored posts.' },
      { title: 'Book', desc: 'Rates negotiated, deliverables and dates agreed, and a brief that includes the disclosure.' },
      { title: 'Report', desc: 'Reach, views and clicks per creator, so the next campaign books the ones that worked.' },
    ],
    faqs: [
      {
        q: 'How do I find Instagram influencers in Delhi for my brand?',
        a: 'Start with creators your customers already follow, then check each one’s Insights: audience city and age, reach to non-followers and past sponsored posts. We shortlist Instagram influencers and content creators across Delhi NCR this way and handle outreach and rates.',
      },
      {
        q: 'How do you check an influencer’s audience is real?',
        a: 'We ask for the creator’s own Insights, not just the public follower count: reach, audience cities and age, and how much of their reach comes from non-followers. Instagram says buying likes or using coordinated comment networks can make an account ineligible for recommendations, which is why padded accounts often show many followers and little reach.',
      },
      {
        q: 'Do influencer posts in India have to be labelled as ads?',
        a: 'Yes. ASCI’s guidelines require a clear label such as Ad, Advertisement, Sponsored, Collaboration or Partnership, or the platform’s paid-partnership tag, and the label must not be buried in a group of hashtags. The Department of Consumer Affairs’ 2023 endorsement guidelines say disclosures must be prominent and hard to miss.',
      },
      {
        q: 'Should we use small or big influencers?',
        a: 'It depends on the goal. Smaller creators with a tight local audience usually suit footfall and product trial; bigger ones suit launch awareness. We shortlist both and compare them on audience match and past reach, not follower count.',
      },
    ],
    caseIds: ['wanna-party'],
    related: ['reels-production', 'instagram-marketing', 'meta-ads'],
  },
  {
    slug: 'product-shoots',
    name: 'Product & event shoots',
    metaTitle: 'Product Photoshoots & Event Shoots in Delhi NCR',
    metaDescription:
      'Product photoshoots, event coverage and on-location Reels shoots across Delhi, Noida and Gurugram. Photos and video from one shoot, raw files included.',
    h1: 'Product photoshoots and event shoots in Delhi NCR',
    lede:
      'We shoot on location across Delhi NCR, from Delhi and Noida to Gurugram, Ghaziabad and Faridabad: product photography, event coverage, teasers and on-location video. You get original footage of your actual product or venue instead of stock images your competitors also use, and the full raw library comes to you.',
    outcome:
      'Your product appears in real footage of itself, not stock imagery your competitors also bought.',
    deliverables: [
      'Product photography, styled and retouched',
      'On-location video shoots for Reels and ads',
      'Event coverage edited the same week',
      'Teaser and announcement cutdowns',
      'Full raw asset library delivered to you',
    ],
    fit: [
      'Online stores and D2C brands that need product photos and Reels together',
      'Cafés, stores and venues that want their real space on camera',
      'Events and launches that need edits while people are still talking about them',
    ],
    notFit: [
      'You need a large studio production with sets and a film crew.',
    ],
    steps: [
      { title: 'Shot list', desc: 'Every photo and video planned against where it will be used: feed, Reels, ads or your website.' },
      { title: 'Shoot', desc: 'At your store, venue or outdoors, with the product shown in use rather than on a white background.' },
      { title: 'Edit', desc: 'Photos retouched, videos cut into Reels, teasers and ad versions.' },
      { title: 'Deliver', desc: 'Final files plus the raw library, organised so your team can find things later.' },
    ],
    faqs: [
      {
        q: 'Where do you shoot?',
        a: 'Across Delhi, Noida, Gurugram, Ghaziabad and Faridabad, at your store, your venue or outdoors. For somewhere further away, ask on the call.',
      },
      {
        q: 'Do we get photos and videos from the same shoot?',
        a: 'Yes. We plan the day so one shoot gives you product photos, Reels and short teasers, which saves booking separate shoots for each.',
      },
      {
        q: 'How fast do event edits come back?',
        a: 'Event coverage is edited the same week, including short teaser cuts you can post while people are still talking about the event.',
      },
    ],
    caseIds: ['prago', 'saini-telecom'],
    related: ['reels-production', 'instagram-marketing', 'meta-ads'],
  },
  {
    slug: 'social-media-strategy',
    name: 'Strategy, audits & reporting',
    metaTitle: 'Social Media Strategy, Audit & Reporting',
    metaDescription:
      'Social media audits, 90-day strategy and monthly reports from your own Instagram, YouTube, Meta and Google analytics. Delhi NCR agency. Free strategy call.',
    h1: 'Social media strategy, audits and reporting',
    lede:
      'It starts with an audit of your account and your category, then sets content pillars, posting rhythm and the formats worth testing. That becomes a 90-day roadmap with weekly check-ins and a monthly report built from your own platform analytics, so you can check every number we quote.',
    outcome:
      'You get a plan that changes when the data does, and numbers you can check against your own dashboard.',
    deliverables: [
      'Account, competitor and category audit',
      'Content pillars and a format testing plan',
      '90-day roadmap with set review points',
      'Weekly performance review call',
      'Monthly written report from native platform analytics',
      'Reach, watch time, follower and cost-per-result tracking',
      'What changes next month, and why',
    ],
    fit: [
      'Brands with an in-house team that needs direction more than hands',
      'Owners who post regularly but can’t say what is working',
      'Anyone about to hire an agency who wants an honest baseline first',
    ],
    notFit: [
      'You want a 50-page deck. Ours fit on a few pages your team will actually use.',
    ],
    steps: [
      { title: 'Audit', desc: 'Profile, content, formats, competitors and your analytics, read together.' },
      { title: 'Roadmap', desc: 'Pillars, rhythm and tests for 90 days, tied to a business number such as enquiries or sales.' },
      { title: 'Weekly check-in', desc: 'A short call on what moved, what didn’t and what we are changing.' },
      { title: 'Monthly report', desc: 'Written from your own dashboards, with the next month’s changes explained.' },
    ],
    faqs: [
      {
        q: 'What does a social media audit cover?',
        a: 'Your profile and bio, what you post and how often, which formats reach non-followers, how the leading accounts in your category post, and what your analytics say about reach, watch time and followers. You get a short written plan, not just a score.',
      },
      {
        q: 'What reporting do you provide, and how often?',
        a: 'A weekly numbers review and a monthly deep-dive, both built from your own account analytics rather than screenshots we chose. Reports cover reach, views, watch time, follower and subscriber movement, engagement and, where ads run, spend against cost per result.',
      },
      {
        q: 'Which numbers actually matter?',
        a: 'The ones tied to the business: enquiries, sales, bookings. On the platform side, reach to non-followers, watch time and shares tell you whether content is travelling. Follower count on its own tells you very little.',
      },
    ],
    caseIds: ['acdelhivlogs', 'subh', 'journey'],
    related: ['instagram-marketing', 'meta-ads', 'google-ads'],
  },
];

export function getService(slug: string): Service | undefined {
  return SERVICES.find((s) => s.slug === slug);
}

// ── Client results ──────────────────────────────────────────────────

export interface Metric {
  value: string;
  label: string;
}

export interface PortfolioItem {
  id: string;
  /** Display name. */
  client: string;
  /** Instagram username without the @. */
  handle: string;
  /** Profile photo from the client’s own Instagram, saved in /public/clients. */
  avatar: string;
  profiles: { label: 'Instagram' | 'YouTube'; url: string }[];
  category: string;
  platform: 'Instagram' | 'Instagram + YouTube' | 'YouTube';
  kind: 'Creator' | 'Business';
  goal: ResultGoal;
  status: 'Active' | 'Past';
  description: string;
  detail: string;
  /** Headline figures, current at `asOf` (or at hand-over for past clients). */
  metrics: Metric[];
  /** Before → after, from our own earlier published snapshot or hand-over records. */
  growth: Growth[];
  services: string[];
}

export type ResultGoal = 'sales' | 'awareness' | 'creator';

export const GOAL_LABEL: Record<ResultGoal, string> = {
  sales: 'Sales growth',
  awareness: 'Brand awareness',
  creator: 'Creator growth',
};

export interface Growth {
  label: string;
  from: number;
  to: number;
  fromText: string;
  toText: string;
  period: string;
}

/** "2.5×" when the result at least doubled, otherwise "+62%". Always rounded down. */
export function growthChange(g: Growth): string {
  const r = g.to / g.from;
  if (r >= 2) return `${Math.floor(r * 10) / 10}×`;
  return `+${Math.floor((r - 1) * 100)}%`;
}

/** Date the current figures were recorded (client dashboards + public counts). */
export const RESULTS_AS_OF = '2026-09-30';
/** Date our earlier snapshot was first published on this site. */
const JUL = 'Jul → Sep 2026';

/**
 * Client results, published with permission. Current figures: each client's
 * Instagram professional dashboard or YouTube Studio, recorded 30 Sep 2026;
 * follower and subscriber counts cross-checked against the public profiles
 * the same day. "Before" figures: the snapshot this site first published on
 * 1 Jul 2026, or the follower count when we took the account over.
 * To add a client, append an entry: /case-studies, the homepage, service
 * pages, schema and /llms.txt all follow.
 */
export const PORTFOLIO: PortfolioItem[] = [
  {
    id: 'saini-telecom',
    client: 'Saini Telecom',
    handle: 'saini_telecom__',
    avatar: '/clients/saini-telecom.webp',
    profiles: [{ label: 'Instagram', url: 'https://www.instagram.com/saini_telecom__/' }],
    category: 'Mobile phone and electronics store, Delhi',
    platform: 'Instagram',
    kind: 'Business',
    goal: 'sales',
    status: 'Active',
    description:
      'Delhi mobile, electronics and LED TV store. From 400 to 12K Instagram followers since June 2026.',
    detail:
      'A local store, so the job is enquiries and footfall. We took the account over at 400 followers at the start of June 2026. We run the page, shoot the phones and electronics in the store, and edit them into Reels. Four months later it has 12K followers and passed 4M views in the last 30 days.',
    metrics: [
      { value: '4M+', label: 'Views in the last 30 days' },
      { value: '12K', label: 'Instagram followers' },
    ],
    growth: [{ label: 'Followers', from: 400, to: 12_000, fromText: '400', toText: '12K', period: 'Jun → Sep 2026' }],
    services: ['instagram-marketing', 'reels-production', 'product-shoots'],
  },
  {
    id: 'big-discount-mart',
    client: 'Big Discount Mart',
    handle: 'bigdiscountmartofficial',
    avatar: '/clients/big-discount-mart.webp',
    profiles: [{ label: 'Instagram', url: 'https://www.instagram.com/bigdiscountmartofficial/' }],
    category: 'Discount and gift store, Nangloi, Delhi',
    platform: 'Instagram',
    kind: 'Business',
    goal: 'sales',
    status: 'Past',
    description:
      'Discount store for gifts and everyday brands in Nangloi, Delhi. Taken from 800 to 10.8K followers in two months.',
    detail:
      'We picked the account up at 800 followers and handed it back at 10.8K two months later. We ran the page and shot and edited Reels of the store and its deals, so local followers knew what was on offer before they visited.',
    metrics: [
      { value: '10.8K+', label: 'Followers at hand-over' },
    ],
    growth: [{ label: 'Followers', from: 800, to: 10_800, fromText: '800', toText: '10.8K', period: 'In 2 months' }],
    services: ['instagram-marketing', 'reels-production'],
  },
  {
    id: 'prago',
    client: 'PraGo Outdoors',
    handle: 'prago.outdoors',
    avatar: '/clients/prago.webp',
    profiles: [{ label: 'Instagram', url: 'https://www.instagram.com/prago.outdoors/' }],
    category: 'Camping, trekking and riding gear store',
    platform: 'Instagram',
    kind: 'Business',
    goal: 'sales',
    status: 'Active',
    description:
      'Camping, trekking, hiking and riding gear. Instagram built to sell products, not to collect likes.',
    detail:
      'The brief is sales, so gear is shot in use rather than on white backgrounds, and the page is built to send people to the store rather than to collect followers. Product shoots and Reels come from the same shoot days. Since July the account has gone from 14K to 35.3K followers and from 3.1M to over 6M views a month.',
    metrics: [
      { value: '6M+', label: 'Views in the last 30 days' },
      { value: '35.3K', label: 'Instagram followers' },
    ],
    growth: [
      { label: 'Followers', from: 14_000, to: 35_300, fromText: '14K', toText: '35.3K', period: JUL },
      { label: 'Views in 30 days', from: 3_100_000, to: 6_000_000, fromText: '3.1M', toText: '6M+', period: JUL },
    ],
    services: ['instagram-marketing', 'reels-production', 'product-shoots'],
  },
  {
    id: 'acdelhivlogs',
    client: 'AC Delhi Vlogs',
    handle: 'acdelhivlogs',
    avatar: '/clients/acdelhivlogs.webp',
    profiles: [
      { label: 'Instagram', url: 'https://www.instagram.com/acdelhivlogs/' },
      { label: 'YouTube', url: 'https://www.youtube.com/@acdelhivlogs' },
    ],
    category: 'Events, places and travel in Delhi NCR',
    platform: 'Instagram + YouTube',
    kind: 'Creator',
    goal: 'creator',
    status: 'Active',
    description:
      'Creator covering events, places, travel and adventure across Delhi NCR. The largest account we work on.',
    detail:
      'Content strategy, shooting and editing for Instagram and YouTube at once. Reels bring the reach and the channel holds the watch time, so each shoot is planned for both. Since July the account has added 22K Instagram followers and crossed 100K YouTube subscribers.',
    metrics: [
      { value: '358K', label: 'Instagram followers' },
      { value: '101K', label: 'YouTube subscribers' },
    ],
    growth: [
      { label: 'Instagram followers', from: 336_000, to: 358_000, fromText: '336K', toText: '358K', period: JUL },
      { label: 'YouTube subscribers', from: 96_600, to: 101_000, fromText: '96.6K', toText: '101K', period: JUL },
    ],
    services: ['social-media-strategy', 'reels-production', 'youtube-management'],
  },
  {
    id: 'subh',
    client: 'Subh Journey',
    handle: 'the_subh_journey',
    avatar: '/clients/subh.webp',
    profiles: [{ label: 'Instagram', url: 'https://www.instagram.com/the_subh_journey/' }],
    category: 'Travel, stories and events in Delhi NCR',
    platform: 'Instagram',
    kind: 'Creator',
    goal: 'creator',
    status: 'Active',
    description: 'Reel creator covering travel, stories, events and Delhi NCR.',
    detail:
      'Content strategy plus shooting and editing for Instagram Reels. The focus is Reels that travel beyond the existing audience, and it shows in the follower count: 15.9K in July, 25.7K now.',
    metrics: [{ value: '25.7K', label: 'Instagram followers' }],
    growth: [{ label: 'Instagram followers', from: 15_900, to: 25_700, fromText: '15.9K', toText: '25.7K', period: JUL }],
    services: ['social-media-strategy', 'reels-production', 'instagram-marketing'],
  },
  {
    id: 'journey',
    client: 'Journey Without Visa',
    handle: 'journey_without_visa',
    avatar: '/clients/journey.webp',
    profiles: [
      { label: 'Instagram', url: 'https://www.instagram.com/journey_without_visa/' },
      { label: 'YouTube', url: 'https://www.youtube.com/@journeywithoutvisa' },
    ],
    category: 'Travel, places, events and food',
    platform: 'Instagram + YouTube',
    kind: 'Creator',
    goal: 'creator',
    status: 'Active',
    description: 'Creator covering new places, events, travel, lifestyle and food on Instagram and YouTube.',
    detail:
      'Content strategy, shooting and editing, with the same footage cut as Reels for Instagram and as longer videos for YouTube. The channel is where the growth is: 22.1K subscribers in July, 26K now.',
    metrics: [
      { value: '26K', label: 'YouTube subscribers' },
      { value: '12K', label: 'Instagram followers' },
    ],
    growth: [
      { label: 'YouTube subscribers', from: 22_100, to: 26_000, fromText: '22.1K', toText: '26K', period: JUL },
      { label: 'Instagram followers', from: 10_600, to: 12_000, fromText: '10.6K', toText: '12K', period: JUL },
    ],
    services: ['social-media-strategy', 'reels-production', 'youtube-management'],
  },
  {
    id: 'wanna-party',
    client: 'Wanna Party',
    handle: 'wannaparty.in',
    avatar: '/clients/wanna-party.webp',
    profiles: [{ label: 'Instagram', url: 'https://www.instagram.com/wannaparty.in/' }],
    category: 'Party supplies brand, online since 2011',
    platform: 'Instagram',
    kind: 'Business',
    goal: 'awareness',
    status: 'Past',
    description: 'Online party-products brand. A brand-awareness brief: more people knowing the name.',
    detail:
      'The goal was awareness, not direct sales. We ran the page, shot and edited Reels around the products, and brought in creators to put the brand in front of their audiences.',
    metrics: [],
    growth: [],
    services: ['instagram-marketing', 'reels-production', 'influencer-marketing'],
  },
];

export const PORTFOLIO_NOTE =
  'From each client’s own Instagram or YouTube analytics, recorded 30 Sep 2026 and published with permission. Follower counts checked against the public profiles the same day.';

/**
 * Headline figures, each traceable to PORTFOLIO:
 *  - 10M+  = PraGo 6M+ + Saini Telecom 4M+ views in the last 30 days.
 *  - 570K+ = active accounts: 35.3 + 12 + 358 + 101 + 25.7 + 12 + 26 = 570.0K.
 *  - 30×   = Saini Telecom, 400 → 12,000 followers, Jun → Sep 2026.
 */
export const STATS: Metric[] = [
  { value: '10M+', label: 'Views in 30 days on two retail accounts we run' },
  { value: '570K+', label: 'Followers and subscribers on the accounts we manage' },
  { value: '30×', label: 'Follower growth for Saini Telecom since June' },
  { value: `${PORTFOLIO.length}`, label: 'Brands and creators with published results' },
];

export const RESULTS_FAQS: Faq[] = [
  {
    q: 'Can a social media agency really increase Instagram followers and sales?',
    a: 'Yes, but not on a promise. Saini Telecom went from 400 to 12K followers between June and September 2026, Big Discount Mart from 800 to 10.8K in two months, and PraGo Outdoors from 14K to 35.3K while passing 6M views a month. Results depend on your product, content and consistency, so we don’t guarantee numbers.',
  },
  {
    q: 'How long does it take to see results on Instagram?',
    a: 'The first month sets up the content and tests formats, and most accounts show measurable movement in reach by day 60. Big Discount Mart’s growth from 800 to 10.8K followers took two months.',
  },
  {
    q: 'Where do these numbers come from?',
    a: 'From each client’s own Instagram professional dashboard or YouTube Studio, recorded on 30 September 2026 and shared with permission. Follower and subscriber counts were checked against the public profiles the same day. The “before” figures are the ones this site published on 1 July 2026, or the follower count when we took an account over.',
  },
  {
    q: 'Do you work with influencers and content creators?',
    a: 'Yes. For AC Delhi Vlogs, Subh Journey and Journey Without Visa we handle content strategy, shooting and editing for Instagram and YouTube. AC Delhi Vlogs has 358K Instagram followers and 101K YouTube subscribers.',
  },
];

// ── Homepage sections ──────────────────────────────────────────────

export interface Pain {
  problem: string;
  answer: string;
  href: string;
  cta: string;
}

export const PAINS: Pain[] = [
  {
    problem: 'You post regularly, but reach never leaves your followers.',
    answer: 'Reels edited for watch time and shares, the signals Instagram says it weighs most.',
    href: '/services/reels-production',
    cta: 'Reels production',
  },
  {
    problem: 'Money goes into ads, but the enquiries don’t come back.',
    answer: 'Tracking fixed first, then creative tested weekly on Meta and Google until cost per lead falls.',
    href: '/services/meta-ads',
    cta: 'Meta ads',
  },
  {
    problem: 'Nobody on the team has time to shoot, post and reply.',
    answer: 'We run the page day to day. You approve the plan once a month.',
    href: '/services/instagram-marketing',
    cta: 'Page management',
  },
];

export const PROCESS: Step[] = [
  {
    title: 'Audit',
    desc: 'We study your current presence, your audience and what already works in your category, before writing a single post.',
  },
  {
    title: 'Plan',
    desc: 'A 90-day roadmap: content pillars, posting rhythm, visual style and the ads plan, tied to your business goal.',
  },
  {
    title: 'Launch',
    desc: 'Content goes live, campaigns start and replies begin from day one. You see everything before it posts.',
  },
  {
    title: 'Measure and scale',
    desc: 'Weekly reviews and a monthly deep-dive. What works gets more budget and more versions. What doesn’t gets cut.',
  },
];

export interface Principle {
  title: string;
  desc: string;
}

export const PRINCIPLES: Principle[] = [
  {
    title: 'You own everything',
    desc: 'Accounts, ad accounts, logins and every piece of content stay in your name. If we part ways, all of it stays with you.',
  },
  {
    title: 'Numbers you can check',
    desc: 'Reports come from your own Instagram, YouTube, Meta and Google dashboards, not screenshots we picked.',
  },
  {
    title: 'A small book of accounts',
    desc: 'We take on a deliberately small number of clients, so yours is never one of fifty.',
  },
  {
    title: 'You talk to the founders',
    desc: 'No account manager passing messages along. The two people who do the work answer the phone.',
  },
];

// ── FAQs ───────────────────────────────────────────────────────────

export const FAQS: Faq[] = [
  {
    q: 'What does Social ScaleX do for a brand?',
    a: 'We run your social media end to end: strategy, shooting and editing Reels and Shorts, posting, replies, paid campaigns on Meta and Google, and a monthly report from your own analytics. You approve the direction; we handle the daily work.',
  },
  {
    q: 'Which platforms do you manage?',
    a: 'Instagram, Facebook and YouTube for content and page management, plus paid campaigns on Meta and Google Ads. We deliberately don’t spread across ten platforms. One Instagram account we work on has 358K followers, and one YouTube channel has 101K subscribers.',
  },
  {
    q: 'How long until we see real growth?',
    a: 'The first 30 days are setup and testing: audit, content pillars and finding what your audience responds to. Most accounts show measurable movement in reach and engagement by day 60, with compounding growth from day 90. Anyone promising viral results in week one is guessing with your money.',
  },
  {
    q: 'Do you work with small businesses or only creators?',
    a: 'Both. Our published work includes travel creators and an outdoor-gear store whose Instagram now drives product sales. If your customers are on Instagram, Facebook or YouTube, the same approach applies.',
  },
  {
    q: 'Who owns the accounts and the content?',
    a: 'You do, always. Accounts stay in your name, logins stay with you, and every Reel, post and ad we make belongs to your brand. If we stop working together, everything stays with you, including the strategy documents.',
  },
  {
    q: 'Where are you based, and do you work remotely?',
    a: 'We are a social media marketing agency based in Delhi NCR, and most shoots happen across Delhi, Noida and Gurugram. Page management, ads and reporting run remotely, so we work with brands from anywhere in India.',
  },
  {
    q: 'How much does social media marketing cost?',
    a: 'It depends on the scope: how many platforms, how much original shooting, and whether ads run alongside organic content. We price it on the free strategy call instead of publishing a rate card, because a creator who needs Reels and a store that needs shoots plus ads are different jobs. Ad budgets are always separate and paid by you directly. The one fixed price is Instagram comment-to-DM automation at ₹99 a month.',
  },
  {
    q: 'What makes Social ScaleX different from other agencies?',
    a: 'We publish real client numbers with permission instead of general claims, we run a small number of accounts, and you keep ownership of every account and asset. Reports come from your own platform analytics, so you can verify anything we tell you.',
  },
];

export const CONTACT_FAQS: Faq[] = [
  {
    q: 'What happens on the free strategy call?',
    a: 'A short conversation about your business, your current accounts and what you want from them. We tell you what we would change first and whether we are the right fit. No pitch deck.',
  },
  {
    q: 'How quickly will you get back to me?',
    a: 'We usually call back within a few hours during business hours. For something urgent, call or WhatsApp us directly.',
  },
  {
    q: 'Do I need to prepare anything?',
    a: 'Nothing formal. Your Instagram handle or website lets us look before the call. If you run ads, a rough idea of your current monthly spend helps.',
  },
];

// ── Contact ────────────────────────────────────────────────────────

export const CONTACT_OFFER = {
  heading: 'Book a free strategy call',
  intro:
    'Your first strategy call is free. No pitch decks, no pressure: an honest conversation about what growth looks like for your brand.',
  callbackNote: 'We usually call back within a few hours, during business hours.',
} as const;

export const NEXT_STEPS: Step[] = [
  { title: 'You send your details', desc: 'Name, number and what you need. Thirty seconds.' },
  { title: 'We look at your accounts', desc: 'Share your handle or website and we look at it before we call.' },
  { title: 'We call you back', desc: 'Usually within a few hours, during business hours.' },
];

const PROPER = /^(Instagram|Meta|Google|YouTube|Reels|Facebook|WhatsApp)\b|^[A-Z]{2}/;

/** A service name as it reads mid-sentence: “influencer marketing”, but “Google Ads”. */
export function inSentence(name: string): string {
  return PROPER.test(name) ? name : name.charAt(0).toLowerCase() + name.slice(1);
}
