/**
 * Dealer shopfront.
 *
 * Public and indexable: a dealer's shopfront ranking in Google is a reason for
 * them to value the account, which is part of what the console is sold on.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getShopBySlug, getShopListings, mockShops } from '@snt/core';
import { Shopfront } from '@/components/Shopfront';

export function generateStaticParams() {
  return mockShops.map((shop) => ({ slug: shop.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const shop = getShopBySlug(slug);
  if (!shop) return { title: 'Shop not found · Swap & Top' };

  return {
    title: `${shop.name} · Swap & Top`,
    description: `${shop.description} ${shop.location}.`,
  };
}

export default async function ShopPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const shop = getShopBySlug(slug);

  if (!shop) notFound();

  const listings = getShopListings(shop.id).filter(
    (listing) => listing.status === 'live',
  );

  return <Shopfront shop={shop} listings={listings} />;
}
