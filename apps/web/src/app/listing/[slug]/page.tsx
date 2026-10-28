/**
 * Listing detail — one route for every listing type.
 *
 * The URL carries a readable slug, never a raw identifier: it is what a search
 * engine matches against a query and what a person recognises in a WhatsApp
 * message.
 *
 * This is a server component so it can await `params` and generate metadata,
 * and read the listing from the database.
 * The three detail views below it are client components, because they hold the
 * save and reveal state.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RequestDetail } from '@/components/listing/RequestDetail';
import { SaleDetail } from '@/components/listing/SaleDetail';
import { SwapDetail } from '@/components/listing/SwapDetail';
import { slowDown } from '@/components/slowDown';
import { ViewRecorder } from '@/components/ViewRecorder';
import { feedListings, listingFor } from '@/lib/listings';

/** Built ahead for every live listing, kept for a minute; a listing newer
    than the last build is made on its first visit. */
export const revalidate = 60;

export async function generateStaticParams() {
  return (await feedListings()).map((listing) => ({ slug: listing.slug }));
}

/**
 * Per-listing metadata. With real data this is also where the link-preview tags
 * go — title, description and an absolute image URL — which is what makes a
 * shared listing render as a card in WhatsApp instead of a blank grey box.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const listing = await listingFor(slug);
  if (!listing) return { title: 'Listing not found · Swap & Top' };

  let price = '';
  if (listing.type === 'sale') {
    price = `, $${listing.price}`;
  } else if (listing.type === 'request') {
    price = `, budget $${listing.budget}`;
  } else if (listing.type === 'swap' && listing.cashAmount) {
    price = `, ${listing.cashUpTo ? 'plus up to' : 'plus'} $${listing.cashAmount}`;
  }

  return {
    title: `${listing.title}${price} · Swap & Top`,
    description: `${listing.title} in ${listing.location}.`,
  };
}

export default async function ListingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await slowDown();
  const { slug } = await params;
  const listing = await listingFor(slug);

  if (!listing) notFound();

  // Each opening counts as a view, for the owner's Stats.
  const viewed = <ViewRecorder listingId={listing.id} />;
  switch (listing.type) {
    case 'sale':
      return (
        <>
          {viewed}
          <SaleDetail listing={listing} />
        </>
      );
    case 'swap':
      return (
        <>
          {viewed}
          <SwapDetail listing={listing} />
        </>
      );
    case 'request':
      return (
        <>
          {viewed}
          <RequestDetail listing={listing} />
        </>
      );
    case 'auction':
      // Deferred — see docs/features/auctions.md.
      notFound();
    default:
      notFound();
  }
}
