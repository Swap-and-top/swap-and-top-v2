'use client';

/**
 * OfferButton — "Make an offer", the same on every listing: on a Wanted card, and at
 * the foot of a swap or a request.
 *
 * It opens the offer sheet. Once you have offered, it says so and opens the
 * sheet on your offer instead. On your own listing there is nothing to offer,
 * so it becomes the way to the offers you have received.
 */

import { useState } from 'react';
import { toast } from 'sonner';
import {
  myOfferOn,
  offersOn,
  useOfferStore,
  useViewerId,
  type OfferableListing,
} from '@snt/core';
import { Button, ButtonLink, type ButtonSize } from '../primitives/Button';
import { OfferSheet } from './OfferSheet';

export function OfferButton({
  listing,
  label = 'Make an offer',
  size,
  block,
  className,
  preview = false,
}: {
  listing: OfferableListing;
  label?: string;
  size?: ButtonSize;
  block?: boolean;
  className?: string;
  /**
   * In the owner's buyer preview: the button as a buyer sees it, which says
   * what it does rather than opening an offer on the owner's own listing.
   */
  preview?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const offers = useOfferStore((store) => store.offers);
  const viewer = useViewerId();

  if (preview) {
    return (
      <Button
        size={size}
        block={block}
        className={className}
        onClick={() => toast('In the preview: buyers make their offer here.')}
      >
        {label}
      </Button>
    );
  }

  if (viewer && listing.ownerId === viewer) {
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

  const mine = myOfferOn(offers, listing.id, viewer);

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
