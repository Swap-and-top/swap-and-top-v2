/**
 * Listing detail — one route for every listing type.
 *
 * The URL carries a readable slug, never a raw identifier: it is what a search
 * engine matches against a query and what a person recognises in a WhatsApp
 * message.
 *
 * This is a server component so it can await `params` and generate metadata.
 * The three detail views below it are client components, because they hold the
 * save and reveal state.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getListingBySlug, mockListings } from '@snt/core';
import { RequestDetail } from '@/components/listing/RequestDetail';
import { SaleDetail } from '@/components/listing/SaleDetail';
import { SwapDetail } from '@/components/listing/SwapDetail';

export function generateStaticParams() {
  return mockListings.map((listing) => ({ slug: listing.slug }));
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
  const listing = getListingBySlug(slug);
  if (!listing) return { title: 'Listing not found · Swap & Top' };

  let price = '';
  if (listing.type === 'sale') {
    price = ` — $${listing.price}`;
  } else if (listing.type === 'request') {
    price = ` — budget $${listing.budget}`;
  } else if (listing.type === 'swap' && listing.cashAmount) {
    price = ` — plus $${listing.cashAmount}`;
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
  const { slug } = await params;
  const listing = getListingBySlug(slug);

  if (!listing) notFound();

  switch (listing.type) {
    case 'sale':
      return <SaleDetail listing={listing} />;
    case 'swap':
      return <SwapDetail listing={listing} />;
    case 'request':
      return <RequestDetail listing={listing} />;
    case 'auction':
      // Deferred — see docs/features/auctions.md.
      notFound();
    default:
      notFound();
  }
}
