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

/** After a store pass is bought (listings its last lapse paused are live
    again) or a list of stock is imported: the feed and the store's page. */
export async function refreshStorePass(slug: string) {
  revalidatePath('/');
  revalidatePath(`/store/${slug}`);
}

/** After a store is opened, changed or closed: its page, and the feed its
    listings are in, are built again on their next visit. */
export async function refreshStore(slug: string) {
  revalidatePath(`/store/${slug}`);
  revalidatePath('/');
}
