/**
 * Wanted. The server half: it reads the category from the address, e.g.
 * `/wanted?category=laptops`, so the first paint already shows that view
 * instead of flashing "All". The list itself is WantedFeed.
 */

import { parseFeedFilterParams } from '../../components/feedFilterParams';
import { WantedFeed } from './WantedFeed';
import { slowDown } from '@/components/slowDown';
import { feedListings } from '@/lib/listings';

/** On Vercel, near the database (see app/api/[[...route]]/route.ts). */
export const preferredRegion = 'dub1';

export default async function WantedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await slowDown();
  const listings = await feedListings();
  return <WantedFeed initial={parseFeedFilterParams(await searchParams)} listings={listings} />;
}
