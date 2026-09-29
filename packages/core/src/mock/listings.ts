/**
 * Mock listings.
 *
 * Content mirrors the wireframe artboards. Prices, names and specifications are
 * placeholders.
 *
 * Two places where the wireframes disagreed with themselves have been
 * reconciled so the data is coherent across screens:
 *  1. The ThinkPad appears at $285 in the feed and $265 with a DROPPED badge in
 *     Saved. Here it is $265 with `previousPrice: 285`, so the drop shows
 *     everywhere rather than only on one screen.
 *  2. The shopfront's third trust statistic was the year joined; it is now the
 *     confirmed-deal count, which is the stronger signal.
 */

import type {
  Item,
  Listing,
  RequestListing,
  SaleListing,
  SwapListing,
} from '../types/listing';

const THIRTY_DAYS_ON = '2026-10-24';

/* ------------------------------------------------------------------ items - */

const itemThinkpad: Item = {
  id: 'i-thinkpad-t480',
  category: 'laptops',
  name: 'Lenovo ThinkPad T480',
  brand: 'Lenovo',
  model: 'T480',
  condition: 'good',
  defects: 'None noted',
  accessories: 'Charger included',
  specs: {
    processor: 'Core i5-8250U',
    ram: '16GB DDR4',
    storage: '256GB SSD',
    graphics: 'Integrated UHD',
    screen: '14in 1080p',
    battery: 'Holds 4h',
  },
  images: ['placeholder', 'placeholder', 'placeholder', 'placeholder'],
  wanted: false,
};

const itemMacbookAir: Item = {
  id: 'i-macbook-air-2017',
  category: 'laptops',
  name: 'MacBook Air 2017',
  brand: 'Apple',
  model: 'A1466',
  condition: 'good',
  defects: 'Small dent on lid, battery holds 3h',
  accessories: 'Charger included',
  specs: {
    processor: 'Core i5-5350U',
    ram: '8GB',
    storage: '128GB SSD',
  },
  images: ['placeholder', 'placeholder'],
  wanted: false,
};

const itemWantedI7: Item = {
  id: 'i-wanted-i7',
  category: 'laptops',
  name: 'Any Core i7',
  specs: { processor: 'Core i7', ram: '16GB', storage: '500GB SSD' },
  images: [],
  wanted: true,
};

const itemWantedRtx: Item = {
  id: 'i-wanted-rtx-3060',
  category: 'parts',
  name: 'RTX 3060 or Better',
  specs: { partType: 'Graphics card', capacity: '12GB' },
  images: [],
  wanted: true,
};

/* --------------------------------------------------------------- listings - */

const thinkpad: SaleListing = {
  id: 'l-thinkpad-t480',
  slug: 'lenovo-thinkpad-t480-i5-16gb-256gb-harare-a3f9',
  type: 'sale',
  ownerId: 'u-kopje',
  shopId: 's-kopje',
  category: 'laptops',
  title: 'Lenovo ThinkPad T480',
  location: 'Harare CBD',
  status: 'live',
  createdAt: '2026-09-24',
  expiresAt: THIRTY_DAYS_ON,
  postedLabel: '2 hours ago',
  contactChannels: ['whatsapp', 'call'],
  allowDealerOffers: true,
  viewCount: 218,
  revealCount: 9,
  promotion: 'organic',
  tags: [],
  item: itemThinkpad,
  price: 265,
  previousPrice: 285,
  negotiable: true,
  stockCount: 4,
};

const macbookSwap: SwapListing = {
  id: 'l-macbook-swap',
  slug: 'macbook-air-2017-for-i7-16gb-mt-pleasant-7c21',
  type: 'swap',
  ownerId: 'u-tarisai',
  category: 'laptops',
  title: 'MacBook Air 2017 for any i7, 16GB, SSD',
  location: 'Mt Pleasant',
  status: 'live',
  createdAt: '2026-09-23',
  expiresAt: THIRTY_DAYS_ON,
  postedLabel: '5h ago',
  contactChannels: ['whatsapp', 'call'],
  allowDealerOffers: true,
  viewCount: 7,
  revealCount: 4,
  promotion: 'organic',
  tags: [],
  has: itemMacbookAir,
  wants: itemWantedI7,
  /** The poster adds cash — trading up, which is the large majority of swaps. */
  cashDirection: 'i-add',
  cashAmount: 240,
  offerCount: 2,
};

const dellLatitude: SaleListing = {
  id: 'l-dell-latitude-7490',
  slug: 'dell-latitude-7490-i7-16gb-512gb-harare-b118',
  type: 'sale',
  ownerId: 'u-kopje',
  shopId: 's-kopje',
  category: 'laptops',
  title: 'Dell Latitude 7490',
  location: 'Harare CBD',
  status: 'live',
  createdAt: '2026-09-20',
  expiresAt: THIRTY_DAYS_ON,
  postedLabel: '4 days ago',
  contactChannels: ['whatsapp', 'call'],
  allowDealerOffers: true,
  viewCount: 742,
  revealCount: 31,
  /** Paid placement. Always labelled in the feed, never sorted to the top. */
  promotion: 'sponsored',
  tags: [],
  item: {
    id: 'i-dell-latitude-7490',
    category: 'laptops',
    name: 'Dell Latitude 7490',
    brand: 'Dell',
    model: '7490',
    condition: 'good',
    defects: 'None noted',
    accessories: 'Charger included',
    specs: {
      processor: 'Core i7-8650U',
      ram: '16GB DDR4',
      storage: '512GB SSD',
      graphics: 'Integrated UHD',
      screen: '14in 1080p',
      battery: 'Holds 5h',
    },
    images: ['placeholder', 'placeholder', 'placeholder'],
    wanted: false,
  },
  price: 410,
  negotiable: false,
  stockCount: 2,
};

const hpEliteBook: SaleListing = {
  id: 'l-hp-elitebook-840',
  slug: 'hp-elitebook-840-g5-i5-8gb-256gb-harare-d402',
  type: 'sale',
  ownerId: 'u-kopje',
  shopId: 's-kopje',
  category: 'laptops',
  title: 'HP EliteBook 840 G5',
  location: 'Harare CBD',
  status: 'live',
  createdAt: '2026-09-18',
  expiresAt: THIRTY_DAYS_ON,
  postedLabel: '6 days ago',
  contactChannels: ['whatsapp', 'call'],
  allowDealerOffers: true,
  viewCount: 164,
  revealCount: 6,
  promotion: 'organic',
  tags: [],
  item: {
    id: 'i-hp-elitebook-840',
    category: 'laptops',
    name: 'HP EliteBook 840 G5',
    brand: 'HP',
    model: '840 G5',
    condition: 'good',
    specs: {
      processor: 'Core i5-8350U',
      ram: '8GB',
      storage: '256GB SSD',
      screen: '14in 1080p',
    },
    images: ['placeholder', 'placeholder'],
    wanted: false,
  },
  price: 255,
  negotiable: true,
  stockCount: 1,
};

const rx580: SaleListing = {
  id: 'l-rx-580',
  slug: 'sapphire-rx-580-8gb-harare-9f30',
  type: 'sale',
  ownerId: 'u-kopje',
  shopId: 's-kopje',
  category: 'parts',
  title: 'Sapphire RX 580 8GB',
  location: 'Harare CBD',
  status: 'sold',
  createdAt: '2026-09-10',
  expiresAt: THIRTY_DAYS_ON,
  postedLabel: 'Sold 3 days ago',
  contactChannels: ['whatsapp'],
  allowDealerOffers: true,
  viewCount: 389,
  revealCount: 14,
  promotion: 'organic',
  tags: [],
  item: {
    id: 'i-rx-580',
    category: 'parts',
    name: 'Sapphire RX 580 8GB',
    brand: 'Sapphire',
    condition: 'good',
    defects: 'Tested, no box',
    specs: { partType: 'Graphics card', capacity: '8GB' },
    images: ['placeholder'],
    wanted: false,
  },
  price: 95,
  negotiable: false,
};

const redmiNote12: SaleListing = {
  id: 'l-redmi-note-12',
  slug: 'redmi-note-12-128gb-harare-5a77',
  type: 'sale',
  ownerId: 'u-kopje',
  shopId: 's-kopje',
  category: 'phones',
  title: 'Redmi Note 12',
  location: 'Harare CBD',
  status: 'live',
  createdAt: '2026-09-21',
  expiresAt: THIRTY_DAYS_ON,
  postedLabel: '3 days ago',
  contactChannels: ['whatsapp', 'call'],
  allowDealerOffers: true,
  viewCount: 97,
  revealCount: 4,
  promotion: 'organic',
  tags: [],
  item: {
    id: 'i-redmi-note-12',
    category: 'phones',
    name: 'Redmi Note 12',
    brand: 'Xiaomi',
    condition: 'like-new',
    specs: { storage: '128GB', ram: '6GB', battery: '94%' },
    images: ['placeholder', 'placeholder'],
    wanted: false,
  },
  price: 160,
  negotiable: true,
  stockCount: 3,
};

const eliteDeskDraft: SaleListing = {
  id: 'l-hp-elitedesk-800',
  slug: 'hp-elitedesk-800-g3-draft',
  type: 'sale',
  ownerId: 'u-kopje',
  shopId: 's-kopje',
  category: 'desktops',
  title: 'HP EliteDesk 800 G3',
  location: 'Harare CBD',
  status: 'draft',
  createdAt: '2026-09-24',
  expiresAt: THIRTY_DAYS_ON,
  postedLabel: 'Draft',
  contactChannels: ['whatsapp'],
  allowDealerOffers: true,
  viewCount: 0,
  revealCount: 0,
  promotion: 'organic',
  tags: [],
  item: {
    id: 'i-hp-elitedesk-800',
    category: 'desktops',
    name: 'HP EliteDesk 800 G3',
    brand: 'HP',
    specs: {},
    images: [],
    wanted: false,
  },
  price: 0,
  negotiable: true,
};

const hpProBook: SaleListing = {
  id: 'l-hp-probook-450',
  slug: 'hp-probook-450-i3-8gb-avondale-2b6c',
  type: 'sale',
  ownerId: 'u-rudo',
  category: 'laptops',
  title: 'HP ProBook 450',
  location: 'Avondale',
  status: 'live',
  createdAt: '2026-09-24',
  expiresAt: THIRTY_DAYS_ON,
  postedLabel: '3h ago',
  contactChannels: ['whatsapp', 'sms'],
  allowDealerOffers: true,
  viewCount: 41,
  revealCount: 2,
  promotion: 'organic',
  tags: [],
  item: {
    id: 'i-hp-probook-450',
    category: 'laptops',
    name: 'HP ProBook 450',
    brand: 'HP',
    condition: 'fair',
    defects: 'Scuffed palm rest',
    specs: { processor: 'Core i3', ram: '8GB', storage: '500GB HDD' },
    images: ['placeholder', 'placeholder'],
    wanted: false,
  },
  price: 120,
  negotiable: true,
};

const gtxSwap: SwapListing = {
  id: 'l-gtx-1650-swap',
  slug: 'gtx-1650-for-rtx-3060-belvedere-c845',
  type: 'swap',
  ownerId: 'u-blessing',
  category: 'parts',
  title: 'GTX 1650 for an RTX 3060',
  location: 'Belvedere',
  status: 'live',
  createdAt: '2026-09-24',
  expiresAt: THIRTY_DAYS_ON,
  postedLabel: '8h ago',
  contactChannels: ['whatsapp'],
  allowDealerOffers: true,
  viewCount: 33,
  revealCount: 1,
  promotion: 'organic',
  tags: [],
  has: {
    id: 'i-gtx-1650',
    category: 'parts',
    name: 'GTX 1650 4GB',
    brand: 'MSI',
    condition: 'good',
    specs: { partType: 'Graphics card', capacity: '4GB' },
    images: ['placeholder'],
    wanted: false,
  },
  wants: {
    id: 'i-wanted-rtx-3060-swap',
    category: 'parts',
    name: 'RTX 3060 12GB',
    specs: { partType: 'Graphics card', capacity: '12GB' },
    images: [],
    wanted: true,
  },
  cashDirection: 'i-add',
  cashAmount: 150,
  offerCount: 1,
};

const galaxySwap: SwapListing = {
  id: 'l-galaxy-swap',
  slug: 'galaxy-a34-for-pixel-7a-mt-pleasant-e903',
  type: 'swap',
  ownerId: 'u-rudo',
  category: 'phones',
  title: 'Galaxy A34 for a Pixel 7a',
  location: 'Avondale',
  status: 'live',
  createdAt: '2026-09-22',
  expiresAt: THIRTY_DAYS_ON,
  postedLabel: '2 days ago',
  contactChannels: ['whatsapp', 'call'],
  allowDealerOffers: false,
  viewCount: 58,
  revealCount: 3,
  promotion: 'organic',
  tags: [],
  has: {
    id: 'i-galaxy-a34',
    category: 'phones',
    name: 'Galaxy A34 128GB',
    brand: 'Samsung',
    condition: 'like-new',
    specs: { storage: '128GB', ram: '6GB', battery: '97%' },
    images: ['placeholder', 'placeholder'],
    wanted: false,
  },
  wants: {
    id: 'i-wanted-pixel-7a',
    category: 'phones',
    name: 'Pixel 7a',
    specs: { storage: '128GB' },
    images: [],
    wanted: true,
  },
  /** Trading down — the poster wants cash back. The minority direction. */
  cashDirection: 'they-add',
  cashAmount: 60,
  offerCount: 0,
};

const rtxWanted: RequestListing = {
  id: 'l-rtx-wanted',
  slug: 'wanted-rtx-3060-12gb-harare-4d12',
  type: 'request',
  ownerId: 'u-blessing',
  category: 'parts',
  title: 'RTX 3060 or Better',
  location: 'Harare',
  status: 'live',
  createdAt: '2026-09-24',
  expiresAt: THIRTY_DAYS_ON,
  postedLabel: '1h ago',
  contactChannels: ['whatsapp', 'call'],
  allowDealerOffers: true,
  viewCount: 22,
  revealCount: 0,
  promotion: 'organic',
  tags: [],
  wants: itemWantedRtx,
  budget: 260,
  responseCount: 4,
};

const ps5Wanted: RequestListing = {
  id: 'l-ps5-controller-wanted',
  slug: 'wanted-ps5-controller-mt-pleasant-8e55',
  type: 'request',
  ownerId: 'u-tarisai',
  category: 'consoles',
  title: 'PS5 controller, working drift-free',
  location: 'Mt Pleasant',
  status: 'live',
  createdAt: '2026-09-23',
  expiresAt: THIRTY_DAYS_ON,
  postedLabel: 'Yesterday',
  contactChannels: ['whatsapp'],
  allowDealerOffers: true,
  viewCount: 14,
  revealCount: 0,
  promotion: 'organic',
  tags: [],
  wants: {
    id: 'i-wanted-ps5-controller',
    category: 'consoles',
    name: 'PS5 DualSense controller',
    specs: { partType: 'Controller' },
    images: [],
    wanted: true,
  },
  budget: 45,
  responseCount: 1,
};

const redmiWanted: RequestListing = {
  id: 'l-redmi-wanted',
  slug: 'wanted-redmi-note-12-128gb-mt-pleasant-1a08',
  type: 'request',
  ownerId: 'u-rudo',
  category: 'phones',
  title: 'Redmi Note 12, 128GB',
  location: 'Mt Pleasant',
  status: 'live',
  createdAt: '2026-09-23',
  expiresAt: THIRTY_DAYS_ON,
  postedLabel: 'Yesterday',
  contactChannels: ['whatsapp', 'call'],
  allowDealerOffers: true,
  viewCount: 19,
  revealCount: 0,
  promotion: 'organic',
  tags: [],
  wants: {
    id: 'i-wanted-redmi-note-12',
    category: 'phones',
    name: 'Redmi Note 12',
    specs: { storage: '128GB' },
    images: [],
    wanted: true,
  },
  budget: 170,
  responseCount: 2,
};

const cadDesktopWanted: RequestListing = {
  id: 'l-cad-desktop-wanted',
  slug: 'wanted-desktop-for-cad-belvedere-6b71',
  type: 'request',
  ownerId: 'u-blessing',
  category: 'desktops',
  title: 'A desktop for CAD work',
  location: 'Belvedere',
  status: 'live',
  createdAt: '2026-09-23',
  expiresAt: THIRTY_DAYS_ON,
  postedLabel: 'Yesterday',
  contactChannels: ['whatsapp', 'call'],
  allowDealerOffers: true,
  viewCount: 27,
  revealCount: 0,
  promotion: 'organic',
  tags: [],
  wants: {
    id: 'i-wanted-cad-desktop',
    category: 'desktops',
    name: 'Desktop, 32GB, dedicated graphics',
    specs: { ram: '32GB', graphics: 'Dedicated' },
    images: [],
    wanted: true,
  },
  budget: 600,
  /** A request with a trade-in attached is swap demand — the higher-value lead. */
  tradeIn: {
    id: 'i-tradein-i3-tower',
    category: 'desktops',
    name: 'i3 tower, 8GB, 1TB HDD',
    condition: 'fair',
    specs: { processor: 'Core i3', ram: '8GB', storage: '1TB HDD' },
    images: ['placeholder'],
    wanted: false,
  },
  responseCount: 3,
};

const sodimmWanted: RequestListing = {
  id: 'l-sodimm-wanted',
  slug: 'wanted-16gb-ddr4-sodimm-pair-avondale-3f19',
  type: 'request',
  ownerId: 'u-rudo',
  category: 'parts',
  title: '16GB DDR4 SODIMM pair',
  location: 'Avondale',
  status: 'live',
  createdAt: '2026-09-22',
  expiresAt: THIRTY_DAYS_ON,
  postedLabel: '2 days ago',
  contactChannels: ['whatsapp'],
  allowDealerOffers: true,
  viewCount: 11,
  revealCount: 0,
  promotion: 'organic',
  tags: [],
  wants: {
    id: 'i-wanted-sodimm',
    category: 'parts',
    name: '16GB DDR4 SODIMM pair',
    specs: { partType: 'Memory', capacity: '2 × 8GB' },
    images: [],
    wanted: true,
  },
  budget: 55,
  responseCount: 0,
};

/* ------------------------------------------------------------ collections - */

/** Newest first, which is the feed's default order. */
export const mockListings: Listing[] = [
  rtxWanted,
  thinkpad,
  hpProBook,
  macbookSwap,
  gtxSwap,
  redmiNote12,
  dellLatitude,
  galaxySwap,
  ps5Wanted,
  redmiWanted,
  cadDesktopWanted,
  hpEliteBook,
  sodimmWanted,
  rx580,
  eliteDeskDraft,
];

/** Only live listings appear in the feed, in search, or in the sitemap. */
export const liveListings: Listing[] = mockListings.filter(
  (l) => l.status === 'live',
);

export function getListing(id: string): Listing | undefined {
  return mockListings.find((l) => l.id === id);
}

export function getListingBySlug(slug: string): Listing | undefined {
  return mockListings.find((l) => l.slug === slug);
}

/** A dealer's stock is their listings, seen from the console side. */
export function getShopListings(shopId: string): Listing[] {
  return mockListings.filter((l) => l.shopId === shopId);
}

export const featuredSlugs = {
  dealerSale: thinkpad.slug,
  swap: macbookSwap.slug,
  userSale: hpProBook.slug,
  request: rtxWanted.slug,
} as const;
