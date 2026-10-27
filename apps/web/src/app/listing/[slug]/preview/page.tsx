/**
 * Buyer preview of a listing, for its owner: the listing page exactly as a
 * buyer sees it, with the owner's own tools (status, counts, Edit and
 * Manage, offers received) left out, under a banner saying so. Reached from
 * "View as a buyer" in the Store console. Kept out of search engines.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getListingBySlug, mockListings } from '@snt/core';
import { RequestDetail } from '@/components/listing/RequestDetail';
import { SaleDetail } from '@/components/listing/SaleDetail';
import { SwapDetail } from '@/components/listing/SwapDetail';
import { slowDown } from '@/components/slowDown';

export function generateStaticParams() {
  return mockListings.map((listing) => ({ slug: listing.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const listing = getListingBySlug(slug);
  return {
    title: listing
      ? `Buyer preview: ${listing.title} · Swap & Top`
      : 'Listing not found · Swap & Top',
    robots: { index: false, follow: false },
  };
}

export default async function ListingPreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await slowDown();
  const { slug } = await params;
  const listing = getListingBySlug(slug);

  if (!listing) notFound();

  switch (listing.type) {
    case 'sale':
      return <SaleDetail listing={listing} preview />;
    case 'swap':
      return <SwapDetail listing={listing} preview />;
    case 'request':
      return <RequestDetail listing={listing} preview />;
    default:
      notFound();
  }
}
