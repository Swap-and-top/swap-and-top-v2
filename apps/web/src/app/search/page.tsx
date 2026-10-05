/**
 * Search results. The server half: it reads the search from the address, e.g.
 * `/search?q=thinkpad&category=laptops&type=sale`, so the first paint already shows the
 * results. The page itself is SearchResults.
 *
 * Searching happens in the full-screen search (SearchEntry); this page is
 * where "View all results", a suggested term or Enter lands.
 */

import { parseSearchQuery } from '../../components/searchParams';
import { SearchResults } from './SearchResults';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const search = parseSearchQuery(await searchParams);
  // A new search is a new page: the key resets the filters it starts from.
  return <SearchResults key={search.q} initial={search} />;
}
