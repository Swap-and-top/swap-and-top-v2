'use client';

/**
 * Loading: a listing. Sale, swap and wanted pages look nothing alike, so the
 * skeleton follows the kind of listing being opened, known from its address
 * (the one just tapped is already known to the app). A sale when unsure.
 */

import { useParams, usePathname } from 'next/navigation';
import { getListingBySlug, useStockStore } from '@snt/core';
import {
  RequestListingSkeleton,
  SaleListingSkeleton,
  SwapListingSkeleton,
} from '@/components/listing/ListingSkeletons';

export default function Loading() {
  const { slug } = useParams<{ slug: string }>();
  // A buyer preview carries its banner from the start.
  const preview = usePathname().endsWith('/preview');
  const added = useStockStore((state) => state.added);
  const listing =
    getListingBySlug(slug) ?? added.find((item) => item.slug === slug);

  if (listing?.type === 'swap') return <SwapListingSkeleton preview={preview} />;
  if (listing?.type === 'request') {
    return <RequestListingSkeleton preview={preview} />;
  }
  return <SaleListingSkeleton preview={preview} />;
}
