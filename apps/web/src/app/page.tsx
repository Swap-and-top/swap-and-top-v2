/**
 * Browse — the feed. The server half: it reads the filters from the address,
 * e.g. `/?type=swap&category=phones`, so the first paint already shows that
 * view instead of flashing "All". The feed itself is BrowseFeed.
 */

import { parseFeedFilterParams } from '../components/feedFilterParams';
import { BrowseFeed } from './BrowseFeed';

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <BrowseFeed initial={parseFeedFilterParams(await searchParams)} />;
}
