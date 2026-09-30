// ─────────────────────────────────────────────────────────────────────
// Guides: long-form answers to what our buyers search before hiring.
//
// Every platform fact below is taken from the official source listed in the
// guide's `sources`, checked on 2026-09-30. Inline markup is deliberately
// tiny: **bold** and [text](url). See src/components/site/Rich.tsx.
// ─────────────────────────────────────────────────────────────────────

export type Block =
  | { t: 'h2'; text: string }
  | { t: 'p'; text: string }
  | { t: 'ul'; items: string[] }
  | { t: 'ol'; items: string[] }
  | { t: 'quote'; text: string; cite: string };

export interface Source {
  label: string;
  url: string;
}

export interface Guide {
  slug: string;
  title: string;
  metaTitle: string;
  description: string;
  /** Answer-first summary shown under the H1. */
  summary: string;
  published: string;
  updated: string;
  author: string;
  blocks: Block[];
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
} satisfies Record<string, Source>;

export const GUIDES: Guide[] = [
  {
    slug: 'instagram-reels-reach',
    title: 'How Instagram decides who sees your Reels',
    metaTitle: 'How the Instagram Reels Algorithm Works (2026)',
    description:
      'What Instagram and Adam Mosseri have said about ranking Reels: watch time, sends and likes per reach, originality rules and Trial Reels. Sourced and practical.',
    summary:
      'Instagram ranks Reels by predicting how likely each viewer is to share a Reel, watch it to the end, like it and open its audio page. In 2025 Adam Mosseri named watch time, likes per reach and sends per reach as the three signals that matter most. Reposted, watermarked or unoriginal content is shown less, and accounts that mostly post it stop being recommended.',
    published: '2026-09-30',
    updated: '2026-09-30',
    author: 'Social ScaleX team',
    blocks: [
      { t: 'h2', text: 'What Instagram says it predicts for every Reel' },
      {
        t: 'p',
        text: 'Instagram does not use one algorithm. In its own explainer it describes separate ranking systems for Feed, Stories, Explore and Reels, each built around what people do in that part of the app. For Reels, the goal is entertainment, and most of what you see comes from accounts you don’t follow. [Instagram ranking explained](https://about.instagram.com/blog/announcements/instagram-ranking-explained)',
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
      { t: 'h2', text: 'The three numbers Adam Mosseri says to watch' },
      {
        t: 'p',
        text: 'In January 2025, Instagram’s head Adam Mosseri said the top three ranking signals are watch time, likes and sends, and told creators to track **average watch time, likes per reach and sends per reach**. He added that likes matter slightly more for content shown to your followers, and sends matter slightly more for content shown to people who don’t follow you. [Social Media Today, 22 Jan 2025](https://www.socialmediatoday.com/news/instagram-shares-algorithm-insights-2025/738034/)',
      },
      {
        t: 'p',
        text: 'Longer Reels are not punished for it. Mosseri said in February 2025 that Instagram looks at both the percentage of a video watched and the number of seconds watched, so it doesn’t penalise longer videos. [Social Media Today, 25 Feb 2025](https://www.socialmediatoday.com/news/instagram-longer-video-watch-time-versus-completion-rate/740916/) He repeated the follower and non-follower split in May 2026. [Social Media Today, 26 May 2026](https://www.socialmediatoday.com/news/instagram-engagement-rates-provide-insight-into-reach/821170/)',
      },
      {
        t: 'p',
        text: 'The practical reading: a Reel that people send to a friend is the one that travels to new audiences. A Reel your followers like keeps your existing audience engaged. Both depend on people watching past the first few seconds.',
      },
      { t: 'h2', text: 'What gets a Reel shown to fewer people' },
      {
        t: 'p',
        text: 'Instagram says it makes some Reels less visible: low-resolution or watermarked Reels, Reels that are muted or have borders, Reels that are mostly text, and Reels already posted on Instagram. [Instagram ranking explained](https://about.instagram.com/blog/announcements/instagram-ranking-explained)',
      },
      {
        t: 'p',
        text: 'Originality has become the biggest rule. Since April 2024, when Instagram finds two or more identical pieces of content it recommends only the original, and accounts that post unoriginal content ten or more times in 30 days are removed from recommendations. [Social Media Today, 30 Apr 2024](https://www.socialmediatoday.com/news/instagram-algorithm-prioritize-original-emerging-creators/714777/) In April 2026 the rule was extended from Reels to photos and carousels. Adding a border, a watermark, subtitles or a credit in the caption does not make a repost original. [Instagram for Creators, 30 Apr 2026](https://creators.instagram.com/blog/rewarding-original-creators-on-instagram)',
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
          'Plan the first seconds before the shoot. If people don’t keep watching, nothing else in this guide matters.',
          'Make things people want to send: useful, local and specific beats generic.',
          'Track likes per reach and sends per reach per Reel, not follower count.',
          'Shoot original footage and export clean files. No reposts, no other app’s watermark.',
          'Test new formats as Trial Reels before they reach the whole following.',
          'Never buy likes, follows or comments. It costs the whole account its recommendations.',
        ],
      },
    ],
    sources: [S.rankingExplained, S.mosseri2025, S.watchSeconds, S.engagementRates, S.originality2024, S.originality2026, S.originalHelp, S.recGuidelines, S.accountStatus, S.trialReels, S.threeMinutes, S.edits, S.indexing],
    services: ['reels-production', 'instagram-marketing'],
  },
  {
    slug: 'meta-ads-vs-google-ads',
    title: 'Meta ads or Google Ads: which should a local business start with?',
    metaTitle: 'Meta Ads vs Google Ads for Local Businesses',
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
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

/** Plain text of a guide's blocks, for word counts and schema. */
export function guideWordCount(g: Guide): number {
  const text = [g.summary, ...g.blocks.map((b) => ('text' in b ? b.text : b.items.join(' ')))].join(' ');
  return text.split(/\s+/).filter(Boolean).length;
}
