// ─────────────────────────────────────────────────────────────────────
// Areas we serve: one hub (/areas) and one page per city.
//
// Google's spam policies name "pages targeted at specific regions or cities
// that funnel users to one page" and "substantially similar pages" as doorway
// abuse. So there is no page per pin code or per locality. Every locality and
// pin code is real, crawlable text on its city page, and each city page
// carries its own local notes, hubs and questions.
// ─────────────────────────────────────────────────────────────────────
import type { Faq } from './content';
import { PIN_GROUPS, type CityKey } from './areas-data';

export { PIN_GROUPS, type CityKey };

export interface Hub {
  /** Exactly as it appears in the source list, so the pin can be checked. */
  name: string;
  pin: string;
  note: string;
}

export interface City {
  key: CityKey;
  slug: string;
  name: string;
  /** Name in running text where it differs (e.g. "Noida and Greater Noida"). */
  longName: string;
  state: string;
  district: string;
  std: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  lede: string;
  local: string[];
  hubs: Hub[];
  picks: { slug: string; kind: 'service' | 'automation'; why: string }[];
  faqs: Faq[];
  source: { label: string; url: string };
  nameNote?: string;
}

const DM_DELHI = {
  label: 'Office of the District Magistrate, New Delhi: STD & PIN Codes',
  url: 'https://dmnewdelhi.delhi.gov.in/std-pin-codes/',
};
const INDIA_POST = {
  label: 'India Post post-office directory',
  url: 'https://www.indiapost.gov.in/',
};

export const CITIES: City[] = [
  {
    key: 'delhi',
    slug: 'delhi',
    name: 'Delhi',
    longName: 'Delhi',
    state: 'Delhi',
    district: 'National Capital Territory of Delhi',
    std: '011',
    metaTitle: 'Social Media Agency in Delhi: All Pin Codes',
    metaDescription:
      'Social media marketing across Delhi: all 410 areas and 77 pin codes we serve, from Connaught Place 110001 to 110096. On-location shoots, Reels and ads.',
    h1: 'Social media marketing agency in Delhi, area by area',
    lede:
      'We are a Delhi team. We shoot at your shop, clinic, café, studio or office anywhere in the city, and run Instagram, Facebook, YouTube and ads for it. Find your area and pin code below.',
    local: [
      'Delhi shops by market. People follow and search by the market’s name, such as Lajpat Nagar, Kamla Nagar or Karol Bagh, more than by “Delhi”. So we name your market and the landmark beside you in Reels, captions and your profile, and tag the location on every post.',
      'Ads can reach a radius around your door instead of the whole city. A store in Rajouri Garden doesn’t need to pay to reach people across the Yamuna who will never visit. Meta and Google both let us draw that radius.',
      'Shoot days are planned around market hours and traffic. Morning slots before a market fills up give clean footage of the store; evening slots show it busy, which is often the better ad.',
    ],
    hubs: [
      { name: 'Connaught Place', pin: '110001', note: 'Offices, restaurants and flagship stores' },
      { name: 'Karol Bagh', pin: '110005', note: 'Retail, jewellery and wedding shopping' },
      { name: 'Chandni Chowk', pin: '110006', note: 'Wholesale and old-city trade' },
      { name: 'Kamla Nagar', pin: '110007', note: 'Student market by Delhi University' },
      { name: 'Hauz Khas', pin: '110016', note: 'Cafés, studios and boutiques' },
      { name: 'Nehru Place', pin: '110019', note: 'IT and electronics trade' },
      { name: 'Lajpat Nagar', pin: '110024', note: 'Fashion and home shopping' },
      { name: 'Rajouri Garden', pin: '110027', note: 'West Delhi retail and dining' },
      { name: 'Greater Kailash', pin: '110048', note: 'Premium retail and restaurants' },
      { name: 'Laxmi Nagar Market', pin: '110092', note: 'East Delhi coaching and retail' },
    ],
    picks: [
      { slug: 'instagram-marketing', kind: 'service', why: 'Your Instagram run day to day, with your market and landmark in every post.' },
      { slug: 'product-shoots', kind: 'service', why: 'Photos and Reels shot at your store, not stock images.' },
      { slug: 'instagram-comment-to-dm', kind: 'automation', why: 'Price and location sent by DM when someone comments, even after hours.' },
    ],
    faqs: [
      {
        q: 'Which areas of Delhi do you cover?',
        a: 'All of them. This page lists every area and pin code in the District Magistrate’s official STD and PIN code list, 410 entries across 77 pin codes from 110001 to 110096. If your area isn’t named, you are still covered.',
      },
      {
        q: 'Can you shoot at my shop in a crowded market?',
        a: 'Yes. We plan the slot around your market’s busy hours, keep the kit small and shoot on phones or a compact camera so we don’t block the shop. Reels shot in the real store usually beat studio footage for local businesses.',
      },
      {
        q: 'Can my ads reach only people near my shop?',
        a: 'Yes. Meta and Google Ads both target a radius around an address. We usually start with a few kilometres around the store and widen it only if cost per enquiry stays healthy.',
      },
    ],
    source: DM_DELHI,
  },
  {
    key: 'noida',
    slug: 'noida',
    name: 'Noida',
    longName: 'Noida and Greater Noida',
    state: 'Uttar Pradesh',
    district: 'Gautam Buddh Nagar',
    std: '0120',
    metaTitle: 'Social Media Agency in Noida & Greater Noida',
    metaDescription:
      'Social media marketing in Noida and Greater Noida: every pin code we serve in Gautam Buddh Nagar, from Sector 18 to Knowledge Park. Shoots, Reels and ads.',
    h1: 'Social media marketing agency in Noida and Greater Noida',
    lede:
      'We work across Gautam Buddh Nagar, from the Sector 18 market to Greater Noida’s campuses. We shoot on location and run Instagram, Facebook, YouTube and ads for Noida businesses. Your pin code is below.',
    local: [
      'Noida is laid out in numbered sectors, and people use them: “café in Sector 18”, “salon in Sector 62”. Say the sector in captions, in your bio and in the location tag, so a search and a local audience can place you.',
      'Greater Noida’s Knowledge Park has several universities, so for coaching, food and rentals the audience is young, on Instagram and price-aware. For them, short Reels with the price on screen and a DM or WhatsApp button work well.',
      'Noida’s office sectors fill on weekdays and empty on weekends. Timing posts and ads to those hours, and aiming them at offices or at residential sectors, is one of the first things we test.',
    ],
    hubs: [
      { name: 'Noida Sector 16', pin: '201301', note: 'Film City and the Sector 18 market nearby' },
      { name: 'Noida Sector 62', pin: '201309', note: 'IT offices and institutes' },
      { name: 'Noida Sector 37', pin: '201303', note: 'Residential and retail around the Botanical Garden' },
      { name: 'Knowledge Park-I', pin: '201310', note: 'Greater Noida colleges' },
      { name: 'Amity University', pin: '201313', note: 'Campus and student housing' },
      { name: 'Dadri', pin: '203207', note: 'Town market west of Greater Noida' },
    ],
    picks: [
      { slug: 'reels-production', kind: 'service', why: 'Short, sector-specific Reels for a young, mobile audience.' },
      { slug: 'meta-ads', kind: 'service', why: 'Ads aimed at office or residential sectors, tested by time of day.' },
      { slug: 'whatsapp-automation', kind: 'automation', why: 'Instant WhatsApp replies for course, menu and price questions.' },
    ],
    faqs: [
      {
        q: 'Do you cover Greater Noida and the Yamuna Expressway side?',
        a: 'Yes. The list on this page covers India Post’s pin codes for Gautam Buddh Nagar, from Noida’s sectors to Greater Noida, Dadri and Jewar.',
      },
      {
        q: 'What works on Instagram for a Noida café or coaching centre?',
        a: 'Reels that name the sector and show the price, a pinned post with directions, and an easy way to ask: a DM keyword or a WhatsApp button. Location tags on every post help people nearby find you.',
      },
    ],
    source: INDIA_POST,
  },
  {
    key: 'gurugram',
    slug: 'gurugram',
    name: 'Gurugram',
    longName: 'Gurugram',
    state: 'Haryana',
    district: 'Gurugram',
    std: '0124',
    metaTitle: 'Social Media Marketing Agency in Gurugram',
    metaDescription:
      'Social media marketing in Gurugram (Gurgaon): every pin code we serve, from DLF phases and Sohna Road to Manesar. On-location shoots, Reels and Meta ads.',
    h1: 'Social media marketing agency in Gurugram (Gurgaon)',
    lede:
      'We shoot and run social media for Gurugram businesses, from DLF’s phases to Sohna and Manesar: restaurants, studios, clinics, D2C brands and B2B firms. Find your pin code below.',
    local: [
      'Gurugram has a large office-going, English-first audience with money to spend and little time. For them the content has to be quick and clear: the offer in the first second, subtitles on every Reel, and booking or ordering in one tap.',
      'The city runs on its roads and phases: Golf Course Road, Sohna Road, DLF Phase 1 to 5. People use those names to search and to decide whether you are close enough, so we use them in captions and location tags.',
      'Manesar and the industrial sectors are mostly B2B. For a manufacturer, a factory-floor shoot and a YouTube walkthrough do more than trend Reels, with Google Search ads for the products buyers look up.',
    ],
    hubs: [
      { name: 'DLF Ph-II', pin: '122008', note: 'DLF Phase 2 offices and dining' },
      { name: 'Galleria DLF-IV', pin: '122009', note: 'Galleria market and cafés' },
      { name: 'Gurgaon Sector 56', pin: '122011', note: 'Golf Course Extension belt' },
      { name: 'Palam Vihar', pin: '122017', note: 'Residential and neighbourhood retail' },
      { name: 'Sohna', pin: '122103', note: 'Sohna town and Sohna Road’s southern end' },
      { name: 'IMT Manesar', pin: '122052', note: 'Industrial and B2B' },
    ],
    picks: [
      { slug: 'reels-production', kind: 'service', why: 'Fast, subtitled Reels for a busy, English-first audience.' },
      { slug: 'meta-ads', kind: 'service', why: 'Ads by road, phase or office cluster, with booking in one tap.' },
      { slug: 'youtube-management', kind: 'service', why: 'Product and factory walkthroughs for Manesar’s B2B firms.' },
    ],
    faqs: [
      {
        q: 'Is it Gurugram or Gurgaon?',
        a: 'Both. The city was renamed Gurugram in 2016, but India Post’s post-office names still say Gurgaon, so both appear on this page. People search both, and we use whichever your customers use.',
      },
      {
        q: 'Do you work with B2B companies in Manesar?',
        a: 'Yes. For B2B we lean on product and factory shoots, YouTube walkthroughs and Google Search ads, and measure enquiries rather than likes.',
      },
    ],
    source: INDIA_POST,
    nameNote: 'India Post still names these post offices “Gurgaon”.',
  },
  {
    key: 'ghaziabad',
    slug: 'ghaziabad',
    name: 'Ghaziabad',
    longName: 'Ghaziabad',
    state: 'Uttar Pradesh',
    district: 'Ghaziabad',
    std: '0120',
    metaTitle: 'Social Media Marketing Agency in Ghaziabad',
    metaDescription:
      'Social media marketing in Ghaziabad: every pin code we serve, from Vaishali, Kaushambi and Raj Nagar Extension to Modinagar. Shoots, Reels and ads.',
    h1: 'Social media marketing agency in Ghaziabad',
    lede:
      'From Vaishali and Kaushambi on the Delhi border to Raj Nagar Extension, Modinagar and Loni, we shoot and run social media for Ghaziabad businesses. Your pin code is below.',
    local: [
      'Much of Ghaziabad lives in large housing societies. For gyms, salons, tutors, bakeries and clinics, that means a dense local audience in a small radius. Ads aimed at a few societies around you often beat city-wide campaigns.',
      'Hindi and English sit side by side here. Captions and on-screen text in the mix your customers speak, rather than formal English, usually get more comments and saves.',
      'Sahibabad’s industrial area and the older city markets have a different buyer from the societies. We plan these as separate audiences instead of one Ghaziabad campaign.',
    ],
    hubs: [
      { name: 'Vaishali', pin: '201019', note: 'Delhi-border residential and retail' },
      { name: 'Kaushambi', pin: '201012', note: 'Offices, malls and housing' },
      { name: 'Raj Nagar Extension', pin: '201017', note: 'Newer high-rise societies' },
      { name: 'Crossing Republik', pin: '201016', note: 'Township off NH-9' },
      { name: 'I.E.Sahibabad', pin: '201010', note: 'Sahibabad industrial area' },
      { name: 'Modi Nagar', pin: '201204', note: 'Town market on the Meerut road' },
    ],
    picks: [
      { slug: 'meta-ads', kind: 'service', why: 'Ads aimed at the societies around your shop, not the whole city.' },
      { slug: 'instagram-marketing', kind: 'service', why: 'Day-to-day Instagram in the Hindi-English mix your customers use.' },
      { slug: 'instagram-dm-auto-reply', kind: 'automation', why: 'Instant answers to “price?” and “timings?” in your DMs.' },
    ],
    faqs: [
      {
        q: 'Do you cover Indirapuram and the trans-Hindon side?',
        a: 'Yes. India Post has no post office named Indirapuram (it falls under pin code 201014), so the name isn’t in the list below, but we work there and across the trans-Hindon area, including Vaishali, Kaushambi and Vasundhara.',
      },
      {
        q: 'Can I run ads to only a few housing societies?',
        a: 'Close to it. Meta and Google target a radius around a point, so we set a tight radius around your shop or around the societies you want. We can’t target a single building, and we won’t claim to.',
      },
    ],
    source: INDIA_POST,
  },
  {
    key: 'faridabad',
    slug: 'faridabad',
    name: 'Faridabad',
    longName: 'Faridabad',
    state: 'Haryana',
    district: 'Faridabad',
    std: '0129',
    metaTitle: 'Social Media Marketing Agency in Faridabad',
    metaDescription:
      'Social media marketing in Faridabad: every pin code we serve, from NIT and the sector markets to Ballabgarh and Surajkund. Shoots, Reels, YouTube and ads.',
    h1: 'Social media marketing agency in Faridabad',
    lede:
      'We shoot and run social media for Faridabad businesses, from the NIT and sector markets to Ballabgarh, Surajkund and the industrial areas. Find your pin code below.',
    local: [
      'Faridabad is one of Haryana’s biggest industrial cities. Many businesses here sell to other businesses, so the content that works is proof: the machine running, the batch packed, the plant on a working day, on YouTube and in Google Search ads.',
      'The sector markets and showrooms sell to local families. For them we use Reels shot in the store, offers with a clear end date, and a WhatsApp button so people can ask before they drive over.',
      'Surajkund’s annual crafts fair and the city’s events bring seasonal crowds. Planning content and ads around those dates is cheaper than competing on reach all year.',
    ],
    hubs: [
      { name: 'Faridabad NIT', pin: '121001', note: 'NIT markets and industrial units' },
      { name: 'Faridabad Sector 16', pin: '121002', note: 'Sector markets and offices' },
      { name: 'Faridabad Sector 15', pin: '121007', note: 'Central sector retail' },
      { name: 'Surajkund Faridabad', pin: '121009', note: 'Surajkund and the hotel belt' },
      { name: 'Ballabgarh', pin: '121004', note: 'Town market and industry' },
      { name: 'Sec-91', pin: '121013', note: 'Greater Faridabad’s newer sectors' },
    ],
    picks: [
      { slug: 'youtube-management', kind: 'service', why: 'Product and process videos that B2B buyers actually watch.' },
      { slug: 'google-ads', kind: 'service', why: 'Search ads on the product names buyers type.' },
      { slug: 'whatsapp-automation', kind: 'automation', why: 'Quotes and catalogues sent on WhatsApp, day or night.' },
    ],
    faqs: [
      {
        q: 'Do you work with manufacturers and B2B firms in Faridabad?',
        a: 'Yes. For B2B we focus on factory and product shoots, YouTube, Google Search ads and WhatsApp follow-up, and we measure enquiries and quotes, not likes.',
      },
      {
        q: 'Do you cover Ballabgarh and Greater Faridabad?',
        a: 'Yes. The list below covers India Post’s pin codes in Faridabad district, including Ballabgarh, Tigaon and the newer sectors of Greater Faridabad.',
      },
    ],
    source: INDIA_POST,
  },
];

export function getCity(slug: string): City | undefined {
  return CITIES.find((c) => c.slug === slug);
}

export function cityStats(key: CityKey) {
  const groups = PIN_GROUPS[key];
  return {
    pins: groups.length,
    places: groups.reduce((n, [, names]) => n + names.length, 0),
    first: groups[0]![0],
    last: groups[groups.length - 1]![0],
  };
}

/** Flat list for the checker: [name, pin, city slug]. */
export type AreaEntry = [string, string, string];

export function allEntries(): AreaEntry[] {
  return CITIES.flatMap((c) =>
    PIN_GROUPS[c.key].flatMap(([pin, names]) => names.map((n): AreaEntry => [n, pin, c.slug])),
  );
}

export const AREAS_FAQS: Faq[] = [
  {
    q: 'Is there a social media agency near me in Delhi NCR?',
    a: 'Yes. We are based in Delhi NCR and shoot on location across Delhi, Noida, Gurugram, Ghaziabad and Faridabad. Type your area or pin code in the checker above to see it on our list.',
  },
  {
    q: 'My area isn’t on the list. Can you still work with me?',
    a: 'Very likely. The lists come from official directories, which name post offices rather than every colony or society. If you are anywhere in Delhi NCR, we cover you. Outside it, page management, ads and automation run remotely across India.',
  },
  {
    q: 'Why don’t you have a page for every area?',
    a: 'Because hundreds of near-identical pages don’t help you choose an agency, and Google treats them as spam. One page per city, with every area and pin code on it, is easier to use and honest about what we do.',
  },
];
