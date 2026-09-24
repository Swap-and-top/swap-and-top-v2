/**
 * Shops — a dealer's public identity and the scope of their console.
 *
 * Verified dealer is the only badge on the platform, because it asserts
 * something checkable: a registered business stands behind the listing.
 */

export interface Shop {
  id: string;
  slug: string;
  name: string;
  /** Two-letter mark used where a logo image is not available. */
  initials: string;
  description: string;
  location: string;
  openingHours: string;
  /** Business registration checked by staff. Paid, bundled with the console. */
  verified: boolean;
  stockCount: number;
  /** Deals both parties confirmed. Shown beside stock count on the shopfront. */
  confirmedDeals: number;
  replyHours: number;
  joinedAt: string;
}
