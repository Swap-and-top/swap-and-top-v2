/**
 * The stock list as the dealer has asked to see it: searched, filtered and
 * ordered. Shared by the page and the Filters sheet, which counts what its
 * choices would show before they are applied.
 */

import type { Listing, StockFilters } from '@snt/core';

const priceOf = (listing: Listing) =>
  listing.type === 'sale' ? listing.price : 0;

export function filterStock(
  stock: Listing[],
  filters: StockFilters,
  query: string,
): Listing[] {
  const words = query.trim().toLowerCase();

  const shown = stock.filter((listing) => {
    if (words && !listing.title.toLowerCase().includes(words)) return false;
    if (filters.status !== 'all' && listing.status !== filters.status) {
      return false;
    }
    if (filters.category !== 'all' && listing.category !== filters.category) {
      return false;
    }
    if (
      filters.swapsOnly &&
      !(listing.type === 'sale' && listing.acceptsSwaps)
    ) {
      return false;
    }
    return true;
  });

  switch (filters.sort) {
    case 'price-low':
      return [...shown].sort((a, b) => priceOf(a) - priceOf(b));
    case 'price-high':
      return [...shown].sort((a, b) => priceOf(b) - priceOf(a));
    case 'reveals':
      return [...shown].sort((a, b) => b.revealCount - a.revealCount);
    default:
      // As the shop holds them: what it added last comes first.
      return shown;
  }
}

/** How many filters differ from none, for the count on the button. */
export function filtersInUse(filters: StockFilters): number {
  return (
    Number(filters.status !== 'all') +
    Number(filters.category !== 'all') +
    Number(filters.sort !== 'newest') +
    Number(filters.swapsOnly)
  );
}
