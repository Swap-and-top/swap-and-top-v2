'use server';

/**
 * After a listing is posted or its owner changes it: the feed and that
 * listing's page are built again on their next visit, rather than when their
 * minute is up, so the change shows at once.
 */

import { revalidatePath } from 'next/cache';

export async function refreshListing(slug: string) {
  revalidatePath('/');
  revalidatePath(`/listing/${slug}`);
}
