/**
 * A store's public page.
 *
 * Public and indexable: a store's page ranking in Google is a reason for
 * them to value the account, which is part of what the console is sold on.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Storefront } from '@/components/Storefront';
import { slowDown } from '@/components/slowDown';
import { allStoreSlugs, storeFor } from '@/lib/stores';

/** On Vercel, near the database (see app/api/[[...route]]/route.ts). */
export const preferredRegion = 'dub1';

/** Built ahead for every open store, kept for a minute; a store opened since
    is made on its first visit. */
export const revalidate = 60;

export async function generateStaticParams() {
  return (await allStoreSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const store = (await storeFor(slug))?.store;
  if (!store) return { title: 'Store not found · Swap & Top' };

  return {
    title: `${store.name} · Swap & Top`,
    description: `${store.description ? `${store.description} ` : ''}${store.location}.`,
  };
}

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await slowDown();
  const { slug } = await params;
  const found = await storeFor(slug);
  if (!found) notFound();

  return <Storefront store={found.store} listings={found.listings} />;
}
