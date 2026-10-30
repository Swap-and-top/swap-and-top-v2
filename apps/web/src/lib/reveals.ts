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

/** The seller's details, as the API gives them once its checks pass. */
export interface RevealedContact {
  /** "077 123 4567" */
  phone: string;
  call: boolean;
  whatsapp: boolean;
}

/** Said when the details could not be fetched, rather than a made up number. */
const FAILED = 'We could not get the number. Try again in a minute.';

/**
 * Records it, and brings back how to reach the seller. `limited` carries the
 * API's words when over the daily limit, `refused` when the seller's own
 * rules keep their details back, `failed` when the API could not answer or
 * the listing is gone. `contact` is null when no number was given.
 */
export async function recordReveal(
  listingId: string,
  way: ContactWay,
): Promise<{ limited?: string; refused?: string; failed?: string; contact?: RevealedContact | null }> {
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
  if (!response) return { failed: FAILED };
  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
    contact?: RevealedContact | null;
  };
  if (response.status === 429) return { limited: body.error ?? 'That is the daily limit.' };
  if (response.status === 401 || response.status === 403) {
    return { refused: body.error ?? 'This seller keeps their details back.' };
  }
  if (response.ok) return { contact: body.contact ?? null };
  // Anything else: the listing is gone, or the API is away.
  return { failed: body.error ?? FAILED };
}

/** A store's own number, from its page (POST /api/stores/{id}/contact):
    held to the same daily limit, answered as `recordReveal` is. */
export async function revealStoreContact(
  storeId: string,
): Promise<{ limited?: string; failed?: string; contact?: RevealedContact | null }> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const response = await fetch(`/api/stores/${encodeURIComponent(storeId)}/contact`, {
    method: 'POST',
    headers: {
      'X-Device': deviceId(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }).catch(() => null);
  if (!response) return { failed: FAILED };
  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
    contact?: RevealedContact | null;
  };
  if (response.status === 429) return { limited: body.error ?? 'That is the daily limit.' };
  if (response.ok) return { contact: body.contact ?? null };
  // Anything else: the store is closed, or the API is away.
  return { failed: body.error ?? FAILED };
}
