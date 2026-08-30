// ─────────────────────────────────────────────────────────────────────
// Marketing content, typed and centralised.
//
// Every page, every JSON-LD block and public/llms.txt read from here. That
// is the point: Google and the answer engines penalise schema that claims
// something the visible page does not say, and the only reliable way to keep
// them identical is to render both from one object.
//
// METRICS POLICY: figures in this file come from client account dashboards
// recorded in-repo. Nothing here may be estimated, rounded up or invented.
// See the verification note on PORTFOLIO below.
// ─────────────────────────────────────────────────────────────────────

export interface Service {
  /** URL slug and anchor id on /services. */
  slug: string;
  /** Numbering shown in the homepage grid. */
  id: string;
  title: string;
  /** One-line summary of what the service IS. */
  desc: string;
  /**
   * What the client GETS — the homepage cards lead with this.
   *
   * Services sell as outcomes, not feature lists, so this states the change
   * in the client's situation. Deliberately carries no numbers and no
   * guarantees: an outcome line is a description of the work, not a
   * performance claim, and the moment it quotes a figure it becomes one.
   */
  outcome: string;
  /** Question-form H2 on /services, phrased the way people ask an assistant. */
  question: string;
  /** 40–60 word self-contained answer placed directly under the H2. This is
   *  the block answer engines quote, so it must stand alone without context. */
  answer: string;
  /** Concrete deliverables — extractable as a list, not prose. */
  deliverables: string[];
}

export const SERVICES: Service[] = [
  {
    slug: 'instagram-page-management',
    id: '01',
    title: 'Instagram Page Management',
    desc: 'Feed, Reels, Stories and Collabs — a full-stack presence engineered for the Explore algorithm.',
    outcome:
      'Your page runs without you. Posts go out on schedule, comments get answered, and you approve the direction once a month.',
    question: 'What does Instagram page management include?',
    answer:
      'Instagram page management means we run the account day to day: planning the feed, producing and posting Reels and Stories, writing captions, replying to comments and DMs, and setting up Collabs. You approve the direction each month. We handle posting cadence, hashtags and the reporting behind it.',
    deliverables: [
      'Monthly content calendar with defined content pillars',
      'Reels, carousels and Stories produced and scheduled',
      'Caption and hashtag writing for every post',
      'Comment and DM community management',
      'Collab posts and creator partnerships',
      'Monthly report pulled from your own Instagram Insights',
    ],
  },
  {
    slug: 'content-creation',
    id: '02',
    title: 'Content Creation',
    desc: 'Reels, posts, explainer videos and Shorts — scroll-stopping creative produced and edited in-house.',
    outcome:
      'You stop filming on your phone between meetings. Finished Reels and posts arrive ready to publish.',
    question: 'Do you produce the content, or do we have to send it?',
    answer:
      'We produce it. Shooting, editing, motion graphics, sound design and copy all happen in-house, so you are not sourcing freelancers or filming on your phone between meetings. Send us product access or a shoot date and the finished Reels, Shorts and posts come back ready to publish.',
    deliverables: [
      'Reels and YouTube Shorts, shot and edited end to end',
      'Static posts and carousels designed to brand',
      'Explainer and talking-head video editing',
      'Motion graphics, captions and sound design',
      'Raw footage and project files handed over on request',
    ],
  },
  {
    slug: 'paid-ads-management',
    id: '03',
    title: 'Paid Ads Management',
    desc: 'Campaign architecture, targeting and creative testing across Meta and YouTube — built to convert.',
    outcome:
      'Your ad spend stops guessing. We test creative against creative until the cost per result stops falling.',
    question: 'How do you run paid ads on Meta and YouTube?',
    answer:
      'We build the campaign structure, write and produce the creative, set the targeting, then test variants against each other until the cost per result stops falling. Budgets stay in your own ad account under your billing. You see every campaign, every spend line and every result directly.',
    deliverables: [
      'Campaign, ad set and audience architecture',
      'Ad creative produced specifically for paid placement',
      'A/B creative and audience testing cycles',
      'Meta Pixel and conversion event setup',
      'Retargeting and lookalike audience build-out',
      'Weekly spend and cost-per-result reporting',
    ],
  },
  {
    slug: 'profile-optimization',
    id: '04',
    title: 'Profile Optimization',
    desc: 'Bio, link-in-bio, highlights and channel layout tuned so visitors convert into followers.',
    outcome:
      'Someone landing on your page works out what you sell in a few seconds, then follows.',
    question: 'What is social media profile optimization?',
    answer:
      'Profile optimization fixes the moment someone lands on your page and decides whether to follow. We rewrite the bio, restructure the link-in-bio, rebuild Story highlights and lay out the YouTube channel so a first-time visitor understands what you offer within a few seconds.',
    deliverables: [
      'Bio and name-field rewrite for search within the platform',
      'Link-in-bio structure and destination priority',
      'Story highlight covers, order and content',
      'Pinned post and featured content selection',
      'YouTube channel banner, sections and playlist layout',
    ],
  },
  {
    slug: 'analytics-and-reporting',
    id: '05',
    title: 'Analytics & Reporting',
    desc: 'Real dashboards from real accounts — views, watch time and subscriber velocity, reviewed weekly.',
    outcome:
      'You can check every number we report against your own dashboard. Nothing is taken on trust.',
    question: 'What reporting do you provide, and how often?',
    answer:
      'You get a weekly numbers review and a monthly deep-dive, both built from your own account analytics rather than screenshots we chose. Reports cover reach, views, watch time, follower and subscriber movement, engagement rate, and — where ads run — spend against cost per result.',
    deliverables: [
      'Weekly performance review call',
      'Monthly written report from native platform analytics',
      'Reach, views, watch time and retention tracking',
      'Follower and subscriber velocity over time',
      'Ad spend against cost per result, when campaigns are live',
      'What we are changing next month, and why',
    ],
  },
  {
    slug: 'product-and-event-shoots',
    id: '06',
    title: 'Product & Event Shoots',
    desc: 'Product photoshoots, event coverage, teasers and on-location shoots — content captured, not stocked.',
    outcome:
      'Your product appears in real footage of itself, not stock imagery your competitors also bought.',
    question: 'Do you shoot product photos and cover events on location?',
    answer:
      'We shoot on location across Delhi, Noida and Gurugram: product photography, event coverage, teasers and on-location video. You get original footage of your actual product or venue rather than stock imagery that every competitor in your category is also using, and the full raw asset library comes to you.',
    deliverables: [
      'Product photography, styled and retouched',
      'On-location and in-studio video shoots',
      'Event coverage with same-week edit turnaround',
      'Teaser and announcement cutdowns',
      'Full raw asset library delivered to you',
    ],
  },
  {
    slug: 'influencer-marketing',
    id: '07',
    title: 'Influencer Marketing & Media Planning',
    desc: 'Collab sourcing, outreach and media planning that reaches audiences who already trust someone.',
    outcome:
      'You reach people who already trust someone, at a rate we can tell you is fair.',
    question: 'How does influencer marketing work with an agency?',
    answer:
      'We shortlist creators whose audience overlaps yours, check their real engagement rather than follower count, handle outreach and rates, then brief and schedule the collaboration. Because we manage creator accounts ourselves, we know what a fair rate looks like and where the padded numbers hide.',
    deliverables: [
      'Creator shortlisting against your audience profile',
      'Engagement and audience-quality checks before outreach',
      'Outreach, negotiation and rate benchmarking',
      'Creative briefs and deliverable schedules',
      'Campaign media plan across platforms',
      'Post-campaign performance reporting',
    ],
  },
  {
    slug: 'digital-strategy',
    id: '08',
    title: 'Digital Strategy & Organic Growth',
    desc: 'Content strategy and organic growth planning that compounds — the system behind every number here.',
    outcome:
      'You get a plan that changes when the data does, not a document nobody opens again.',
    question: 'What does a social media growth strategy actually look like?',
    answer:
      'It starts with an audit of your account and your category, then defines content pillars, posting cadence and the formats worth testing. From there it becomes a 90-day roadmap with weekly review points. The plan changes as data arrives — a strategy nobody revises is just a document.',
    deliverables: [
      'Account, competitor and category audit',
      'Content pillars and format testing plan',
      '90-day roadmap with defined review points',
      'Posting cadence and platform priority',
      'Growth targets tied to business outcomes, not vanity metrics',
    ],
  },
];

export interface Metric {
  value: string;
  label: string;
}

export interface PortfolioItem {
  id: string;
  category: string;
  platform: 'Instagram' | 'Instagram + YouTube' | 'YouTube';
  client: string;
  description: string;
  metrics: Metric[];
  /** Longer write-up for /case-studies. States only what the metrics support. */
  detail: string;
}

/**
 * TODO(verify-metrics): these are point-in-time figures recorded in-repo
 * pre-2026-08-05; currency unconfirmed. Re-pull from the client dashboards
 * before treating them as current. Client data shared with permission.
 */
export const PORTFOLIO: PortfolioItem[] = [
  {
    id: 'acdelhivlogs',
    category: 'Travel & Lifestyle Vlogging',
    platform: 'Instagram + YouTube',
    client: 'acdelhivlogs',
    description:
      'Digital creator covering events, places, and travel & adventure across Delhi NCR — full Instagram + YouTube management.',
    detail:
      'The largest account we manage, run across both Instagram and YouTube at once. Work covers the full cycle: shooting on location around Delhi NCR, editing for both vertical Reels and long-form YouTube, scheduling, and community management. The two platforms feed each other — Reels carry reach, the channel carries watch time.',
    metrics: [
      { value: '336K', label: 'IG Followers' },
      { value: '4.2M', label: 'Views/30 days' },
      { value: '96.6K', label: 'YT Subscribers' },
    ],
  },
  {
    id: 'journey',
    category: 'Travel Content',
    platform: 'Instagram + YouTube',
    client: 'Journey Without Visa',
    description:
      'Reel creator covering new places, events, travel, lifestyle, and food — grew from a standing start into a real audience.',
    detail:
      'A build from a standing start rather than an account that was already working. Reels across travel, food and events on Instagram, with the same footage cut for YouTube. The subscriber figure below is a 28-day movement, not a lifetime total — it shows the account is still adding audience, which is the number that matters on a young channel.',
    metrics: [
      { value: '10.6K', label: 'IG Followers' },
      { value: '22.1K', label: 'YT Subscribers' },
      { value: '+514', label: 'Subs/28 days' },
    ],
  },
  {
    id: 'subh',
    category: 'Travel & Stories',
    platform: 'Instagram',
    client: 'the_subh_journey',
    description:
      'A journey of a thousand miles begins with a single step — Reel creator across travel, stories, events, and Delhi NCR.',
    detail:
      'Instagram-only, and the clearest example of reach outrunning follower count. 1.6M views in 30 days against a 15.9K following means the content is travelling well beyond the existing audience through Reels distribution. Interactions are tracked alongside views because reach without engagement does not compound.',
    metrics: [
      { value: '15.9K', label: 'IG Followers' },
      { value: '1.6M', label: 'Views/30 days' },
      { value: '109.6K', label: 'Interactions' },
    ],
  },
  {
    id: 'prago',
    category: 'E-commerce, Outdoor Gear',
    platform: 'Instagram',
    client: 'prago.outdoors',
    description:
      'Camping, trekking, hiking & riding gear wholesale store — Instagram presence built to drive direct product sales.',
    detail:
      'A business account rather than a creator account, and the brief is different: Instagram exists to move product. Camping, trekking, hiking and riding gear shot in use rather than on white backgrounds. 3.1M views in 30 days against a 14K following, with the page built to send people to the store rather than to collect followers.',
    metrics: [
      { value: '14K', label: 'Followers' },
      { value: '3.1M', label: 'Views/30 days' },
    ],
  },
];

export interface Faq {
  q: string;
  a: string;
}

export const FAQS: Faq[] = [
  {
    q: 'What does Social ScaleX actually do for a brand?',
    a: 'We run your social media end to end. That covers content strategy, shooting and editing Reels and Shorts, posting schedules, community management, paid campaigns on Meta and YouTube, and a monthly report built from your own account analytics — not vanity screenshots. You approve the direction; we handle the daily grind.',
  },
  {
    q: 'Which platforms do you manage?',
    a: "Instagram, Facebook, and YouTube. We deliberately don't spread across ten platforms — these three are where our systems, our ad experience, and our results live. One managed Instagram account currently sits at 336K followers, and one managed YouTube channel at 96.6K subscribers.",
  },
  {
    q: 'How long until we see real growth?',
    a: 'Honest answer: the first 30 days are setup and testing — audit, content pillars, and finding what your audience responds to. Most accounts see measurable movement in reach and engagement by day 60, and compounding growth from day 90 onward. Anyone promising viral results in week one is guessing with your money.',
  },
  {
    q: 'Do you work with small businesses or only creators?',
    a: 'Both. Our portfolio includes travel creators, lifestyle vloggers, and e-commerce brands like an outdoor-gear store whose Instagram now drives direct product sales. If your customers are on Instagram, Facebook, or YouTube, the same growth systems apply.',
  },
  {
    q: 'Who owns the accounts and the content?',
    a: 'You do — always. Accounts stay in your name, passwords stay with you, and every Reel, post, and ad creative we produce belongs to your brand. If we ever part ways, everything stays with you, including the strategy documents.',
  },
  {
    q: 'Where are you based, and do you work remotely?',
    a: "We're a social media marketing agency based in Delhi NCR, and most of our shoots happen across Delhi, Noida, and Gurugram. Management, ads, and reporting work happens remotely, so we take on brands from anywhere in India.",
  },
  {
    q: 'How much does social media marketing cost in India?',
    a: 'It depends on scope — how many platforms, how much original shooting, and whether paid campaigns run alongside organic. We scope and price on the free strategy call rather than publishing a rate card, because a creator needing Reels and a store needing shoots plus ads are not the same engagement. Ad budget is always separate and paid directly by you.',
  },
  {
    q: 'What makes Social ScaleX different from other agencies?',
    a: 'We publish real client account numbers with permission instead of generic claims, we manage a small number of accounts rather than dozens, and you keep ownership of every account and asset. Reporting comes from your own platform analytics, so you can verify anything we tell you.',
  },
];

export interface ProcessStep {
  num: string;
  title: string;
  desc: string;
  tags: string[];
}

export const PROCESS: ProcessStep[] = [
  {
    num: '01',
    title: 'Brand & Audience Audit',
    desc: "We dissect your current presence, map your audience, and reverse-engineer what's working in your category — before writing a single post.",
    tags: ['Competitor analysis', 'Audience mapping', 'Platform audit'],
  },
  {
    num: '02',
    title: 'Strategy & Content Architecture',
    desc: 'Custom 90-day roadmap: content pillars, posting cadence, visual system, and platform-specific playbooks — built around your business goals.',
    tags: ['Content pillars', 'Visual identity', '90-day roadmap'],
  },
  {
    num: '03',
    title: 'Launch & Amplify',
    desc: 'Execution day one: content goes live, ad campaigns launch, and engagement loops activate. We build momentum fast, deliberately.',
    tags: ['Content execution', 'Paid amplification', 'Community activation'],
  },
  {
    num: '04',
    title: 'Measure, Iterate & Scale',
    desc: "Weekly data reviews, monthly deep-dives, and constant refinement. What compounds gets doubled down on. What doesn't gets cut.",
    tags: ['Weekly reporting', 'A/B optimization', 'Scaling playbook'],
  },
];

/**
 * TODO(verify-metrics): point-in-time figures recorded in-repo pre-2026-08-05.
 * 496K reconciles to IG followers (~376K) + YT subscribers (~119K).
 */
export const STATS: Metric[] = [
  { value: '4+', label: 'Brands actively managed' },
  { value: '9.3M+', label: 'Combined monthly views' },
  { value: '496K+', label: 'Combined followers & subscribers' },
  // TODO(verify-metrics): CONTRADICTION — this claims 14 services while
  // SERVICES above defines 8, and both render on the same page. An answer
  // engine reading the site sees two different counts for the same fact.
  // Either add the missing 6 to SERVICES or correct this to 8; do not
  // resolve it by guessing which number is right.
  { value: '14', label: 'Services offered, end to end' },
];
