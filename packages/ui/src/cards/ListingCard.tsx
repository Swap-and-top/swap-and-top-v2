/**
 * ListingCard — picks the right card for a listing's type.
 *
 * One entry point, so a feed can render a mixed stream without switching on
 * type at every call site.
 *
 * The seller and store come with the listing from the API (`posterOf`,
 * `storeOf` in @snt/core); the mock listings fall back to the mock users.
 */

import type { Listing } from '@snt/core';
import { posterOf, storeOf } from '@snt/core';
import { SaleCard } from './SaleCard';
import { SwapCard } from './SwapCard';
import { WantedCard } from './WantedCard';

export function ListingCard({ listing }: { listing: Listing }) {
  const owner = posterOf(listing);
  const store = storeOf(listing);

  switch (listing.type) {
    case 'sale':
      return <SaleCard listing={listing} store={store} seller={owner} />;

    case 'swap':
      return <SwapCard listing={listing} seller={owner} />;

    case 'request':
      return <WantedCard listing={listing} requester={owner} />;

    case 'auction':
      /**
       * Auctions are specified but deferred — docs/features/auctions.md. They
       * need a crowd, and an auction closing with zero bids tells everyone the
       * place is empty. The type exists so the model does not need a migration.
       */
      return null;

    default:
      return null;
  }
}
