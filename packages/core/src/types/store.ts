/**
 * Stores — a store's public identity and the scope of their console.
 *
 * Verified store is the only badge on the platform, because it asserts
 * something checkable: a registered business stands behind the listing.
 */

import type { Category } from './listing';

export interface Store {
  id: string;
  slug: string;
  name: string;
  /** Two-letter mark used where a logo image is not available. */
  initials: string;
  /** Its logo's address, when it has one. */
  logo?: string;
  description: string;
  location: string;
  openingHours: string;
  /** What it sells, as its owner chose: its page's tabs. Empty: every one. */
  categories?: Category[];
  /** Its name before a rename, shown as "formerly …" for 30 days. */
  formerName?: string;
  /** Business registration checked by staff. Paid, bundled with the console. */
  verified: boolean;
  stockCount: number;
  /** Deals both parties confirmed. Shown beside stock count on the storefront. */
  confirmedDeals: number;
  replyHours: number;
  joinedAt: string;
}
