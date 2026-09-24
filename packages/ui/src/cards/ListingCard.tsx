/**
 * ListingCard — picks the right card for a listing's type.
 *
 * One entry point, so a feed can render a mixed stream without switching on
 * type at every call site.
 *
 * Scaffold note: the seller and shop are resolved here from the mock data in
 * `@snt/core`. When listings come from the API they will arrive with their owner
 * embedded, and these two lookups become props.
 */

import type { Listing } from '@snt/core';
import { getShop, getUser } from '@snt/core';
import { SaleCard } from './SaleCard';
import { SwapCard } from './SwapCard';
import { WantedCard } from './WantedCard';

export function ListingCard({ listing }: { listing: Listing }) {
  const owner = getUser(listing.ownerId);
  const shop = getShop(listing.shopId);

  switch (listing.type) {
    case 'sale':
      return <SaleCard listing={listing} shop={shop} seller={owner} />;

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
