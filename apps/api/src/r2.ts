/**
 * Photos on Cloudflare R2: listing photos and store logos, in one public
 * bucket served from its own domain (R2_PUBLIC_URL), through Cloudflare's
 * cache. Photos come to the API (routes/uploads.ts), which checks them and
 * puts them here; R2 cannot limit what a signed link would let in.
 *
 * What the database keeps is the key ("photos/{personId}/{random}.webp"),
 * not the address, so the domain can change; `photoUrl` makes the address
 * when a listing is read. Older rows hold full addresses or the mock data's
 * paths, which pass through as they are.
 *
 * Settings: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
 * R2_BUCKET, R2_PUBLIC_URL. Without them uploads answer that photos are not
 * set up, and everything else works.
 */

import { AwsClient } from 'aws4fetch';

const env = process.env;

/** Whether R2's settings are all there. */
export const photosReady = Boolean(
  env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET && env.R2_PUBLIC_URL,
);

const client = photosReady
  ? new AwsClient({
      accessKeyId: env.R2_ACCESS_KEY_ID!,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
      service: 's3',
      region: 'auto',
    })
  : null;

const PUBLIC = (env.R2_PUBLIC_URL ?? '').replace(/\/+$/, '');

/** The account's ID, also when the setting holds the whole endpoint address
    Cloudflare shows ("https://{id}.r2.cloudflarestorage.com"). */
const ACCOUNT = (env.R2_ACCOUNT_ID ?? '').match(/[0-9a-f]{32}/)?.[0] ?? (env.R2_ACCOUNT_ID ?? '').trim();

function objectUrl(key: string): string {
  return `https://${ACCOUNT}.r2.cloudflarestorage.com/${env.R2_BUCKET}/${key}`;
}

/** Where a kept photo is seen: a key becomes its public address. */
export function photoUrl(stored: string): string {
  if (!stored || stored.startsWith('http') || stored.startsWith('/')) return stored;
  return `${PUBLIC}/${stored}`;
}

/** A photo's key from what a browser sends back: its address or its key. */
export function photoKey(sent: string): string {
  return PUBLIC && sent.startsWith(`${PUBLIC}/`) ? sent.slice(PUBLIC.length + 1) : sent;
}

/** Whether a key is one of ours on R2 (not a mock path or an old address). */
export function isOurs(key: string): boolean {
  return key.startsWith('photos/') || key.startsWith('stores/');
}

/** Puts a photo on R2. A key is never used twice, so a photo never changes
    under it: browsers keep it a year. Cloudflare's own cache keeps it a day,
    so a deleted photo stops being served by the next day. */
export async function putPhoto(key: string, body: ArrayBuffer, type: string): Promise<void> {
  if (!client) throw new Error('Photos are not set up yet.');
  const signed = await client.sign(objectUrl(key), {
    method: 'PUT',
    body,
    headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=31536000, s-maxage=86400, immutable' },
  });
  // Sent whole, with its length, as R2 asks: a signed Request's body would
  // go as a stream, which R2 refuses (411) where fetch is Next's.
  const response = await fetch(signed.url, { method: 'PUT', headers: signed.headers, body });
  if (!response.ok) throw new Error(`R2 refused the photo (${response.status}).`);
}

/** Deletes photos from R2; a key already gone is fine. Never throws: a photo
    left behind is not worth failing what deleted it. */
export async function deletePhotos(keys: string[]): Promise<void> {
  if (!client) return;
  await Promise.all(
    keys.filter(isOurs).map((key) =>
      client.fetch(objectUrl(key), { method: 'DELETE' }).catch(() => undefined),
    ),
  );
}
