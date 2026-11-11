// ─────────────────────────────────────────────────────────────────────
// Guides: long-form answers to what our buyers search before hiring.
//
// Every platform fact below is taken from the source listed in the guide's
// `sources`, checked on the guide's `updated` date. Inline markup is deliberately
// tiny: **bold** and [text](url). See src/components/site/Rich.tsx.
// ─────────────────────────────────────────────────────────────────────

import type { Faq } from './content';
import type { GuideImg } from '@/components/site/GuideImage';

export type Block =
  | { t: 'h2'; text: string }
  | { t: 'p'; text: string }
  | { t: 'ul'; items: string[] }
  | { t: 'ol'; items: string[] }
  | { t: 'quote'; text: string; cite: string }
  /** Done-for-you offer box (₹99 comment-to-DM plan). */
  | { t: 'offer'; variant: 'mid' | 'end' }
  /** The do-it-yourself vs done-for-you table from automation.ts. */
  | { t: 'compare' }
  /** Two options as side-by-side cards: the one to avoid and the one to pick. */
  | { t: 'verdict'; sides: VerdictSide[] }
  /** Comparison table; first column holds row labels. */
  | TableBlock
  /** An illustration with a caption. `portrait` keeps tall images narrow. */
  | { t: 'figure'; img: GuideImg; caption: string; portrait?: boolean }
  /** Numbered journey shown as connected steps. */
  | { t: 'flow'; label: string; steps: FlowStep[] }
  /** Tip or warning box for skimmers. */
  | { t: 'callout'; tone: 'tip' | 'warn'; title: string; text: string }
  /** Social ScaleX offer box linking to a service page. */
  | CtaBlock
  /** Big-number cards, each with its own source link. */
  | StatsBlock
  /** A made-up AI chat answer, clearly labelled as an example. */
  | ChatBlock
  /** Where an AI answer gets its facts: four cards around one hub. */
  | SourcesBlock
  /** Detailed numbered steps with a time estimate; titles render as h3. */
  | ChecklistBlock
  /** Clickable steps with one detail panel. Every panel is in the HTML; JS only switches. */
  | WorkflowBlock
  /** Clickable industry cards, each with one sample Reel. */
  | UseCasesBlock
  /** Interactive comment-to-DM example with the platform limits beside it. */
  | DmDemoBlock
  /** Reel Studio plans, from src/lib/studio.ts. */
  | { t: 'plans'; title: string; note: string }
  /** Second-by-second plan of one short educational Reel. */
  | StoryboardBlock;

export interface WorkflowBlock {
  t: 'workflow';
  label: string;
  steps: { title: string; text: string; points: string[] }[];
  note: string;
}

export interface UseCase {
  name: string;
  idea: string;
  hook: string;
  visuals: string;
  audience: string;
  cta: string;
}

export interface UseCasesBlock {
  t: 'usecases';
  label: string;
  items: UseCase[];
  note: string;
}

export interface DmDemoBlock {
  t: 'dmdemo';
  label: string;
  account: string;
  reel: string;
  commenter: string;
  /** `reply` empty = no trigger word, so no DM. */
  comments: { text: string; reply: string }[];
  note: string;
}

export interface StoryboardBlock {
  t: 'storyboard';
  label: string;
  frames: { time: string; title: string; visual: string; voice: string }[];
  caption: string;
}

export interface StatsBlock {
  t: 'stats';
  label: string;
  items: { value: string; text: string; source: string; href: string }[];
}

export interface ChatBlock {
  t: 'chat';
  question: string;
  intro: string;
  answer: { name: string; note: string }[];
  /** The empty slot shown under the answer. */
  missing: string;
  caption: string;
}

export type SourceIcon = 'map' | 'globe' | 'star' | 'link';

export interface SourcesBlock {
  t: 'sources';
  label: string;
  center: string;
  items: { icon: SourceIcon; title: string; text: string; usedBy: string[] }[];
}

export interface ChecklistBlock {
  t: 'checklist';
  label: string;
  items: { title: string; time?: string; text: string; points?: string[] }[];
}

export interface VerdictSide {
  label: string;
  tone: 'good' | 'bad';
  title: string;
  points: string[];
}

export interface TableBlock {
  t: 'table';
  caption: string;
  /** Column headings; the first labels the row-heading column ('' for none). */
  head: string[];
  rows: string[][];
  /** 1-based data column to highlight as the recommended option. */
  highlight: number;
}

export interface FlowStep {
  title: string;
  text: string;
}

export interface CtaBlock {
  t: 'cta';
  variant: 'mid' | 'end';
  title: string;
  text: string;
  points: string[];
  button: string;
  href: string;
  /** Prefilled WhatsApp message. */
  whatsapp: string;
}

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
  /** Up to three one-line takeaways shown inside the short-answer box. */
  keyPoints?: string[];
  published: string;
  updated: string;
  author: string;
  blocks: Block[];
  /** Question-and-answer pairs shown at the end (and as FAQPage schema). */
  faqs?: Faq[];
  /** Step list mirrored as HowTo schema for answer engines. */
  howTo?: { name: string; tools?: string[]; steps: { name: string; text: string }[] };
  /** Index into CONTACTS of the named person who wrote or reviewed the guide. */
  authorIndex?: number;
  /** Lead illustration under the short answer, plus a 1200×630 crop for sharing. */
  hero?: GuideImg & { og: string };
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
  mBoostVsAds: { label: 'Meta Business Help: Boosted posts vs ads created in Ads Manager', url: 'https://www.facebook.com/business/help/317083072148603' },
  igBoostWa: { label: 'Instagram for Business: Boost posts to WhatsApp (28 Sep 2021)', url: 'https://business.instagram.com/blog/instagram-boost-ads-whatsapp-find-customers' },
  waCtwa: { label: 'WhatsApp Business: Ads that click to WhatsApp', url: 'https://whatsappbusiness.com/products/ads-that-click-to-whatsapp/' },
  waBusinessApp: { label: 'WhatsApp Business: WhatsApp Business app', url: 'https://whatsappbusiness.com/products/business-app/' },
  loomerLocation: { label: 'Jon Loomer: Why Meta ads reach people outside the targeted location (31 Mar 2025)', url: 'https://www.jonloomer.com/meta-ads-reach-people-outside-of-the-targeted-location/' },
  viewsMetric: { label: 'Social Media Today: Instagram makes Views the primary metric (7 Aug 2024)', url: 'https://www.socialmediatoday.com/news/instagram-updates-metrics-to-focus-creators-on-views/723645/' },
  reelsInsights2025: { label: 'TechCrunch: Instagram gives creators more insight into Reels performance (29 Jan 2025)', url: 'https://techcrunch.com/2025/01/29/instagram-gives-creators-more-insight-into-their-reels-performance' },
  accountStatus2022: { label: 'TechCrunch: Instagram tells creators when content can’t be recommended (7 Dec 2022)', url: 'https://techcrunch.com/2022/12/07/instagrams-new-transparency-tools-will-tell-you-if-your-content-is-ineligible-to-be-recommended/' },
  yourAlgorithmGlobal: { label: 'The Keyword: Instagram expands Reels algorithm controls to all English-speaking users (14 Jan 2026)', url: 'https://www.thekeyword.co/news/instagram-expands-reels-algorithm-controls-to-all-english-speaking-users' },
  likeInsights: { label: 'Republic World: Instagram shows when viewers like a Reel (5 Aug 2025)', url: 'https://www.republicworld.com/tech/new-instagram-feature-lets-creators-see-exactly-when-viewers-like-their-reels' },
  metaAiRanking: { label: 'Meta: How AI influences what you see on Facebook and Instagram (29 Jun 2023)', url: 'https://about.fb.com/news/2023/06/how-ai-ranks-content-on-facebook-and-instagram/' },
  chatgptIndia: { label: 'TechCrunch: India has 100M weekly active ChatGPT users, Sam Altman says (15 Feb 2026)', url: 'https://techcrunch.com/2026/02/15/india-has-100m-weekly-active-chatgpt-users-sam-altman-says/' },
  aiModeIo: { label: 'Google: Search updates at I/O 2026 (19 May 2026)', url: 'https://blog.google/products-and-platforms/products/search/search-io-2026/' },
  pewAi: { label: 'Pew Research Center: Google users are less likely to click links when an AI summary appears (22 Jul 2025)', url: 'https://www.pewresearch.org/short-reads/2025/07/22/google-users-are-less-likely-to-click-on-links-when-an-ai-summary-appears-in-the-results/' },
  sparktoro2026: { label: 'SparkToro: In 2026, less than one third of Google searches still send a click (8 Jun 2026)', url: 'https://sparktoro.com/blog/in-2026-less-than-one-third-of-google-searches-still-send-a-click/' },
  aiModeIndia: { label: 'Google India: Introducing AI Mode in India (24 Jun 2025)', url: 'https://blog.google/intl/en-in/products/google-search-introducing-ai-mode-in-india/' },
  aiModeLangs: { label: 'Google India: New languages in AI Mode (8 Oct 2025)', url: 'https://blog.google/intl/en-in/products/supercharging-search-for-india-new-languages-in-ai-mode-search-live-debuts/' },
  gAiFeatures: { label: 'Google Search Central: AI features and your website (updated 10 Dec 2025)', url: 'https://developers.google.com/search/docs/appearance/ai-features' },
  gbpRanking: { label: 'Google Business Profile Help: Tips to improve your local ranking on Google', url: 'https://support.google.com/business/answer/7091' },
  geminiPlaces: { label: 'Gemini Apps Help: Find places and get directions in Gemini Apps', url: 'https://support.google.com/gemini/answer/16622866' },
  chatgptSearch: { label: 'OpenAI Help: ChatGPT search', url: 'https://help.openai.com/en/articles/9237897-chatgpt-search' },
  oaiBots: { label: 'OpenAI: Overview of OpenAI crawlers', url: 'https://developers.openai.com/api/docs/bots' },
  bingPlacesQa: { label: 'Microsoft Q&A forum moderator: Can Bing Places pull reviews from Google Business Profile? (27 Aug 2025)', url: 'https://learn.microsoft.com/en-us/answers/questions/5528564/can-bing-places-pull-reviews-from-google-business' },
  chatgptAdsIndia: { label: 'Business Today: ChatGPT ads arrive in India (27 Aug 2026)', url: 'https://www.businesstoday.in/technology/artificial-intelligence/story/chatgpt-ads-arrive-in-india-as-openai-targets-free-go-users-in-major-revenue-push-ahead-of-ipo-551655-2026-08-27' },
  googleAiAds: { label: 'TechCrunch: Google brings ads to AI Mode and AI Overviews (21 May 2025)', url: 'https://techcrunch.com/2025/05/21/google-is-bringing-ads-to-ai-mode/' },
  oaiAds: { label: 'OpenAI: Our approach to advertising and expanding access (16 Jan 2026)', url: 'https://openai.com/index/our-approach-to-advertising-and-expanding-access/' },
} satisfies Record<string, Source>;

export const GUIDES: Guide[] = [
  {
    slug: 'how-to-make-educational-videos-using-ai',
    title: 'How to make educational videos using AI, step by step (free method included)',
    metaTitle: 'How to Make Educational Videos Using AI (2026 Guide)',
    navTitle: 'Educational videos with AI',
    description:
      'Make educational videos with AI in 8 steps: one idea, checked facts, a 45-second script, AI visuals, voice-over and captions. Free method plus a Reel example.',
    summary:
      'Pick one small idea, check the facts yourself, and let AI do the slow parts: the first draft of the script, the visuals, the voice-over and the captions. Keep each video short and about one thing. Watch every second before you post, and label realistic AI footage. You can do all of this free with general AI tools, or let Reel Studio run the weekly routine for you.',
    keyPoints: [
      '**Short wins.** In 6.9 million lesson-video sessions, the median watch time was at most about 6 minutes, however long the video ran.',
      '**AI drafts, you check.** AI writes fast and sometimes gets facts wrong. Every claim needs a human check.',
      '**Label realistic AI.** Instagram and YouTube ask you to disclose realistic AI video or voice.',
    ],
    published: '2026-11-11',
    updated: '2026-11-11',
    author: 'Social ScaleX team',
    authorIndex: 0,
    hero: {
      base: '/guides/educational-videos/educational-videos-ai-hero-v1',
      alt: 'A hand-drawn (a + b)² square in a notebook becoming a vertical educational Reel on a phone',
      width: 1672,
      height: 941,
      widths: [480, 768, 1080, 1344],
      blur: 'data:image/webp;base64,UklGRnYAAABXRUJQVlA4IGoAAABwAwCdASoYAA4APu1iqU2ppaOiMAgBMB2JZwABSgGyJbb/2gAA/vmmLtn89I/j8injvRefrxSlijz45HxuGjxl+5P1kAmyjg0bF08lUGpe8fSRplHlkpN4GXAZdVrFg/mSjdEAhZp0AAAA',
      og: '/guides/educational-videos/educational-videos-ai-og.jpg',
    },
    blocks: [
      {
        t: 'p',
        text: 'You know your subject. You can explain a tricky idea to a student across the table in two minutes. Turning that into a video every week is the hard part: writing, recording, editing, posting, replying. AI now handles most of that work. It still can’t replace your judgement, and this guide shows exactly where each one fits.',
      },

      { t: 'h2', text: 'Can AI really make educational videos?' },
      {
        t: 'p',
        text: 'Yes, for short explainers. AI can draft a script, generate images and video clips, read the script in a natural voice, and add captions, in Hindi, Hinglish or English. What it can’t do is know whether the facts are right for your students. A teacher, coach or expert still picks the topic and checks every claim before posting.',
      },
      {
        t: 'table',
        caption: 'Who does what in an AI-made educational video',
        head: ['Job', 'AI does it well', 'You still decide'],
        rows: [
          ['Topic', 'Suggests ideas from your notes, comments or website', 'Which question your audience actually asks'],
          ['Script', 'Writes a first draft in seconds', 'Whether every fact is right'],
          ['Visuals', 'Generates images, clips and simple animations', 'Whether each visual explains or just decorates'],
          ['Voice and captions', 'Reads the script and adds subtitles', 'Pronunciation of names and technical terms'],
          ['Posting', 'Schedules, posts and replies to set comments', 'What goes live under your name'],
        ],
        highlight: 2,
      },
      {
        t: 'callout',
        tone: 'tip',
        title: 'Google doesn’t penalise AI help',
        text: 'Google says it rewards high-quality content “however it is produced”, and that appropriate use of AI is not against its guidelines. Using AI mainly to game rankings is. [Google Search Central](https://developers.google.com/search/blog/2023/02/google-search-and-ai-content)',
      },

      { t: 'h2', text: 'How do you make an educational video with AI, step by step?' },
      {
        t: 'p',
        text: 'Follow these eight steps for each video. The first time takes an afternoon. By the fifth video, most of it becomes routine. You only need a phone or laptop, a free AI chat tool such as ChatGPT, Gemini or Claude, and any video editor that adds captions.',
      },
      {
        t: 'checklist',
        label: 'Eight steps to an AI educational video',
        items: [
          {
            title: 'Pick one question your audience asks',
            time: '10 min',
            text: 'Look at student doubts, comments, sales calls and WhatsApp questions. Pick one narrow question, such as “why is (a + b)² not a² + b²?”, not “all of algebra”. One video, one idea.',
          },
          {
            title: 'Research and verify the facts',
            time: '20 min',
            text: 'Ask AI for an outline, then check each claim against a source you trust: the textbook, the official website, the original study. If you can’t confirm a fact, cut it. AI states wrong things as confidently as right ones.',
          },
          {
            title: 'Write a 45 to 60 second script',
            time: '20 min',
            text: 'Use the shape that works for short lessons: a question as the hook, one explanation, one example, a one-line recap and one call to action. Write the way you speak. Research on multimedia learning finds people learn better from a conversational style than a formal one. [Mayer, Multimedia Principles](https://ugc.futurelearn.com/uploads/files/7d/d6/7dd6188d-c343-4311-b064-ac98d2c95abc/Multimedia_Principles._R._E._Mayer__2020.pdf)',
          },
          {
            title: 'Generate visuals that explain',
            time: '30 min',
            text: 'Plan one visual per sentence: a diagram, a labelled object, a step appearing on screen. Leave out decoration. Learners do better when extra material is cut and the key parts are highlighted.',
            points: ['Check any text inside AI images. Spellings and formulas often come out wrong.', 'Keep the screen vertical (9:16) if the video is for Reels or Shorts.'],
          },
          {
            title: 'Add voice-over and captions',
            time: '15 min',
            text: 'Use a friendly, human-sounding voice, or your own. Mayer’s voice principle says people learn better from a friendly human voice than a machine one. Add captions for people watching on mute and for learners in a second language.',
          },
          {
            title: 'Edit to one idea per screen',
            time: '20 min',
            text: 'Cut pauses and repeats. Keep it short. In a study of 6.9 million video sessions on edX, the median watch time was at most about 6 minutes, whatever the video’s length, and viewers engaged more when instructors spoke faster. [Guo, Kim & Rubin, 2014](https://up.csail.mit.edu/other-pubs/las2014-pguo-engagement.pdf) Reels can run longer, but a short lesson rarely needs more than a minute.',
          },
          {
            title: 'Publish with a label and one clear ask',
            time: '10 min',
            text: 'Write a caption that says what the viewer will learn. Ask for one action, such as “Comment NOTES for the practice sheet”. If the video has realistic AI footage or an AI voice that sounds real, use the platform’s AI label.',
          },
          {
            title: 'Check what worked and repeat it',
            time: '15 min a week',
            text: 'After a week, look at watch time, saves, shares and comments in Instagram Insights or YouTube Studio. Make more videos like the ones people watched to the end and saved.',
          },
        ],
      },
      {
        t: 'figure',
        img: {
          base: '/guides/educational-videos/faceless-educational-video-setup-v1',
          alt: 'A desk with a phone on a small tripod showing a diagram, a microphone and a laptop with a voice waveform, and no person on camera',
          width: 1448,
          height: 1086,
          widths: [480, 768, 1080, 1344],
          blur: 'data:image/webp;base64,UklGRuoAAABXRUJQVlA4IN4AAAAwBQCdASoYABIAPu1urlIppiQiqAgBMB2JQAHPlZ9ZlA3roNxz574+UFvbjGDpelCu/AD+79eRIOsqX8ngKGNyaaQRpcSBorewURuv7Owg5P81/Rzgn2llZc5PnC2eNk7etVzXvKkBr5+Be7K2Fa5NHD1tGb1BAgxhZ8Bb16fvVYrW0p9Hj+o3a2RvqFBNEgWzCh23XVXMLS1nXOW59DWXcjBnfq6tsZTrSKfHTcjI/3Ta40bMkPgTzpr9MauoHS05Iz7naLZNrUop3djtujKYBNRUuyagTl7sM9kgAAA=',
        },
        caption: 'A faceless setup: the phone records the diagram, the microphone records your voice. Illustration.',
      },
      {
        t: 'callout',
        tone: 'warn',
        title: 'Label realistic AI video and voice',
        text: 'Meta requires people to use its AI disclosure label when they post photorealistic video or realistic-sounding audio that was digitally created or altered, and may apply penalties if they don’t. [Meta, 6 Feb 2024](https://about.fb.com/news/2024/02/labeling-ai-generated-images-on-facebook-instagram-and-threads/) YouTube asks the same for content that seems realistic, but not for clearly animated videos or AI-written scripts. [YouTube Help](https://support.google.com/youtube/answer/14328491)',
      },

      { t: 'h2', text: 'What does a good AI educational Reel look like?' },
      {
        t: 'p',
        text: 'Here is a complete plan for one 48-second maths Reel, shot by shot. Every line on screen is checkable, and the numbers work: with a = 3 and b = 2, (a + b)² is 25, while a² + b² is only 13. The missing 12 is 2ab.',
      },
      {
        t: 'figure',
        img: {
          base: '/guides/educational-videos/a-plus-b-squared-reel-cover-v1',
          alt: 'Reel cover: a square split into a², two ab rectangles in coral, and b²',
          width: 941,
          height: 1672,
          widths: [256, 512, 768],
          blur: 'data:image/webp;base64,UklGRsgAAABXRUJQVlA4ILwAAACwBQCdASoYACsAPu1kqE2ppaOiMBqqqTAdiWoAsR/BFABGrckMTrscESFe/B0ZPtP7DqvEUAAA/von8MugFBJWzRntsddn0w3LN5GqEkvxbpFzP0iL1LOdx8Ry1648VVaoyuLDRckAGynn7EFdBjGWDvVlMre7uqTJL3yXHoVf4UroMn+SwdARkoj7fNTOyzYhG6lTlwWwX3q9/8LINSK1N7PIQDTKK2DVuwbj2+o80xml9nQx4VzI01hwAA==',
        },
        caption: 'The Reel’s key frame: the square split into a², two ab rectangles and b². Illustration.',
        portrait: true,
      },
      {
        t: 'storyboard',
        label: 'Storyboard: why (a + b)² is not a² + b²',
        frames: [
          { time: '0–3 s', title: 'The common mistake', visual: '“(a + b)² = a² + b²” in big type, crossed out in red.', voice: 'Half the class writes this. It’s wrong.' },
          { time: '3–12 s', title: 'Draw the square', visual: 'A square with each side labelled a + b.', voice: 'Draw a square with side a plus b. Its area is (a + b)².' },
          { time: '12–25 s', title: 'Split it', visual: 'The square splits into a², b² and two rectangles marked ab.', voice: 'Split it up. You get a², b², and two rectangles of ab.' },
          { time: '25–35 s', title: 'Check with numbers', visual: 'a = 3, b = 2. Then 5² = 25, but 9 + 4 = 13. The gap of 12 glows: 2 × 3 × 2.', voice: 'Try 3 and 2. The answer is 25, not 13. The missing 12 is 2ab.' },
          { time: '35–42 s', title: 'The rule', visual: '(a + b)² = a² + 2ab + b², boxed.', voice: 'So remember: a² plus 2ab plus b².' },
          { time: '42–48 s', title: 'One clear ask', visual: '“Comment NOTES for 10 practice questions.”', voice: 'Want ten practice questions? Comment NOTES.' },
        ],
        caption: 'Example storyboard written by Social ScaleX. Swipe on phones to see every shot.',
      },

      { t: 'h2', text: 'Which businesses can use AI educational videos?' },
      {
        t: 'p',
        text: 'Anyone whose customers ask questions before they buy. An educational Reel answers one of those questions in public, so the next person finds the answer and finds you. These five work especially well because the topic can be shown, not just told.',
      },
      {
        t: 'usecases',
        label: 'Pick your business to see a sample Reel',
        items: [
          { name: 'Coaching centres', idea: 'One common maths mistake, fixed in under a minute', hook: 'Half the class writes (a + b)² = a² + b². Here’s why it’s wrong.', visuals: 'An animated square splitting into four parts, then the numbers check.', audience: 'Class 9 and 10 students, and their parents', cta: 'Comment NOTES for 10 practice questions' },
          { name: 'Schools and institutes', idea: 'Career paths after Class 12 science', hook: 'Finished PCM? Engineering isn’t your only door.', visuals: 'AI images of each career with its entrance exam written underneath.', audience: 'Class 11 and 12 students and parents choosing a course', cta: 'Comment CAREER for the full list' },
          { name: 'Digital agencies', idea: 'Why a website gets visits but no enquiries', hook: '500 visitors and zero calls? Check these three things.', visuals: 'A simple website mock-up with arrows on the phone number, form and offer.', audience: 'Small business owners who already have a website', cta: 'Comment AUDIT for a free checklist' },
          { name: 'Consultants', idea: 'One tax or finance choice explained simply', hook: 'Old or new tax regime? Ask yourself two questions first.', visuals: 'Two cards side by side, each question appearing in turn.', audience: 'Salaried professionals at tax-filing time', cta: 'Comment TAX and we’ll send a booking link' },
          { name: 'IT companies', idea: 'What phishing looks like, using one fake email', hook: 'This email looks real. Can you spot the three clues?', visuals: 'An AI-made sample email with each warning sign highlighted in turn.', audience: 'Office teams and small business owners', cta: 'Comment SAFE for a staff checklist' },
        ],
        note: 'Sample ideas written for this guide. Check any rule-based topic, such as tax, against the current official source before posting.',
      },

      { t: 'h2', text: 'Why is posting educational videos every week so hard?' },
      {
        t: 'p',
        text: 'One video is a project. A video every week is a job. The work that wears people down is rarely the filming. It’s the routine around it:',
      },
      {
        t: 'ul',
        items: [
          '**Finding the next topic** when last week’s idea already used your best question.',
          '**Writing and checking** a new script, then generating and fixing visuals.',
          '**Posting on time**, even during exams, admissions or a busy sales week.',
          '**Answering the same comments**, “price?”, “details?”, “link?”, one by one.',
          '**Reading the numbers** to see what to make next.',
        ],
      },
      {
        t: 'p',
        text: 'You can run all of that yourself with the free method above. If the routine, not the knowledge, is what stops you, that’s the part we built Reel Studio to take over.',
      },
      {
        t: 'cta',
        variant: 'mid',
        title: 'Turn your knowledge into Reels every week',
        text: 'Tell Reel Studio about your business once. It plans, writes and makes your Reels, and you approve each one before it posts.',
        points: ['Comment-to-DM included in every plan', 'You approve every reel', 'Plans from ₹2,499 a month'],
        button: 'Explore Reel Studio',
        href: 'https://studio.socialscalex.in/',
        whatsapp: 'Hi Social ScaleX, I read your guide on educational videos with AI. Can you tell me about Reel Studio?',
      },

      { t: 'h2', text: 'How does Social ScaleX Reel Studio make educational Reels?' },
      {
        t: 'p',
        text: 'Reel Studio is our own tool at studio.socialscalex.in. You describe your business once, and it plans, writes and makes Instagram Reels for you. Nothing posts unless you approve it, or unless you switch on automatic posting yourself. Tap through the steps below.',
      },
      {
        t: 'workflow',
        label: 'How Reel Studio works, step by step',
        steps: [
          { title: 'Connect', text: 'Type your business details once: what you sell, your goals and the language you want your Reels in. Add your website or LinkedIn link if you have one.', points: ['Connect Instagram on Instagram’s own login page. The Studio never sees your password.', 'You can disconnect at any time.'] },
          { title: 'Research', text: 'AI reads your details and the links you shared, and plans Reel topics around what your business actually offers.', points: ['You keep ownership of your business content. It’s used only to make your Reels and run the service.'] },
          { title: 'Script', text: 'For each topic, AI writes the hook, the script and the call to action.', points: ['Reels must follow Instagram’s rules and Indian advertising standards.'] },
          { title: 'Generate', text: 'The Studio makes the full Reel from AI video clips, AI images and an AI voice-over.', points: ['Upload a voice sample and Reels can use your own voice.'] },
          { title: 'Approve', text: 'When a Reel is ready, you get an alert on the website, by email and on WhatsApp. Approve it, re-generate it or reject it.', points: ['Re-generating before approval is free within a daily fair-use limit.', 'Only an approved Reel counts against your plan.'] },
          { title: 'Publish', text: 'Approved Reels post to your connected Instagram account.', points: ['Optional automatic posting: if you don’t act within 60 minutes, the Reel posts at the next allowed time, never between 11 PM and 7 AM.', 'Reels flagged by the Studio’s checks never post without your approval.', 'Download approved Reels within 48 hours; then the file is deleted from the Studio’s servers.'] },
          { title: 'Engage', text: 'Comment-to-DM replies to people who comment a trigger word you choose, with the message you set.', points: ['Included in every plan at no extra cost.'] },
          { title: 'Improve', text: 'The Studio reads your account’s performance, such as views, reach, saves and shares, to make the next Reels better.', points: ['It reads these numbers only with your permission, from your connected account.'] },
        ],
        note: 'Illustration of the workflow, not a screenshot. Based on Reel Studio’s [Terms](https://studio.socialscalex.in/terms) and [Privacy Policy](https://studio.socialscalex.in/privacy), effective 25 Oct 2026.',
      },

      { t: 'h2', text: 'How does comment-to-DM turn a Reel into an enquiry?' },
      {
        t: 'p',
        text: 'A good educational Reel makes people want the next step: the notes, the fees, the batch timings. Instead of typing the same reply fifty times, you choose a trigger word and the message to send. When someone comments that word, they get your message in their inbox. Try it below.',
      },
      {
        t: 'dmdemo',
        label: 'Example: comment-to-DM on an educational Reel',
        account: 'yourcoaching',
        reel: 'Why (a + b)² is not a² + b² 📐 Comment NOTES for 10 practice questions.',
        commenter: 'riya_09',
        comments: [
          { text: 'NOTES', reply: 'Hi Riya! Here are your 10 practice questions on (a + b)²: [your link]. Want the Class 10 batch timings too? Reply YES.' },
          { text: 'PRICE', reply: 'Hi Riya! Our Class 10 maths batch fees and timings are here: [your link]. Reply with any question and our team will answer.' },
          { text: 'Nice video!', reply: '' },
        ],
        note: 'Instagram limits automatic messages: one private reply per comment, sent within 7 days of the comment. The chat continues only if the person replies. [Meta for Developers](https://developers.facebook.com/docs/instagram-platform/private-replies/) Delivery depends on Instagram and isn’t guaranteed.',
      },
      {
        t: 'p',
        text: 'Every Reel Studio plan includes comment-to-DM at no extra cost. If you only want comment-to-DM for Reels you make yourself, our standalone [comment-to-DM plan](/automation/instagram-comment-to-dm) costs ₹99 a month. Prefer to set it up yourself? Follow our [free comment-to-DM guide](/guides/free-instagram-comment-to-dm-automation).',
      },

      { t: 'h2', text: 'How much does Reel Studio cost?' },
      {
        t: 'p',
        text: 'Three monthly plans. The difference is how many approved Reels you get. Comment-to-DM, approvals and alerts come with all of them.',
      },
      { t: 'plans', title: 'Reel Studio plans', note: 'Prices per month as of 11 November 2026. No GST is added. Full rules in the [Reel Studio Terms](https://studio.socialscalex.in/terms).' },
      {
        t: 'p',
        text: 'Want a person to shoot real footage instead? Our [Reels production service](/services/reels-production) films at your location in Delhi NCR. To get more reach from whatever you post, read [how Instagram decides who sees your Reels](/guides/instagram-reels-reach).',
      },
      {
        t: 'cta',
        variant: 'end',
        title: 'Your knowledge deserves an audience',
        text: 'Let Reel Studio turn what you know into a steady stream of educational Reels, with comment-to-DM in every plan.',
        points: ['Plans from ₹2,499 a month', 'Comment-to-DM included, no add-on fee', 'You approve every reel before it posts', 'Reels in your own voice from a sample'],
        button: 'Get started with Reel Studio',
        href: 'https://studio.socialscalex.in/',
        whatsapp: 'Hi Social ScaleX, I want to try Reel Studio for educational Reels.',
      },
    ],
    faqs: [
      {
        q: 'Can I make educational videos with AI for free?',
        a: 'Yes. A free AI chat tool can draft and tidy your script, and many free video editors can add captions. The time goes into checking facts, generating visuals and editing. Paid tools mainly save that time. Follow the eight steps in this guide and your first video costs nothing but an afternoon.',
      },
      {
        q: 'Can I make educational videos without showing my face?',
        a: 'Yes. Faceless educational videos use diagrams, animations, screen recordings or AI visuals with a voice-over. Your voice, or a voice made from your own sample, keeps the video personal. Research on multimedia learning finds people learn better from a friendly human voice than a robotic one.',
      },
      {
        q: 'Can AI make educational videos in Hindi?',
        a: 'Yes. AI chat tools can write Hindi and Hinglish scripts, and many voice tools offer Hindi voices. Listen to the full voice-over before posting, because names, formulas and technical terms are often mispronounced. Reel Studio lets you choose the language you want your Reels in.',
      },
      {
        q: 'How long should an educational video be?',
        a: 'As short as the idea allows. A study of 6.9 million edX video sessions found median watch time topped out at about 6 minutes, however long the video was. For Instagram Reels, one idea usually fits in 30 to 60 seconds.',
      },
      {
        q: 'Do I have to label AI-made videos on Instagram and YouTube?',
        a: 'Only when they look or sound real. Meta requires a disclosure label for photorealistic video or realistic-sounding audio that was digitally created or altered. YouTube asks the same for realistic content, but not for clearly animated videos or for using AI to write scripts, captions or ideas.',
      },
      {
        q: 'Does Reel Studio post without my approval?',
        a: 'Not unless you switch on automatic posting. With it on, a Reel you don’t act on within 60 minutes posts at the next allowed time, never between 11 PM and 7 AM. Reels flagged by the Studio’s checks always wait for your approval. You can switch automatic posting off any time.',
      },
    ],
    howTo: {
      name: 'How to make an educational video using AI',
      tools: ['An AI chat tool', 'An AI image or video generator', 'A voice-over tool', 'A video editor with captions'],
      steps: [
        { name: 'Pick one question', text: 'Choose one narrow question your audience actually asks.' },
        { name: 'Verify the facts', text: 'Draft an outline with AI, then check every claim against a trusted source.' },
        { name: 'Write a short script', text: 'Hook, one explanation, one example, a recap and one call to action, in conversational language.' },
        { name: 'Generate visuals', text: 'Create one explanatory visual per sentence and check any text inside AI images.' },
        { name: 'Add voice and captions', text: 'Use a friendly human-sounding voice or your own, and add captions.' },
        { name: 'Edit tightly', text: 'Cut pauses and keep one idea per screen.' },
        { name: 'Publish with a label', text: 'Write a clear caption, ask for one action, and label realistic AI video or voice.' },
        { name: 'Review and repeat', text: 'Check watch time, saves and shares, then make more of what worked.' },
      ],
    },
    sources: [
      { label: 'Google Search Central: Google Search’s guidance about AI-generated content (8 Feb 2023)', url: 'https://developers.google.com/search/blog/2023/02/google-search-and-ai-content' },
      { label: 'Guo, Kim & Rubin: How video production affects student engagement (Learning at Scale, 2014)', url: 'https://up.csail.mit.edu/other-pubs/las2014-pguo-engagement.pdf' },
      { label: 'R. E. Mayer: Multimedia principles, from Multimedia Learning, 3rd ed. (2020)', url: 'https://ugc.futurelearn.com/uploads/files/7d/d6/7dd6188d-c343-4311-b064-ac98d2c95abc/Multimedia_Principles._R._E._Mayer__2020.pdf' },
      { label: 'Meta: Labeling AI-generated images on Facebook, Instagram and Threads (6 Feb 2024)', url: 'https://about.fb.com/news/2024/02/labeling-ai-generated-images-on-facebook-instagram-and-threads/' },
      { label: 'YouTube Help: Disclosing use of altered or synthetic content', url: 'https://support.google.com/youtube/answer/14328491' },
      { label: 'Meta for Developers: Instagram private replies', url: 'https://developers.facebook.com/docs/instagram-platform/private-replies/' },
      { label: 'Social ScaleX Reel Studio: Terms of Service (effective 25 Oct 2026)', url: 'https://studio.socialscalex.in/terms' },
      { label: 'Social ScaleX Reel Studio: Privacy Policy (effective 25 Oct 2026)', url: 'https://studio.socialscalex.in/privacy' },
    ],
    services: ['reels-production', 'instagram-marketing'],
  },
  {
    slug: 'get-recommended-by-chatgpt-gemini-ai-mode',
    title: 'Is ChatGPT recommending your competitor? How to get your business named by ChatGPT, Gemini and Google AI Mode',
    metaTitle: 'Get Named by ChatGPT, Gemini & AI Mode (2026)',
    navTitle: 'Get named by ChatGPT',
    description:
      'Is ChatGPT naming your competitor, not you? A simple 7-step plan to get your business recommended by ChatGPT, Gemini and Google AI Mode. Official sources.',
    summary:
      'When a customer asks ChatGPT, Gemini or Google’s AI Mode “which shop is best near me?”, the app answers with a few business names. It picks them from what it can find about each business online. Google’s AI uses Google Search and your Google Business Profile. Gemini uses Google Maps. ChatGPT can search the web using outside search engines such as Bing. So the fix is simple: a complete Google profile with real reviews, plain words on your website, and the same details everywhere. You can’t pay to be named in the normal answer; ads are always marked as ads.',
    keyPoints: [
      '**Test first.** Ask the AI what your customer would ask, and see who gets named.',
      '**Fix your Google Business Profile.** Correct details, real photos, real reviews.',
      '**Write it plainly online.** What you sell, where you are, when you are open.',
    ],
    published: '2026-11-04',
    updated: '2026-11-04',
    author: 'Social ScaleX team',
    authorIndex: 0,
    blocks: [
      { t: 'h2', text: 'What is changing: customers now ask AI' },
      {
        t: 'p',
        text: 'Earlier, people typed “AC repair near me” into Google and opened a few websites. Now many people ask an **AI app** instead: ChatGPT, Gemini, or **AI Mode** inside Google Search. The app gives one short answer with a few business names. If your name is not in that answer, the customer may never see you.',
      },
      {
        t: 'stats',
        label: 'The numbers behind the change',
        items: [
          { value: '100 million', text: 'weekly ChatGPT users in India, its second-biggest user base after the US.', source: 'Sam Altman, via TechCrunch, 15 Feb 2026', href: 'https://techcrunch.com/2026/02/15/india-has-100m-weekly-active-chatgpt-users-sam-altman-says/' },
          { value: '1 billion+', text: 'people use Google’s AI Mode every month, around the world.', source: 'Google, 19 May 2026', href: 'https://blog.google/products-and-platforms/products/search/search-io-2026/' },
          { value: '8% vs 15%', text: 'When Google showed an AI summary, people clicked a regular search result in 8% of visits. Without one, 15%.', source: 'Pew Research Center, US, 22 Jul 2025', href: 'https://www.pewresearch.org/short-reads/2025/07/22/google-users-are-less-likely-to-click-on-links-when-an-ai-summary-appears-in-the-results/' },
          { value: '68%', text: 'of Google searches in the US ended with no click at all, January to April 2026.', source: 'SparkToro, 8 Jun 2026', href: 'https://sparktoro.com/blog/in-2026-less-than-one-third-of-google-searches-still-send-a-click/' },
        ],
      },
      {
        t: 'p',
        text: 'AI Mode came to India in June 2025, first as an English test in Search Labs. [Google, 24 Jun 2025](https://blog.google/intl/en-in/products/google-search-introducing-ai-mode-in-india/) It already worked in Hindi by October 2025, when Google added Bengali, Kannada, Malayalam, Marathi, Tamil, Telugu and Urdu. [Google, 8 Oct 2025](https://blog.google/intl/en-in/products/supercharging-search-for-india-new-languages-in-ai-mode-search-live-debuts/) So your customers can ask in their own language, and the AI answer can be the first thing they read.',
      },

      { t: 'h2', text: 'Check in 2 minutes: does AI name you?' },
      {
        t: 'chat',
        question: 'Which is the best AC repair service near Sector 62, Noida?',
        intro: 'Here are some well-rated options near Sector 62:',
        answer: [
          { name: 'Shop A', note: '4.8 rating · 230 reviews · open till 9 pm' },
          { name: 'Shop B', note: '4.6 rating · 140 reviews · home visits' },
          { name: 'Shop C', note: '4.5 rating · 95 reviews · yearly service plans' },
        ],
        missing: 'Your business is not in the answer.',
        caption: 'Made-up example to show the idea. Real answers depend on where the customer is and what they type.',
      },
      {
        t: 'ol',
        items: [
          'Open **ChatGPT**, **Gemini**, or Google and tap **AI Mode**.',
          'Type what your customer would type, with your area: “best bakery in Rajouri Garden”, “CA near Dwarka Sector 10”.',
          'Ask **three different questions**. Write down which businesses get named.',
          'Ask about yourself too: “What do you know about [your business name] in [your area]?” Check the phone number, hours and address it gives.',
        ],
      },
      {
        t: 'callout',
        tone: 'tip',
        title: 'Ask like a customer, not like the owner',
        text: 'Customers don’t type your name. They type their problem: “AC not cooling”, “cake for 50 people”, “help with GST filing”. Test those words.',
      },

      { t: 'h2', text: 'How AI apps choose which business to name' },
      {
        t: 'p',
        text: 'No AI company publishes a secret formula. But they do say where their answers come from. Each app reads what it can find about your business online. If it can’t find clear facts about you, it is more likely to name someone else.',
      },
      {
        t: 'sources',
        label: 'Where AI gets its facts about your business',
        center: 'AI answer',
        items: [
          {
            icon: 'map',
            title: 'Google Business Profile and Maps',
            text: 'Your free listing on Google Maps: name, category, address, phone, hours, photos. Google tells businesses to keep it up to date for its AI features, and Gemini uses public Google Maps information.',
            usedBy: ['Google AI Mode', 'AI Overviews', 'Gemini'],
          },
          {
            icon: 'globe',
            title: 'Your website',
            text: 'Pages that say in plain text what you sell and where. Google reads the pages it has indexed. ChatGPT can search the web using outside search engines such as Bing.',
            usedBy: ['ChatGPT', 'Google AI Mode', 'AI Overviews'],
          },
          {
            icon: 'star',
            title: 'Reviews and ratings',
            text: 'Google says more reviews and good ratings can help your local ranking. Gemini can show a place’s rating when it suggests it.',
            usedBy: ['Google Search and Maps', 'Gemini'],
          },
          {
            icon: 'link',
            title: 'Other websites that mention you',
            text: 'Google says it also looks at how well-known a business is, including how many websites link to it. Public posts from Instagram professional accounts can show up in search engines too, unless the owner turns this off.',
            usedBy: ['Google Search and Maps'],
          },
        ],
      },
      {
        t: 'table',
        caption: 'What each AI app looks at, and what you should do',
        head: ['App', 'Where its answers come from', 'What you should do'],
        rows: [
          ['Google AI Overviews and AI Mode', 'Google Search and your Google Business Profile. Google says no special trick is needed. [Google](https://developers.google.com/search/docs/appearance/ai-features)', 'Complete your Business Profile. Make sure Google can find your website pages.'],
          ['Gemini', 'Public Google Maps information: address, website, rating, hours. [Gemini Help](https://support.google.com/gemini/answer/16622866)', 'Same as above. Your Google Maps listing is the key.'],
          ['ChatGPT', 'Web search, which may use outside search engines such as Bing. It also uses your rough location. [OpenAI Help](https://help.openai.com/en/articles/9237897-chatgpt-search)', 'Let search robots read your website. A Bing Places listing can help too.'],
        ],
        highlight: 2,
      },
      {
        t: 'callout',
        tone: 'warn',
        title: 'You can’t pay to be named in the normal answer',
        text: 'Google says there is no way to pay for a better local ranking. [Google](https://support.google.com/business/answer/7091) Google and ChatGPT do sell ads, but they are marked as ads: Google labels them “Sponsored”. [TechCrunch, 21 May 2025](https://techcrunch.com/2025/05/21/google-is-bringing-ads-to-ai-mode/) ChatGPT ads started rolling out in India in late August 2026 for logged-in Free and Go users. They appear at the bottom of the answer and are clearly labelled. [Business Today, 27 Aug 2026](https://www.businesstoday.in/technology/artificial-intelligence/story/chatgpt-ads-arrive-in-india-as-openai-targets-free-go-users-in-major-revenue-push-ahead-of-ipo-551655-2026-08-27) OpenAI says ads do not influence ChatGPT’s answers. [OpenAI, 16 Jan 2026](https://openai.com/index/our-approach-to-advertising-and-expanding-access/)',
      },
      {
        t: 'cta',
        variant: 'mid',
        title: 'Not sure what AI says about you?',
        text: 'We check ChatGPT, Gemini and Google AI Mode with you on a **free** strategy call.',
        points: ['Free, no obligation', 'Talk directly to the founders', 'Fixes in plain words'],
        button: 'Book a free check',
        href: '/contact',
        whatsapp: 'Hi Social ScaleX, can you check what ChatGPT and Google AI say about my business?',
      },

      { t: 'h2', text: 'The 7-step plan to get named' },
      {
        t: 'checklist',
        label: 'Seven steps to get your business named by AI',
        items: [
          {
            title: 'Write down what AI says today',
            time: '10 minutes',
            text: 'Ask the three customer questions from above in ChatGPT, Gemini and Google AI Mode. Take screenshots. This is your “before” picture.',
          },
          {
            title: 'Complete your Google Business Profile',
            time: '30 minutes',
            text: 'For a local business, this is usually the most important step. Google says businesses with complete and correct details are more likely to show up in local results. [Google](https://support.google.com/business/answer/7091)',
            points: [
              'Pick the **closest category**, for example “Bakery”, not just “Shop”.',
              'Check your **phone number, address and opening hours**. Set special hours for festivals. [Google](https://support.google.com/business/answer/6303076)',
              'Add **real photos**: your shop, your team, your work.',
              'List the **services** you offer and the **areas** you cover.',
              '**Verify** the profile, so Google knows you are the owner.',
            ],
          },
          {
            title: 'Get real reviews and reply to each one',
            time: 'Every week',
            text: 'Google says more reviews and good ratings can help your local ranking, and replying shows customers you care. [Google](https://support.google.com/business/answer/7091)',
            points: [
              'Ask **every** customer after the job, not only the happy ones. Send your review link on WhatsApp.',
              'Reply to every review, good or bad, in one or two polite lines.',
              'Never buy reviews or give discounts for them. Google’s rules ban this, and it removes such reviews. [Google policy](https://support.google.com/contributionpolicy/answer/7400114)',
            ],
          },
          {
            title: 'Put plain answers on your website',
            time: '1–2 hours',
            text: 'AI can only repeat what it can read. Google says to keep important information in text, not only inside photos. [Google](https://developers.google.com/search/docs/appearance/ai-features)',
            points: [
              'One page for each main service, with your area in the heading: “AC repair in Sector 62, Noida”.',
              'Write your phone number, opening hours and, if you share them, starting prices as text.',
              'Add a short FAQ: the five questions customers ask you on the phone.',
              'No website yet? Your Google profile still works for Google and Gemini. A simple one-page site gives ChatGPT something to read.',
            ],
          },
          {
            title: 'Use the same name, phone and address everywhere',
            time: '20 minutes',
            text: 'Write your details the same way on Google, Instagram, Facebook, JustDial and your website. If one place shows an old number, an AI app may repeat the wrong one.',
            points: [
              'Bing has its own business listing, **Bing Places**. ChatGPT may use Bing for search [OpenAI Help](https://help.openai.com/en/articles/9237897-chatgpt-search), so claiming it can help.',
              'Bing Places can sync with your Google profile, but it does not copy your Google reviews. Bing shows reviews from sites like Yelp and Facebook instead. [Microsoft Q&A forum moderator, 27 Aug 2025](https://learn.microsoft.com/en-us/answers/questions/5528564/can-bing-places-pull-reviews-from-google-business)',
            ],
          },
          {
            title: 'Let AI search robots read your website',
            time: '5 minutes for your web person',
            text: 'Every website has a small file called **robots.txt**. It tells search robots which pages they may read. If it blocks them, AI search features may leave your pages out of their answers.',
            points: [
              '**Googlebot** reads pages for Google Search, AI Overviews and AI Mode. [Google](https://developers.google.com/search/docs/appearance/ai-features)',
              '**OAI-SearchBot** reads pages for ChatGPT search. OpenAI says sites that block it are left out of ChatGPT search answers (they may still appear as plain links), and a change takes about 24 hours. [OpenAI](https://developers.openai.com/api/docs/bots)',
              '**Bingbot** reads pages for Bing, one of the search engines ChatGPT search may use.',
            ],
          },
          {
            title: 'Get your name on other trusted websites',
            time: 'Every month',
            text: 'Google says how well-known a business is also counts, including how many websites link to it. [Google](https://support.google.com/business/answer/7091)',
            points: [
              'Get listed on your market association or trade body website.',
              'Ask the brands you sell, or your suppliers, to list you as a dealer or partner.',
              'Share real news, like a new branch or an event, with local news and community pages.',
              'Post on Instagram from a business account, with your area in the caption. Public posts from professional accounts (18+) can appear in search engines, unless the owner turns this off. [Instagram Help](https://help.instagram.com/147542625391305)',
            ],
          },
        ],
      },
      {
        t: 'callout',
        tone: 'tip',
        title: 'Repeat the test every month',
        text: 'Ask the same three questions on the same apps. Compare with your “before” screenshots. AI answers change, so judge over a few months, not one day.',
      },

      { t: 'h2', text: 'Before and after: what AI can and can’t use' },
      {
        t: 'verdict',
        sides: [
          {
            label: 'AI can’t use this',
            tone: 'bad',
            title: 'A profile that hides the facts',
            points: [
              'Category just says “Shop”',
              'Old phone number, no opening hours',
              'Three old reviews, none answered',
              'Website says “Welcome to our world of excellence”',
              'Prices only inside a photo',
            ],
          },
          {
            label: 'AI can use this',
            tone: 'good',
            title: 'A profile that answers the question',
            points: [
              'Category says exactly what you do',
              'Phone, hours and area are the same everywhere',
              'New reviews every month, each one answered',
              'Website says “AC repair in Sector 62, Noida. Open 9 am to 9 pm.”',
              'Services, prices and FAQs written as text',
            ],
          },
        ],
      },

      { t: 'h2', text: 'Mistakes and myths to avoid' },
      {
        t: 'ul',
        items: [
          '**“I need a special AI file or code.”** Google says its AI features need no special files, AI text files or special schema. Clear pages that Google can index are what matter. [Google](https://developers.google.com/search/docs/appearance/ai-features)',
          '**“I can pay ChatGPT to recommend me.”** Ads in ChatGPT are separate and labelled. OpenAI says ads do not influence the answers. [OpenAI](https://openai.com/index/our-approach-to-advertising-and-expanding-access/)',
          '**“Fake reviews will push me up.”** Google’s rules ban paid and fake reviews, and Google removes them. It can also act against the account. [Google policy](https://support.google.com/contributionpolicy/answer/7400114)',
          '**“Only big brands get named.”** For local questions, Google also looks at how close a business is to the customer. A small shop nearby can be named before a big brand far away. [Google](https://support.google.com/business/answer/7091)',
          '**“Once named, always named.”** Answers change with the question and the place. Keep your details fresh.',
        ],
      },

      { t: 'h2', text: 'How to know it is working' },
      {
        t: 'ul',
        items: [
          '**Monthly test:** the same three questions, on the same apps, with saved screenshots.',
          '**Google Search Console:** if you have a website, visits from Google’s AI features are counted in the Performance report, under “Web”. [Google](https://developers.google.com/search/docs/appearance/ai-features)',
          '**Ask every new customer:** “How did you find us?” Add “ChatGPT or another AI app” as a choice on your enquiry form.',
        ],
      },

      {
        t: 'cta',
        variant: 'end',
        title: 'Want to know what AI says about your business?',
        text: 'Book a free strategy call. We ask ChatGPT, Gemini and Google AI Mode the questions your customers ask, **show you who gets named**, and tell you what to fix first.',
        points: ['Google Business Profile checked with you', 'Plain words, no jargon', 'Instagram and website covered', 'Talk directly to the founders'],
        button: 'Book my free AI check',
        href: '/contact',
        whatsapp: 'Hi Social ScaleX, can you check what ChatGPT and Google AI say about my business?',
      },
      {
        t: 'p',
        text: 'To get found on Instagram as well, read [how to increase Instagram followers](/guides/increase-instagram-followers). If you are deciding where to spend on ads, read [Meta ads vs Google Ads](/guides/meta-ads-vs-google-ads), and see [real client numbers](/case-studies).',
      },
    ],
    faqs: [
      {
        q: 'How does ChatGPT decide which business to recommend?',
        a: 'OpenAI does not publish a formula. ChatGPT search may send searches to outside search engines such as Bing, uses the person’s rough location, and answers from the pages it finds. Clear website pages, a Bing listing and the same details everywhere give it facts to use.',
      },
      {
        q: 'How do I get my business into Google AI Mode and AI Overviews?',
        a: 'Google says no special trick is needed. Your pages must be indexed and allowed to show a snippet in Google Search, and your Google Business Profile should be complete and up to date.',
      },
      {
        q: 'Can I pay to be recommended by ChatGPT or Google AI?',
        a: 'Not in the normal answer. Google says you cannot pay for a better local ranking. Google and ChatGPT sell ads, but they are labelled and kept separate, and OpenAI says ads do not influence ChatGPT’s answers.',
      },
      {
        q: 'Do I need a website to be recommended by AI?',
        a: 'Not always. Google’s AI and Gemini can use your Google Business Profile and Maps listing. ChatGPT finds businesses through web search, so a simple website with clear text gives it more to read.',
      },
      {
        q: 'How long does it take to show up in AI answers?',
        a: 'No AI company gives a timeline. OpenAI says a robots.txt change takes about 24 hours to apply to ChatGPT search. Profile and website changes can take longer, so check again every month.',
      },
      {
        q: 'Does Google AI Mode work in Hindi?',
        a: 'Yes. Google offers AI Mode in India in English and Hindi, and added Bengali, Kannada, Malayalam, Marathi, Tamil, Telugu and Urdu in October 2025.',
      },
    ],
    howTo: {
      name: 'How to get your business recommended by ChatGPT, Gemini and Google AI Mode',
      tools: ['ChatGPT', 'Gemini', 'Google AI Mode', 'Google Business Profile', 'Bing Places for Business'],
      steps: [
        { name: 'Write down what AI says today', text: 'Ask ChatGPT, Gemini and Google AI Mode three questions your customers would ask, with your area name, and save screenshots.' },
        { name: 'Complete your Google Business Profile', text: 'Set the closest category, correct phone, address and hours, real photos, services and areas served, and verify the profile.' },
        { name: 'Get real reviews and reply', text: 'Ask every customer for a review, reply to each one, and never buy reviews or offer anything in return.' },
        { name: 'Put plain answers on your website', text: 'Write one page per service with your area, hours, phone and a short FAQ as text, not only in images.' },
        { name: 'Use the same details everywhere', text: 'Keep your name, phone and address identical on Google, Bing Places, Instagram, Facebook, directories and your website.' },
        { name: 'Let AI search robots read your website', text: 'Make sure robots.txt does not block Googlebot, Bingbot or OAI-SearchBot.' },
        { name: 'Get mentioned on other trusted websites', text: 'Get listed by your trade body, brands and suppliers, and share real news with local media and community pages.' },
      ],
    },
    sources: [S.chatgptIndia, S.aiModeIo, S.pewAi, S.sparktoro2026, S.aiModeIndia, S.aiModeLangs, S.gAiFeatures, S.gbpRanking, S.gbpHours, S.gReviews, S.geminiPlaces, S.chatgptSearch, S.oaiBots, S.bingPlacesQa, S.googleAiAds, S.chatgptAdsIndia, S.oaiAds, S.indexing],
    services: ['social-media-strategy', 'instagram-marketing'],
  },
  {
    slug: 'instagram-reels-views-dropped',
    title: 'Instagram Reels views dropped suddenly? A 10-minute diagnosis using Instagram’s own tools',
    metaTitle: 'Reels Views Dropped? 10-Minute Diagnosis (2026)',
    navTitle: 'Reels views dropped?',
    description:
      'Reels views fell overnight? Check Account Status, originality, skip rate and sends per reach in Instagram’s own tools, in order. Every step sourced. 2026.',
    summary:
      'When Reels views drop suddenly, find out first whether the account or the Reel is the problem. Account Status tells you whether Instagram will recommend your content to non-followers at all. If it can, the Reel’s own Insights show where it lost people: skip rate for the first three seconds, the retention chart for the middle, and sends and likes per reach for whether it travelled. Instagram publishes no secret formula, so diagnose with its tools, not guesses.',
    keyPoints: [
      '**Account Status first.** If your content can’t be recommended, nothing else matters until that’s fixed.',
      '**Then originality.** Watermarks, reposts and re-uploads are shown to fewer people.',
      '**Then the Reel’s numbers.** Skip rate, retention, and sends and likes per reach show what to fix.',
    ],
    published: '2026-10-31',
    updated: '2026-10-31',
    author: 'Social ScaleX team',
    authorIndex: 0,
    blocks: [
      { t: 'h2', text: 'First: is it your account or one Reel?' },
      {
        t: 'p',
        text: 'There are only two kinds of drop. Either Instagram has stopped recommending your **account** to people who don’t follow you, or a particular **Reel** didn’t hold attention. Instagram says most of what people see in Reels comes from accounts they don’t follow, so the first kind hits every post at once, while the second shows up Reel by Reel. Check in this order and stop at the first thing you find.',
      },
      {
        t: 'flow',
        label: 'The 10-minute check, in order',
        steps: [
          { title: 'Account Status', text: 'Can your content be recommended to non-followers? (2 minutes)' },
          { title: 'Originality and file', text: 'Watermark, repost, low quality, muted, mostly text? (2 minutes)' },
          { title: 'The Reel’s Insights', text: 'Skip rate, retention, followers vs non-followers. (3 minutes)' },
          { title: 'Compare fairly', text: 'Against your own recent Reels, over the same days. (2 minutes)' },
          { title: 'Test the fix', text: 'Post the next idea as a Trial Reel to non-followers. (1 minute)' },
        ],
      },

      { t: 'h2', text: 'Minutes 0–2: Check Account Status' },
      {
        t: 'p',
        text: 'Account Status is Instagram’s own answer to “am I being held back?”. For professional accounts it shows whether your content is eligible to be recommended to non-followers in Explore, Reels and Feed recommendations. If it isn’t, it shows examples of the posts or profile details that broke the Recommendations Guidelines. [TechCrunch, 7 Dec 2022](https://techcrunch.com/2022/12/07/instagrams-new-transparency-tools-will-tell-you-if-your-content-is-ineligible-to-be-recommended/)',
      },
      {
        t: 'ol',
        items: [
          'Open your profile, tap the menu, and find **Account Status** in Settings. (Instagram moves menu items between app versions; searching “Account Status” inside Settings is the quickest route.)',
          'Read the recommendations section. If it says your content can be recommended, the account is fine. Move to the next step.',
          'If it says your content can’t be recommended, open each example. Edit or delete it, or tell Instagram you disagree so the decision is reviewed again. [Account Status](https://help.instagram.com/653964212890722)',
        ],
      },
      {
        t: 'p',
        text: 'When an account loses recommendations, **none** of its content is shown to non-followers, though followers still see it. Instagram’s guidelines name the usual causes: unoriginal content with only minor edits, engagement bought or faked (including paid likes and comment networks), and recent Community Guidelines violations. [Recommendations guidelines](https://help.instagram.com/313829416281232/)',
      },
      {
        t: 'callout',
        tone: 'warn',
        title: 'Bought followers or likes in the past?',
        text: 'Instagram lists buying likes and similar tactics as a reason an account can stop being recommended. No new Reel will fix that; stop the service, and check Account Status again.',
      },

      { t: 'h2', text: 'Minutes 2–4: Check originality and the file itself' },
      {
        t: 'p',
        text: 'If the account is eligible, look at the Reels that dropped. Instagram says it shows fewer people Reels that are low-resolution or carry another app’s watermark, Reels that are muted or have borders, Reels that are mostly text, and Reels that were already posted on Instagram. [Instagram ranking explained](https://about.instagram.com/blog/announcements/instagram-ranking-explained)',
      },
      {
        t: 'ul',
        items: [
          '**Watermark from another app:** export clean. Instagram’s own Edits app exports without one. [Edits](https://creators.instagram.com/blog/edits-video-creation-app)',
          '**Re-uploaded content:** when Instagram finds copies, it recommends only the original. A border, subtitles, a watermark or a credit in the caption doesn’t make a repost original. [Instagram for Creators, 30 Apr 2026](https://creators.instagram.com/blog/rewarding-original-creators-on-instagram)',
          '**Stitched clips:** simply stitching clips together doesn’t count as material editing. Use the repost or share features for someone else’s video instead. [About original content](https://help.instagram.com/1800814370401535/)',
          '**An AI-generated person on the profile:** Instagram limits the reach of profiles that feature one without the AI-generated profile label. Using AI tools while editing does not need the label. [Instagram for Creators, 31 Aug 2026](https://creators.instagram.com/blog/ai-generated-profile-label/)',
        ],
      },

      { t: 'h2', text: 'Minutes 4–7: Read the Reel’s own Insights' },
      {
        t: 'p',
        text: 'Open the Reel, tap **View insights**, and read it top to bottom. Each number tells you where the Reel lost its audience.',
      },
      {
        t: 'table',
        caption: 'What each Insights number means and what to change',
        head: ['Number', 'What Instagram says it measures', 'If it’s worse than your usual', 'What to change'],
        rows: [
          ['Skip rate', 'Share of views that skipped the Reel in its first three seconds', 'The opening didn’t stop the scroll', 'Show the result, the product or the person in the first second. Cut any slow intro.'],
          ['Retention chart', 'Where viewers drop off; “the flatter the line, the more engaged your audience”', 'A sharp dip at one moment', 'Cut or tighten that moment. Move the payoff earlier.'],
          ['Views: followers vs non-followers', 'Who watched; views over time compared with your usual', 'Non-follower views collapsed', 'Recheck Account Status and originality. Then sends: non-followers are reached through Reels people share.'],
          ['Sends per reach', 'Shares divided by accounts reached (a signal Adam Mosseri named)', 'Few people sent it to anyone', 'Make it useful or specific enough to send: a price, a place, a how-to.'],
          ['Likes per reach', 'Likes divided by accounts reached (a signal Mosseri named)', 'Followers saw it but didn’t react', 'Your followers wanted something else. Look at your best recent Reel for the pattern.'],
        ],
        highlight: 4,
      },
      {
        t: 'p',
        text: 'Sources for the table: skip rate and the retention chart arrived in August 2025 [Social Media Today](https://www.socialmediatoday.com/news/instagram-adds-retention-insights-reels/758464/); the follower and non-follower split and “views over time” against your average arrived in January 2025 [TechCrunch](https://techcrunch.com/2025/01/29/instagram-gives-creators-more-insight-into-their-reels-performance); and Mosseri named **watch time, likes per reach and sends per reach** as the top signals in January 2025, adding that sends matter slightly more for reaching people who don’t follow you. [Social Media Today](https://www.socialmediatoday.com/news/instagram-shares-algorithm-insights-2025/738034/)',
      },
      {
        t: 'callout',
        tone: 'tip',
        title: 'The second-by-second like chart',
        text: 'Since August 2025, Reel insights can show when viewers tapped like, down to the second. The peak tells you which moment worked; open the next Reel with something like it. [Republic World, 5 Aug 2025](https://www.republicworld.com/tech/new-instagram-feature-lets-creators-see-exactly-when-viewers-like-their-reels)',
      },

      { t: 'h2', text: 'Minutes 7–9: Compare fairly before you panic' },
      {
        t: 'ul',
        items: [
          '**Compare with yourself.** Judge a Reel against your own recent Reels, not another account. Instagram’s “views over time” already shows it against your usual average.',
          '**Same days, same length.** Compare the same number of days and the same days of the week.',
          '**Know what a view is.** Since August 2024, Views is the primary metric across Reels, posts and Stories, and repeat views count. [Social Media Today, 7 Aug 2024](https://www.socialmediatoday.com/news/instagram-updates-metrics-to-focus-creators-on-views/723645/) A view count is not the same as people reached.',
          '**One Reel is a small sample.** Look at the last ten before deciding a format has stopped working.',
          '**Longer isn’t penalised.** Mosseri said Instagram weighs both the share of a video watched and the seconds watched, so long Reels aren’t punished for length. [Social Media Today, 25 Feb 2025](https://www.socialmediatoday.com/news/instagram-longer-video-watch-time-versus-completion-rate/740916/)',
        ],
      },

      { t: 'h2', text: 'Minute 10: Test the fix as a Trial Reel' },
      {
        t: 'p',
        text: 'Turn on the **Trial** toggle when posting. A Trial Reel is shown to non-followers first and doesn’t appear on your grid. After about 24 hours you see views, likes, comments and shares, compared with your previous trials, and you can let Instagram share it with followers automatically if it performs well in its first 72 hours. [Instagram for Creators, 10 Dec 2024](https://creators.instagram.com/blog/instagram-trial-reels) It is the cleanest way to test a new opening without risking your followers’ feed.',
      },

      { t: 'h2', text: 'What you can’t control, and shouldn’t chase' },
      {
        t: 'ul',
        items: [
          '**Viewers now steer their own Reels.** “Your Algorithm” lets people add or remove topics that shape their recommendations; Instagram expanded it to all English-speaking users on 14 January 2026. [The Keyword](https://www.thekeyword.co/news/instagram-expands-reels-algorithm-controls-to-all-english-speaking-users) A Reel that clearly fits one topic is easier to match to the people who asked for it.',
          '**People can tap “Not interested”.** Meta says its systems combine many predictions, some from behaviour and some from survey feedback, and no single one decides what anyone sees. [Meta, 29 Jun 2023](https://about.fb.com/news/2023/06/how-ai-ranks-content-on-facebook-and-instagram/)',
          '**Instagram tests changes on groups of users.** In September 2025 it began testing a Reels-first app with some users in India. [Meta](https://about.fb.com/news/2025/09/in-india-instagram-debuts-a-reels-first-experience-for-its-mobile-app/) A drop can coincide with a test you can’t see.',
          '**There are no published weights.** Instagram explains its predictions and signals, never a formula. Anyone selling the “exact algorithm” is guessing.',
        ],
      },

      { t: 'h2', text: 'Myths that waste your time' },
      {
        t: 'ul',
        items: [
          '**“It’s a shadowban.”** Account Status tells you plainly whether your content can be recommended. If it can, the cause is in the Reel.',
          '**“Use more hashtags.”** Instagram limited captions to five hashtags in December 2025 and said targeted beats many. [Social Samosa](https://www.socialsamosa.com/news-2/instagram-hashtags-five-per-post-10923075)',
          '**“Trending audio fixes reach.”** Instagram counts audio as one piece of information about a Reel. No Instagram source says a sound guarantees distribution.',
          '**“Delete and repost it.”** Instagram shows fewer people Reels already posted on Instagram, so a re-upload can do worse.',
        ],
      },

      {
        t: 'cta',
        variant: 'end',
        title: 'Want someone to run this check on your account?',
        text: 'We look at your Account Status, your last ten Reels and their Insights, and tell you **what to change first**. Free on the strategy call.',
        points: ['Original footage, shot in Delhi NCR', 'Read from your own Insights', 'No bought followers, ever'],
        button: 'See our Reels production service',
        href: '/services/reels-production',
        whatsapp: 'Hi Social ScaleX, my Reels views dropped. Can you check my account?',
      },
      {
        t: 'p',
        text: 'For how Reels are ranked in the first place, read [how the Reels algorithm works in 2026](/guides/instagram-reels-reach). To grow without risking your account, read [how to increase Instagram followers](/guides/increase-instagram-followers), and see [real client numbers](/case-studies).',
      },
    ],
    faqs: [
      {
        q: 'Why did my Instagram Reels views drop suddenly?',
        a: 'Either your account stopped being recommended to non-followers, or your recent Reels lost viewers early. Check Account Status first; if your content can be recommended, read each Reel’s skip rate, retention chart and sends per reach.',
      },
      {
        q: 'How do I know if Instagram is limiting my reach?',
        a: 'Open Account Status in Settings on a professional account. It says whether your content can be recommended to people who don’t follow you, shows examples if it can’t, and lets you ask for a review.',
      },
      {
        q: 'Is an Instagram shadowban real?',
        a: 'Instagram calls it not being eligible for recommendations, and it tells you in Account Status. When it applies, none of your content is shown to non-followers; followers still see it.',
      },
      {
        q: 'What is a good skip rate on Instagram Reels?',
        a: 'Instagram has published no benchmark. Skip rate is the share of views that skipped in the first three seconds; compare each Reel with your own recent Reels and work on the opening when it rises.',
      },
      {
        q: 'Do reposted or watermarked Reels get fewer views?',
        a: 'Yes. Instagram says it shows fewer people Reels with another app’s watermark and Reels already posted on Instagram, and it recommends only the original when it finds copies.',
      },
      {
        q: 'How long does it take for Reels views to recover?',
        a: 'Instagram gives no timeline. If Account Status flagged content, edit or remove it or request a review; if not, judge the fix over several new Reels, not one.',
      },
    ],
    howTo: {
      name: 'How to diagnose a sudden drop in Instagram Reels views',
      tools: ['Instagram app (professional account)', 'Account Status', 'Reel insights', 'Trial Reels'],
      steps: [
        { name: 'Check Account Status', text: 'In Settings, open Account Status and confirm your content can be recommended to non-followers. If not, edit, delete or request a review of the examples shown.' },
        { name: 'Check originality', text: 'Make sure the Reel is your own footage with no other app’s watermark, not a re-upload, not muted and not mostly text.' },
        { name: 'Read the skip rate', text: 'Open View insights on the Reel. A higher skip rate than usual means the first three seconds need work.' },
        { name: 'Read the retention chart', text: 'Find where the line drops sharply and tighten that moment.' },
        { name: 'Check sends and likes per reach', text: 'Divide shares and likes by accounts reached and compare with your last ten Reels.' },
        { name: 'Test with a Trial Reel', text: 'Post the improved version with the Trial toggle on so it is shown to non-followers first, then review it after 24 hours.' },
      ],
    },
    sources: [S.accountStatus, S.accountStatus2022, S.recGuidelines, S.rankingExplained, S.originality2026, S.originalHelp, S.aiLabel, S.edits, S.skipRate, S.reelsInsights2025, S.likeInsights, S.mosseri2025, S.watchSeconds, S.viewsMetric, S.trialReels, S.yourAlgorithmGlobal, S.metaAiRanking, S.indiaReelsFirst, S.hashtags],
    services: ['reels-production', 'instagram-marketing'],
  },
  {
    slug: 'boost-post-vs-click-to-whatsapp-ads',
    title: 'Boosting posts but no customers? Use click-to-WhatsApp ads instead',
    metaTitle: 'Boost Post Not Working? Try Click-to-WhatsApp Ads',
    navTitle: 'Boost post vs WhatsApp ads',
    description:
      'Boosted your post and got likes but no customers? See why, and how click-to-WhatsApp ads bring real enquiries from people near your shop. Simple 2026 guide.',
    summary:
      'Boosting gets you likes and profile visits, not customers, because you pay for exactly that. A click-to-WhatsApp ad opens a chat with your business in one tap. Show it only to people near your shop, ask one clear question, and reply fast. You get enquiries you can count, not just views.',
    keyPoints: [
      '**Pick “messages” as your goal**, not likes, reach or profile visits.',
      '**Show the ad only near your shop.** Drop a pin and use a small radius.',
      '**Reply on WhatsApp within minutes.** A slow reply loses the customer.',
    ],
    published: '2026-10-22',
    updated: '2026-10-22',
    author: 'Social ScaleX team',
    authorIndex: 0,
    blocks: [
      {
        t: 'verdict',
        sides: [
          {
            label: 'Avoid',
            tone: 'bad',
            title: 'A boost with the default goal',
            points: [
              'You pay for likes, reach or profile visits.',
              'People far from your shop often see it.',
              'Nobody gets a button to ask your price.',
              'You can’t tell who actually bought.',
            ],
          },
          {
            label: 'Pick',
            tone: 'good',
            title: 'A click-to-WhatsApp ad',
            points: [
              'You pay to start conversations.',
              'Only people near your shop see it.',
              'One tap opens a WhatsApp chat with you.',
              'You count chats, then sales.',
            ],
          },
        ],
      },
      { t: 'h2', text: 'Why boosting brings likes, not customers' },
      {
        t: 'p',
        text: 'When you tap **Boost**, Meta asks what you want. Most owners pick more profile visits or more engagement. Meta then finds the people most likely to tap and like, and it does that job well. Meta’s auction picks ads by your bid, **how likely each person is to take the action you chose**, and ad quality. [Meta: ad auctions](https://www.facebook.com/business/help/430291176997542) So the goal you choose decides who you get.',
      },
      {
        t: 'ul',
        items: [
          '**Wrong goal.** You paid for likes, so you got likes.',
          '**Wrong place.** Meta targets people “living in or recently in” an area, so someone just passing through can see your ad. [Jon Loomer](https://www.jonloomer.com/meta-ads-reach-people-outside-of-the-targeted-location/)',
          '**Too wide.** An option to reach more people “likely to respond” can stretch your ad beyond your area. Untick it unless tourists visit you.',
          '**Basic targeting.** Meta says boosts let you choose interests, age and gender, while Ads Manager gives you more advanced tools. [Meta: boost vs ads](https://www.facebook.com/business/help/317083072148603)',
          '**No next step.** A person who likes your post has no easy way to ask your price.',
        ],
      },
      {
        t: 'callout',
        tone: 'warn',
        title: 'Boosting isn’t the problem. The goal button is.',
        text: 'Instagram lets you boost a post with the **messages** goal and pick **WhatsApp** as the destination. That boost works as a click-to-WhatsApp ad. [Instagram for Business](https://business.instagram.com/blog/instagram-boost-ads-whatsapp-find-customers)',
      },
      { t: 'h2', text: 'What is a click-to-WhatsApp ad?' },
      {
        t: 'p',
        text: 'A click-to-WhatsApp ad shows on Facebook and Instagram. When someone taps it, a WhatsApp chat with your business opens. [WhatsApp Business](https://whatsappbusiness.com/products/ads-that-click-to-whatsapp/) The customer asks, you answer, and you keep their number for follow-ups.',
      },
      {
        t: 'flow',
        label: 'How a click-to-WhatsApp ad turns into a customer',
        steps: [
          { title: 'Sees your ad', text: 'Someone near your shop scrolls Instagram.' },
          { title: 'Taps “Send message”', text: 'WhatsApp opens with a ready question.' },
          { title: 'You reply fast', text: 'Share price, stock and location.' },
          { title: 'Visits or orders', text: 'The chat becomes a walk-in or a sale.' },
        ],
      },
      { t: 'h2', text: 'Boost vs click-to-WhatsApp ad: side by side' },
      {
        t: 'table',
        caption: 'A boosted post with the default goal compared with a click-to-WhatsApp ad',
        head: ['', 'Boost (default goal)', 'Click-to-WhatsApp ad'],
        highlight: 2,
        rows: [
          ['You pay for', 'Likes, reach or profile visits', 'Conversations'],
          ['Who sees it', 'A wide area, often far away', 'People near your shop'],
          ['What you get', 'Numbers on a screen', 'A chat and a phone number'],
          ['Follow-up', 'Not possible', 'Yes, on WhatsApp'],
          ['Setup', 'A few taps in the app', 'A few more steps in Ads Manager'],
          ['Best for', 'Getting your name seen', 'Enquiries, bookings and walk-ins'],
        ],
      },
      {
        t: 'cta',
        variant: 'mid',
        title: 'Want WhatsApp enquiries, not likes?',
        text: 'We set up click-to-WhatsApp ads for Delhi NCR businesses, **inside your own ad account**.',
        points: ['You see every rupee', 'Ads near your shop only', 'Weekly cost-per-chat report'],
        button: 'See our Meta ads service',
        href: '/services/meta-ads',
        whatsapp: 'Hi Social ScaleX, I want click-to-WhatsApp ads for my business.',
      },
      { t: 'h2', text: 'How to set up a click-to-WhatsApp ad in 6 steps' },
      {
        t: 'ol',
        items: [
          '**Connect WhatsApp.** Use a WhatsApp Business account on your shop number and connect it to your Facebook Page or business portfolio. [Meta: click to WhatsApp](https://www.facebook.com/business/help/447934475640650)',
          '**Pick a messages goal.** In Ads Manager, choose a goal that supports messages, then pick **WhatsApp** as where chats happen. From the Instagram app, boost with the **messages** goal instead.',
          '**Target your area.** Drop a pin on your shop and set a small radius, such as 3 to 5 km in a city. Untick “reach more people”.',
          '**Show the real thing.** Use a clear photo or Reel of your product or shop, not a stock image. Need good visuals? See our [product shoots](/services/product-shoots). Write one line with the offer and your area.',
          '**Write the first message for them.** For example: “Hi, is this in stock? What’s the price?” One tap, and they’ve asked.',
          '**Leave it alone for a week.** Meta says an ad set usually needs about 50 results in a week to leave the learning phase, and advises against editing it during learning. [Meta: learning phase](https://www.facebook.com/business/help/112167992830700)',
        ],
      },
      {
        t: 'callout',
        tone: 'tip',
        title: 'Reply in minutes, not hours',
        text: 'A person who taps your ad may be messaging other shops too. Set a **greeting message** and an **away message** in WhatsApp Business so nobody waits in silence. [WhatsApp Business app](https://whatsappbusiness.com/products/business-app/) Need more? See our [WhatsApp automation](/automation/whatsapp-automation) and [Instagram DM auto-reply](/automation/instagram-dm-auto-reply).',
      },
      { t: 'h2', text: 'How much should a local business spend?' },
      {
        t: 'p',
        text: 'Meta sets no fixed minimum in rupees; it depends on the country and goal. If you set a cost-per-result goal, Meta says your daily budget should be **at least five times** that goal. [Meta: ad budgets](https://www.facebook.com/business/help/203183363050448)',
      },
      {
        t: 'p',
        text: '**Simple example:** if one WhatsApp chat is worth ₹50 to you, set at least ₹250 a day. Then judge the ad by cost per chat and by how many chats turned into sales.',
      },
      { t: 'h2', text: 'Track chats and sales, not likes' },
      {
        t: 'ul',
        items: [
          '**Cost per conversation.** Ads Manager shows how many chats started and what each one cost.',
          '**Serious chats.** Count chats that asked about price, stock or timing.',
          '**Sales.** Ask every new customer, “How did you find us?” Write it down.',
          '**Your number:** sales ÷ ad spend. That tells you if the ad pays for itself.',
        ],
      },
      { t: 'h2', text: 'Which businesses should use it?' },
      {
        t: 'ul',
        items: [
          '**Shops** that sell phones, electronics, furniture, clothes or gifts.',
          '**Clinics, salons and gyms** that need bookings.',
          '**Coaching centres** that get questions before admission.',
          '**Restaurants and cloud kitchens** that take orders on WhatsApp.',
          '**Home services** such as AC repair, cleaning or interiors.',
        ],
      },
      {
        t: 'p',
        text: '**Not a fit yet:** if nobody can answer WhatsApp during working hours. Fix that first, or every rupee leaks.',
      },
      { t: 'h2', text: '5 mistakes that waste your money' },
      {
        t: 'ol',
        items: [
          'Choosing likes or profile visits when you want customers.',
          'Targeting a whole state when you serve one area.',
          'Using a stock photo instead of your real product or shop.',
          'Editing the ad every day, so it never finishes learning.',
          'Replying hours later, after the customer bought elsewhere.',
        ],
      },
      {
        t: 'cta',
        variant: 'end',
        title: 'Let us turn your ad spend into WhatsApp enquiries',
        text: 'Social ScaleX runs Meta ads for local businesses across Delhi, Noida and Gurugram. You keep the ad account; we do the work.',
        points: [
          'Click-to-WhatsApp ads near your shop',
          'Ad creative made for your product',
          'Pixel and Conversions API set up',
          'A/B tests and a weekly report',
        ],
        button: 'Book a free strategy call',
        href: '/contact',
        whatsapp: 'Hi Social ScaleX, I boosted posts but got no customers. Can you help with click-to-WhatsApp ads?',
      },
    ],
    faqs: [
      {
        q: 'Is boosting an Instagram post a waste of money?',
        a: 'Not always. A boost with the default goal buys likes, reach or profile visits, which rarely become customers for a local shop. A boost with the messages goal and WhatsApp as the destination can bring real enquiries.',
      },
      {
        q: 'Are click-to-WhatsApp ads better than boosting for a local business?',
        a: 'For enquiries and walk-ins, usually yes. You pay to start conversations with people near your shop, and you can follow up on WhatsApp. Boosting with the default goal pays for attention, not conversations.',
      },
      {
        q: 'What do I need to run click-to-WhatsApp ads?',
        a: 'A WhatsApp Business account on your business number, connected to your Facebook Page or Meta business portfolio, plus a payment method in Ads Manager.',
      },
      {
        q: 'Can I run a WhatsApp ad from my phone?',
        a: 'Yes. In the Instagram app, add your WhatsApp Business number to your profile, tap Boost on a post, choose the messages goal and pick WhatsApp as the destination.',
      },
      {
        q: 'How do I show my ad only to people near my shop?',
        a: 'In Ads Manager, drop a pin on your shop, set a small radius such as 3 to 5 km, and untick the option to reach more people likely to respond. Meta can still show ads to people who were recently in the area.',
      },
      {
        q: 'How much budget do click-to-WhatsApp ads need?',
        a: 'Meta has no fixed rupee minimum. If you set a cost-per-result goal, Meta advises a daily budget of at least five times that goal. Run the ad for about a week before you judge it.',
      },
    ],
    howTo: {
      name: 'How to set up a click-to-WhatsApp ad for a local business',
      tools: ['Meta Ads Manager', 'WhatsApp Business'],
      steps: [
        { name: 'Connect WhatsApp', text: 'Connect a WhatsApp Business account on your shop number to your Facebook Page or business portfolio.' },
        { name: 'Pick a messages goal', text: 'In Ads Manager, choose a goal that supports messages and pick WhatsApp as the destination.' },
        { name: 'Target your area', text: 'Drop a pin on your shop, set a small radius and untick the option to reach more people.' },
        { name: 'Show the real thing', text: 'Use a clear photo or Reel of your product or shop with one line about the offer and your area.' },
        { name: 'Write the first message', text: 'Prefill the question the customer sends, such as asking about price and stock.' },
        { name: 'Leave it for a week', text: 'Avoid edits so the ad set can finish the learning phase, then judge it by cost per chat and sales.' },
      ],
    },
    sources: [S.mBoostVsAds, S.igBoostWa, S.waCtwa, S.mCtwa, S.mAuction, S.loomerLocation, S.mLearning, S.mBudget, S.waBusinessApp],
    services: ['meta-ads', 'instagram-marketing'],
  },
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
    authorIndex: 0,
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
      {
        t: 'p',
        text: 'Want every Instagram DM answered, not only replies to comments? See [Instagram DM auto-reply](/automation/instagram-dm-auto-reply).',
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
      tools: ['Meta Business Suite (desktop)'],
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
    updated: '2026-10-15',
    author: 'Social ScaleX team',
    authorIndex: 0,
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
        text: 'prago.outdoors passed 6M views in 30 days with 35.3K followers, and saini_telecom__ passed 5M views in 30 days with 13.1K followers (15 Oct 2026): reach far beyond the following, driven by Reels. See the details in our [client results](/case-studies).',
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
    title: 'How the Instagram Reels algorithm works in 2026, and what it means for your business',
    metaTitle: 'Reels Algorithm 2026: What It Means for Business',
    navTitle: 'Reels algorithm 2026',
    description:
      'What Instagram has confirmed about ranking Reels in 2026, and how a business turns reach into customers: watch time, sends, originality. Dated and sourced.',
    summary:
      'Instagram ranks Reels by predicting what each viewer will do: share it, watch it to the end, like it or open its audio page. Adam Mosseri has named watch time, likes per reach and sends per reach as the signals that matter most. Originality rules, AI-profile labels and each viewer’s own topic settings now shape who sees a Reel too. Instagram publishes no formula and no signal weights.',
    keyPoints: [
      '**Hook people in the first three seconds.** Watch time is a top signal.',
      '**Make Reels people send to a friend.** Sends per reach is a top signal.',
      '**Post original footage.** Reposts and other apps’ watermarks lose reach.',
    ],
    published: '2026-09-30',
    updated: '2026-10-23',
    author: 'Social ScaleX team',
    authorIndex: 0,
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
      { t: 'p', text: 'For the step-by-step version with what each number means, see [Reels views dropped? A 10-minute diagnosis](/guides/instagram-reels-views-dropped).' },
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
      { t: 'h2', text: 'What this means for a business account' },
      {
        t: 'p',
        text: 'Reach only helps a business when the right people see the Reel and have a way to ask. Show your real product, shop or service, say your area, and end with one clear next step, such as “Message us on WhatsApp”.',
      },
      {
        t: 'p',
        text: 'Reels can reach far beyond your followers. prago.outdoors passed 6M views in 30 days with 35.3K followers, and saini_telecom__ passed 5M views in 30 days with 13.1K followers (15 Oct 2026). See the details in our [client results](/case-studies).',
      },
      {
        t: 'p',
        text: 'Views still aren’t customers. To turn reach into enquiries, read [why click-to-WhatsApp ads beat boosting](/guides/boost-post-vs-click-to-whatsapp-ads) and [how to grow followers without buying them](/guides/increase-instagram-followers).',
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
        q: 'Do Reels bring customers to a local business?',
        a: 'They can, when the Reel shows your real product or shop, names your area and gives one clear way to ask, such as a WhatsApp message. Views alone don’t pay; track enquiries and sales.',
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
    authorIndex: 0,
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
    authorIndex: 0,
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
    authorIndex: 0,
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
export function blockText(b: Block): string {
  switch (b.t) {
    case 'h2': case 'p': case 'quote': return b.text;
    case 'ul': case 'ol': return b.items.join(' ');
    case 'verdict': return b.sides.map((x) => [x.label, x.title, ...x.points].join(' ')).join(' ');
    case 'table': return [...b.head, ...b.rows.flat()].join(' ');
    case 'flow': return b.steps.map((x) => `${x.title} ${x.text}`).join(' ');
    case 'callout': return `${b.title} ${b.text}`;
    case 'cta': return `${b.title} ${b.text} ${b.points.join(' ')}`;
    case 'stats': return b.items.map((x) => `${x.value} ${x.text}`).join(' ');
    case 'chat': return `${b.question} ${b.intro} ${b.answer.map((x) => `${x.name} ${x.note}`).join(' ')} ${b.missing} ${b.caption}`;
    case 'sources': return `${b.center} ${b.items.map((x) => `${x.title} ${x.text} ${x.usedBy.join(' ')}`).join(' ')}`;
    case 'checklist': return b.items.map((x) => [x.title, x.text, ...(x.points ?? [])].join(' ')).join(' ');
    case 'workflow': return b.steps.map((x) => [x.title, x.text, ...x.points].join(' ')).join(' ');
    case 'usecases': return b.items.map((x) => [x.name, x.idea, x.hook, x.visuals, x.audience, x.cta].join(' ')).join(' ');
    case 'dmdemo': return [b.reel, ...b.comments.map((x) => `${x.text} ${x.reply}`), b.note].join(' ');
    case 'storyboard': return b.frames.map((x) => [x.title, x.visual, x.voice].join(' ')).join(' ');
    case 'figure': return b.caption;
    default: return '';
  }
}

export function guideWordCount(g: Guide): number {
  const text = [g.summary, ...(g.keyPoints ?? []), ...g.blocks.map(blockText)].join(' ');
  return text.split(/\s+/).filter(Boolean).length;
}
