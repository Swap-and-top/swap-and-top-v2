/**
 * Mock store statistics for the console's Stats page.
 *
 * Made up, but the same every time: each figure comes from a fixed seed, so
 * the server and the browser draw the same graph and nothing jumps on load.
 * The shape is plausible for a small phone and laptop store: views in the
 * hundreds a day, a few number reveals, an offer or two, a deal every few
 * days; busiest in the working day and at the weekend, growing over the year.
 * Real figures come from the reveal, offer and deal records once there is a
 * backend (see docs/product/store-console.md).
 */

import { getStoreListings } from './listings';

export type StatsRange = 'today' | 'week' | 'month' | 'year' | 'all';
export type StatsMetric = 'views' | 'reveals' | 'offers' | 'deals';

export type StatsFigures = Record<StatsMetric, number>;

/** One bar of the graph: an hour, a day or a month. */
export interface StatsBucket extends StatsFigures {
  /** In full, for the readout: "Tue 21 Oct", "2pm", "Oct 2026". */
  label: string;
  /** Under the bar, where there is room: "Tue", "2pm", "Oct". */
  short: string;
}

export interface StoreStats {
  buckets: StatsBucket[];
  totals: StatsFigures;
  /** The same length of time just before, for the change. */
  previous: StatsFigures;
  /** What the change is measured against: "yesterday", "last week". */
  against: string;
}

/** "Today" in the mock: Monday 26 October 2026, at 3pm. */
const NOW = { year: 2026, month: 9, day: 26, hour: 15 };

/** When the store joined, for All time: January 2025. */
const JOINED = { year: 2025, month: 0 };

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** A number from 0 to 1, always the same for the same seed. */
function noise(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** A typical day's figures, before shape and noise. */
const DAY: StatsFigures = { views: 150, reveals: 6, offers: 1.6, deals: 0.45 };

/** How busy an hour is: quiet at night, a peak around lunch and the
    evening. Sums to about 1 over a day. */
function hourShare(hour: number): number {
  const shape = [
    0.2, 0.1, 0.05, 0.05, 0.05, 0.15, 0.4, 0.9, 1.4, 1.6, 1.7, 1.8,
    2.0, 1.9, 1.7, 1.6, 1.6, 1.7, 1.9, 2.0, 1.7, 1.2, 0.8, 0.4,
  ];
  return (shape[hour] ?? 1) / 26.6;
}

/** A day's figures, `back` days before today. Weekends busier, a slow rise
    over time, and noise. */
function dayFigures(back: number): StatsFigures {
  const date = new Date(NOW.year, NOW.month, NOW.day - back);
  const weekend = date.getDay() === 0 || date.getDay() === 6 ? 1.25 : 1;
  const growth = 1 - Math.min(back, 600) / 1500;
  const seed = date.getFullYear() * 400 + date.getMonth() * 32 + date.getDate();
  return figuresFrom(DAY, weekend * growth, seed);
}

/** Scales a base by a factor, with each figure's own noise. Not rounded:
    small figures (a deal every few days) would round away to nothing. */
function figuresFrom(base: StatsFigures, factor: number, seed: number): StatsFigures {
  const vary = (value: number, i: number) =>
    value * factor * (0.6 + noise(seed + i * 101) * 0.8);
  return {
    views: vary(base.views, 1),
    reveals: vary(base.reveals, 2),
    offers: vary(base.offers, 3),
    deals: vary(base.deals, 4),
  };
}

/**
 * Whole numbers for a bar, keeping small figures honest: 0.3 of a deal is
 * a deal three times in ten, by the seed, so over many bars they add up to
 * what they should.
 */
function whole(figures: StatsFigures, seed: number): StatsFigures {
  const round = (value: number, i: number) => {
    const floor = Math.floor(value);
    return floor + (noise(seed + i * 37) < value - floor ? 1 : 0);
  };
  return {
    views: round(figures.views, 1),
    reveals: round(figures.reveals, 2),
    offers: round(figures.offers, 3),
    deals: round(figures.deals, 4),
  };
}

function sum(buckets: StatsFigures[]): StatsFigures {
  return buckets.reduce(
    (total, b) => ({
      views: total.views + b.views,
      reveals: total.reveals + b.reveals,
      offers: total.offers + b.offers,
      deals: total.deals + b.deals,
    }),
    { views: 0, reveals: 0, offers: 0, deals: 0 },
  );
}

function hourLabel(hour: number): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}${hour < 12 ? 'am' : 'pm'}`;
}

/** Today by the hour, so far. */
function hours(dayBack: number, upTo: number): StatsBucket[] {
  const day = dayFigures(dayBack);
  return Array.from({ length: upTo + 1 }, (_, hour) => {
    const seed = dayBack * 100 + hour;
    const f = whole(figuresFrom(day, hourShare(hour), seed), seed);
    return { ...f, label: hourLabel(hour), short: hourLabel(hour) };
  });
}

/** The last `count` days, oldest first. */
function days(count: number, offset = 0): StatsBucket[] {
  return Array.from({ length: count }, (_, i) => {
    const back = offset + count - 1 - i;
    const date = new Date(NOW.year, NOW.month, NOW.day - back);
    const day = DAYS[date.getDay()]!;
    const month = MONTHS[date.getMonth()]!;
    return {
      ...whole(dayFigures(back), back * 7 + 3),
      label: `${day} ${date.getDate()} ${month}`,
      short: count <= 7 ? day : String(date.getDate()),
    };
  });
}

/** A whole month's figures, from its days. */
function monthFigures(year: number, month: number): StatsFigures {
  const today = new Date(NOW.year, NOW.month, NOW.day);
  const length = new Date(year, month + 1, 0).getDate();
  const list: StatsFigures[] = [];
  for (let d = 1; d <= length; d++) {
    const date = new Date(year, month, d);
    if (date > today) break;
    const back = Math.round((today.getTime() - date.getTime()) / 86_400_000);
    list.push(dayFigures(back));
  }
  return sum(list);
}

/** Months, oldest first, from a start to this month. */
function months(from: { year: number; month: number }): StatsBucket[] {
  const list: StatsBucket[] = [];
  const date = new Date(from.year, from.month, 1);
  const end = new Date(NOW.year, NOW.month, 1);
  while (date <= end) {
    const y = date.getFullYear();
    const m = date.getMonth();
    const raw = monthFigures(y, m);
    list.push({
      ...whole(raw, y * 12 + m),
      label: `${MONTHS[m]} ${y}`,
      short: MONTHS[m]!,
    });
    date.setMonth(m + 1);
  }
  return list;
}

/** The store's figures for a stretch of time, as a graph and in total. */
export function storeStatsFor(range: StatsRange): StoreStats {
  switch (range) {
    case 'today': {
      const buckets = hours(0, NOW.hour);
      return {
        buckets,
        totals: sum(buckets),
        // Yesterday to the same hour, so the two are fair to compare.
        previous: sum(hours(1, NOW.hour)),
        against: 'yesterday',
      };
    }
    case 'week': {
      const buckets = days(7);
      return {
        buckets,
        totals: sum(buckets),
        previous: sum(days(7, 7)),
        against: 'last week',
      };
    }
    case 'month': {
      const buckets = days(30);
      return {
        buckets,
        totals: sum(buckets),
        previous: sum(days(30, 30)),
        against: 'the 30 days before',
      };
    }
    case 'year': {
      const start = { year: NOW.year - 1, month: NOW.month + 1 };
      const buckets = months(start);
      const before = months({ year: NOW.year - 2, month: NOW.month + 1 }).slice(
        0,
        12,
      );
      return {
        buckets,
        totals: sum(buckets),
        previous: sum(before),
        against: 'the year before',
      };
    }
    default: {
      const buckets = months(JOINED);
      return {
        buckets,
        totals: sum(buckets),
        // Nothing came before the store joined: no change to show.
        previous: sum(buckets),
        against: '',
      };
    }
  }
}

/** One item's figures over the same stretch of time. */
export interface ItemStats extends StatsFigures {
  listingId: string;
  name: string;
}

/**
 * The store's items, best first by reveals: each takes a share of the store's
 * figures in line with how much interest it draws.
 */
export function bestItemsFor(storeId: string, totals: StatsFigures): ItemStats[] {
  const stock = getStoreListings(storeId).filter(
    (listing) => listing.type === 'sale' && listing.status === 'live',
  );
  const weight = (i: number, reveals: number) =>
    Math.max(reveals, 1) * (0.7 + noise(i + 7) * 0.6);
  const weights = stock.map((listing, i) => weight(i, listing.revealCount));
  const all = weights.reduce((a, b) => a + b, 0) || 1;
  return stock
    .map((listing, i) => {
      const share = weights[i]! / all;
      return {
        listingId: listing.id,
        name: listing.type === 'sale' ? listing.item.name : listing.title,
        views: Math.round(totals.views * share),
        reveals: Math.round(totals.reveals * share),
        offers: Math.round(totals.offers * share),
        deals: Math.round(totals.deals * share),
      };
    })
    .sort((a, b) => b.reveals - a.reveals || b.views - a.views);
}

/** How people reached the store, and how sponsored listings did. */
export const mockLeadSources = {
  /** Of reveals: WhatsApp, the rest calls. */
  whatsappShare: 0.68,
  /** Reveals on sponsored listings against the rest. */
  sponsoredLift: '3.4x',
};
