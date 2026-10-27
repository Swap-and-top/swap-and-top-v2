/**
 * A store's public page.
 *
 * Public and indexable: a store's page ranking in Google is a reason for
 * them to value the account, which is part of what the console is sold on.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStoreBySlug, getStoreListings, mockStores } from '@snt/core';
import { Storefront } from '@/components/Storefront';
import { slowDown } from '@/components/slowDown';

export function generateStaticParams() {
  return mockStores.map((store) => ({ slug: store.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const store = getStoreBySlug(slug);
  if (!store) return { title: 'Store not found · Swap & Top' };

  return {
    title: `${store.name} · Swap & Top`,
    description: `${store.description} ${store.location}.`,
  };
}

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await slowDown();
  const { slug } = await params;
  const store = getStoreBySlug(slug);

  if (!store) notFound();

  const listings = getStoreListings(store.id).filter(
    (listing) => listing.status === 'live',
  );

  return <Storefront store={store} listings={listings} />;
}
