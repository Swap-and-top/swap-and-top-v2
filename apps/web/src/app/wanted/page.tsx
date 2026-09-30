/**
 * Wanted. The server half: it reads the category from the address, e.g.
 * `/wanted?category=laptops`, so the first paint already shows that view
 * instead of flashing "All". The list itself is WantedFeed.
 */

import { parseFeedFilterParams } from '../../components/feedFilterParams';
import { WantedFeed } from './WantedFeed';

export default async function WantedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <WantedFeed initial={parseFeedFilterParams(await searchParams)} />;
}
