'use client';

/**
 * OfferButton — "I have this", wherever it appears: on a Wanted card, and at
 * the foot of a swap or a request.
 *
 * It opens the offer sheet. Once you have offered, it says so and opens the
 * sheet on your offer instead. On your own listing there is nothing to offer,
 * so it becomes the way to the offers you have received.
 */

import { useState } from 'react';
import {
  CURRENT_USER_ID,
  myOfferOn,
  offersOn,
  useOfferStore,
  type DemandListing,
} from '@snt/core';
import { Button, ButtonLink, type ButtonSize } from '../primitives/Button';
import { OfferSheet } from './OfferSheet';

export function OfferButton({
  listing,
  label = 'I have this',
  size,
  block,
  className,
}: {
  listing: DemandListing;
  label?: string;
  size?: ButtonSize;
  block?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const offers = useOfferStore((store) => store.offers);

  if (listing.ownerId === CURRENT_USER_ID) {
    const received = offersOn(offers, listing.id).length;
    return (
      <ButtonLink
        href={`/listing/${listing.slug}#offers`}
        variant="secondary"
        size={size}
        block={block}
        className={className}
      >
        {received === 1 ? '1 offer' : `${received} offers`}
      </ButtonLink>
    );
  }

  const mine = myOfferOn(offers, listing.id);

  return (
    <>
      <Button
        variant={mine ? 'secondary' : 'primary'}
        size={size}
        block={block}
        className={className}
        onClick={() => setOpen(true)}
      >
        {mine ? 'Offer sent · View' : label}
      </Button>
      {open ? <OfferSheet listing={listing} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
