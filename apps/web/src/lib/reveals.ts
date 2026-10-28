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

/**
 * Records it, and brings back how to reach the seller. `limited` carries the
 * API's words when over the daily limit, `refused` when the seller's own
 * rules keep their details back. `contact` is undefined for a listing the
 * database does not have (a sample one), null when no number was given.
 */
export async function recordReveal(
  listingId: string,
  way: ContactWay,
): Promise<{ limited?: string; refused?: string; contact?: RevealedContact | null }> {
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
  if (!response) return {};
  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
    contact?: RevealedContact | null;
  };
  if (response.status === 429) return { limited: body.error ?? 'That is the daily limit.' };
  if (response.status === 401 || response.status === 403) {
    return { refused: body.error ?? 'This seller keeps their details back.' };
  }
  if (response.ok) return { contact: body.contact ?? null };
  // Anything else (a sample listing not in the database, the API away):
  // the sample details show; only the record is missed.
  return {};
}

/** A store's own number, from its page (POST /api/stores/{id}/contact):
    held to the same daily limit, answered as `recordReveal` is. */
export async function revealStoreContact(
  storeId: string,
): Promise<{ limited?: string; contact?: RevealedContact | null }> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const response = await fetch(`/api/stores/${encodeURIComponent(storeId)}/contact`, {
    method: 'POST',
    headers: {
      'X-Device': deviceId(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }).catch(() => null);
  if (!response) return {};
  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
    contact?: RevealedContact | null;
  };
  if (response.status === 429) return { limited: body.error ?? 'That is the daily limit.' };
  if (response.ok) return { contact: body.contact ?? null };
  // A sample store not in the database: its sample details show.
  return {};
}
