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
    caseIds: ['acdelhivlogs', 'subh', 'prago'],
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
    caseIds: ['acdelhivlogs', 'journey', 'subh'],
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
      'YouTube channel management for brands and creators: titles, thumbnails, Shorts, playlists and monthly Studio reviews. One channel we run has 96.6K subscribers.',
    h1: 'YouTube channel management for brands and creators',
    lede:
      'We run the channel around your videos: titles, descriptions and thumbnails, Shorts cut from long-form, playlists and channel layout, the upload schedule, and a monthly review of watch time and subscribers from YouTube Studio. One channel we manage today has 96.6K subscribers.',
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
    caseIds: [],
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
    caseIds: ['prago'],
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
    caseIds: ['acdelhivlogs', 'journey', 'subh', 'prago'],
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
  client: string;
  category: string;
  platform: 'Instagram' | 'Instagram + YouTube' | 'YouTube';
  kind: 'Creator' | 'Business';
  description: string;
  detail: string;
  metrics: Metric[];
  services: string[];
}

/**
 * Point-in-time snapshots from each client's own Instagram or YouTube
 * dashboard, published with permission. TODO(verify-metrics): re-pull before
 * relying on them as current. To add a client, append an entry: the homepage,
 * /case-studies, the service pages, the schema and /llms.txt all follow.
 */
export const PORTFOLIO: PortfolioItem[] = [
  {
    id: 'acdelhivlogs',
    client: 'acdelhivlogs',
    category: 'Travel & lifestyle vlogging',
    platform: 'Instagram + YouTube',
    kind: 'Creator',
    description:
      'Digital creator covering events, places, travel and adventure across Delhi NCR. Full Instagram and YouTube management.',
    detail:
      'The largest account we manage, run on Instagram and YouTube at once. The work covers the full cycle: shooting on location around Delhi NCR, editing for vertical Reels and long-form YouTube, scheduling and community management. The two platforms feed each other: Reels bring the reach, the channel holds the watch time.',
    metrics: [
      { value: '336K', label: 'Instagram followers' },
      { value: '4.2M', label: 'Views in 30 days' },
      { value: '96.6K', label: 'YouTube subscribers' },
    ],
    services: ['instagram-marketing', 'reels-production', 'youtube-management'],
  },
  {
    id: 'journey',
    client: 'Journey Without Visa',
    category: 'Travel content',
    platform: 'Instagram + YouTube',
    kind: 'Creator',
    description:
      'Reel creator covering new places, events, travel, lifestyle and food, built from a standing start into a real audience.',
    detail:
      'Built from a standing start rather than an account that was already working. Reels on travel, food and events for Instagram, with the same footage cut for YouTube. The subscriber figure is a 28-day movement, not a lifetime total: it shows the channel is still adding audience, which is the number that matters on a young channel.',
    metrics: [
      { value: '10.6K', label: 'Instagram followers' },
      { value: '22.1K', label: 'YouTube subscribers' },
      { value: '+514', label: 'Subscribers in 28 days' },
    ],
    services: ['reels-production', 'youtube-management', 'instagram-marketing'],
  },
  {
    id: 'subh',
    client: 'the_subh_journey',
    category: 'Travel & stories',
    platform: 'Instagram',
    kind: 'Creator',
    description:
      'Reel creator covering travel, stories, events and Delhi NCR.',
    detail:
      'Instagram only, and our clearest example of reach outrunning follower count. 1.6M views in 30 days against a following of 15.9K means Reels are travelling well beyond the existing audience. Interactions are tracked alongside views, because reach without engagement does not compound.',
    metrics: [
      { value: '15.9K', label: 'Instagram followers' },
      { value: '1.6M', label: 'Views in 30 days' },
      { value: '109.6K', label: 'Interactions' },
    ],
    services: ['instagram-marketing', 'reels-production'],
  },
  {
    id: 'prago',
    client: 'prago.outdoors',
    category: 'E-commerce, outdoor gear',
    platform: 'Instagram',
    kind: 'Business',
    description:
      'Camping, trekking, hiking and riding gear store. An Instagram presence built to sell products directly.',
    detail:
      'A business account, so the brief is different: Instagram exists to move product. Camping, trekking, hiking and riding gear is shot in use rather than on white backgrounds. 3.1M views in 30 days against a following of 14K, with the page built to send people to the store rather than to collect followers.',
    metrics: [
      { value: '14K', label: 'Followers' },
      { value: '3.1M', label: 'Views in 30 days' },
    ],
    services: ['instagram-marketing', 'reels-production', 'product-shoots'],
  },
];

export const PORTFOLIO_NOTE =
  'Snapshots from each client’s own Instagram or YouTube analytics, recorded in 2026 and shared with permission.';

/**
 * Headline figures. TODO(verify-metrics): 9.3M = the four 30-day view
 * figures summed (4.2 + 1.6 + 3.1 + 0.4016 IG views for Journey Without
 * Visa) = 9.30M; followers = IG 376.5K + YT 118.7K = 495.2K, floored to 495K+.
 */
export const STATS: Metric[] = [
  { value: '9.3M+', label: 'Views a month across the accounts we manage' },
  { value: '495K+', label: 'Followers and subscribers on those accounts' },
  { value: `${PORTFOLIO.length}`, label: 'Brands and creators we publish results for' },
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
    a: 'Instagram, Facebook and YouTube for content and page management, plus paid campaigns on Meta and Google Ads. We deliberately don’t spread across ten platforms. One Instagram account we manage has 336K followers, and one YouTube channel has 96.6K subscribers.',
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
