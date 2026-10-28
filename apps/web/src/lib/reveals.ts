'use client';

/**
 * Records a contact reveal through the API (POST /api/listings/{id}/reveals),
 * signed in or not: the API counts the daily limit and starts the deal check.
 * The device sends its own random id, kept in this browser, which the API
 * only hashes; it is never an identity.
 */

import type { ContactWay } from '@snt/core';
import { supabase } from './supabase';

const DEVICE_KEY = 'snt-device';

/** This browser's own random id, made once. */
export function deviceId(): string {
  try {
    const kept = localStorage.getItem(DEVICE_KEY);
    if (kept) return kept;
    const made = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, made);
    return made;
  } catch {
    // No storage (a private window): a new id each time, so the address
    // stands in for the limit.
    return '';
  }
}

/** Records it. `limited` carries the API's words when over the daily limit. */
export async function recordReveal(
  listingId: string,
  way: ContactWay,
): Promise<{ limited?: string }> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const response = await fetch(`/api/listings/${encodeURIComponent(listingId)}/reveals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Device': deviceId(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ way }),
  }).catch(() => null);
  if (response?.status === 429) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    return { limited: body.error ?? 'That is the daily limit.' };
  }
  // Anything else (a sample listing not in the database, the API away):
  // the details still show; only the record is missed.
  return {};
}
