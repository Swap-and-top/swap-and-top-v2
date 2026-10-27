/**
 * Browse — the feed. Built ahead of time from the database's live listings
 * and kept for a minute (`revalidate`), so it is served instantly from the
 * host's cache: going back to the feed, even after a reload, needs no wait
 * and shows no skeleton. A new listing shows within a minute.
 *
 * The filters in the address, e.g. `/?type=swap&category=phones`, are read in
 * the browser (see useFeedFiltersInUrl). So that "All" never flashes before
 * the right view, the script below, which runs before anything is drawn,
 * holds the filters and the list hidden while the address names a filter;
 * reading it lifts that, a moment later.
 */

import { BrowseFeed } from './BrowseFeed';
import { slowDown } from '@/components/slowDown';
import { feedListings } from '@/lib/listings';

export const revalidate = 60;

// Held at most a few seconds, so a phone slow to start the page still sees
// the feed, whatever happens.
const HOLD_WHILE_FILTERED = `if(/[?&](type|category)=/.test(location.search)){var d=document.documentElement.dataset;d.feedFilters='pending';setTimeout(function(){delete d.feedFilters},3000)}`;

export default async function BrowsePage() {
  await slowDown();
  const listings = await feedListings();
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: HOLD_WHILE_FILTERED }} />
      <BrowseFeed initial={{}} listings={listings} />
    </>
  );
}
