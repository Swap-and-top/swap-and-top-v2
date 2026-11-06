/**
 * Photo uploads. The browser shrinks a photo first (about 1600 pixels on its
 * long side, a few hundred KB, apps/web/src/lib/photos.ts) and sends it here
 * as it is chosen; we check it is a JPEG, PNG or WebP by its first bytes, not
 * by what it says it is, and put it on R2 (../r2.ts) under the sender's own
 * folder. The answer is its key and address; the listing keeps the key when
 * it is saved (routes/post.ts), which takes only keys in the sender's folder
 * or photos the listing already had.
 */

import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { requireAuth, type AuthUser } from '../auth';
import { sql } from 'drizzle-orm';
import { db } from '../db/client';
import * as t from '../db/schema';
import { deletePhotos, photoKey, photoUrl, photosReady, putPhoto } from '../r2';
import { ErrorSchema } from '../schemas';
import { personFor } from './me';

export const uploadRoutes = new OpenAPIHono<{ Variables: { authUser: AuthUser } }>();

/** Shrunk in the browser, a photo is well under this; a big PNG may not be. */
export const MAX_PHOTO_BYTES = 3 * 1024 * 1024;

/** What a photo is, from its first bytes: JPEG, PNG or WebP, or none. */
export function photoType(bytes: Uint8Array): { type: string; ext: string } | null {
  const at = (i: number) => bytes[i];
  if (at(0) === 0xff && at(1) === 0xd8 && at(2) === 0xff) return { type: 'image/jpeg', ext: 'jpg' };
  if (at(0) === 0x89 && at(1) === 0x50 && at(2) === 0x4e && at(3) === 0x47) return { type: 'image/png', ext: 'png' };
  const text = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (text(0, 4) === 'RIFF' && text(8, 12) === 'WEBP') return { type: 'image/webp', ext: 'webp' };
  return null;
}

/** A photo from a form's `photo` field, checked: its bytes and type, or why not. */
export async function readPhoto(
  form: Record<string, string | File | (string | File)[]>,
): Promise<{ body: ArrayBuffer; type: string; ext: string } | { error: string }> {
  const file = form.photo;
  if (!(file instanceof File)) return { error: 'Choose a photo.' };
  if (file.size > MAX_PHOTO_BYTES) return { error: 'That photo is too big. Choose a smaller one.' };
  const body = await file.arrayBuffer();
  const kind = photoType(new Uint8Array(body, 0, Math.min(16, body.byteLength)));
  if (!kind) return { error: 'That file is not a photo we can use. Choose a JPEG, PNG or WebP.' };
  return { body, ...kind };
}

const upload = createRoute({
  method: 'post',
  path: '/uploads/photo',
  tags: ['Listings'],
  summary: 'Upload a listing photo',
  description:
    'One photo, as the form field `photo`: JPEG, PNG or WebP, up to 3 MB. Kept on R2 in the sender\'s own folder; send its `key` with the listing to keep it.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: z.object({ photo: z.any().openapi({ type: 'string', format: 'binary' }) }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Kept',
      content: { 'application/json': { schema: z.object({ key: z.string(), url: z.string() }) } },
    },
    400: { description: 'Not a photo we can use', content: { 'application/json': { schema: ErrorSchema } } },
    401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
    403: { description: 'May not post', content: { 'application/json': { schema: ErrorSchema } } },
    503: { description: 'Photos are not set up yet', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

uploadRoutes.openapi(upload, async (c) => {
  if (!photosReady) return c.json({ error: 'Photos are not set up yet.' }, 503);
  const person = await personFor(c.get('authUser'));
  // As for posting: a verified phone, and not suspended or banned.
  if (!person.phoneVerifiedAt) return c.json({ error: 'Verify your phone number to add photos.' }, 403);
  if (person.standing === 'suspended' || person.standing === 'banned') {
    return c.json({ error: 'Your account cannot post listings right now.' }, 403);
  }
  const photo = await readPhoto(await c.req.parseBody());
  if ('error' in photo) return c.json({ error: photo.error }, 400);
  const key = `photos/${person.id}/${crypto.randomUUID()}.${photo.ext}`;
  await putPhoto(key, photo.body, photo.type);
  return c.json({ key, url: photoUrl(key) }, 201);
});

const discard = createRoute({
  method: 'delete',
  path: '/uploads/photo',
  tags: ['Listings'],
  summary: 'Delete a photo not used yet',
  description:
    'A photo taken off a form before it was saved: deleted from R2 at once. Only one in the sender\'s own folder that no listing holds; a listing\'s own photos go when it is saved without them.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: {
    body: { content: { 'application/json': { schema: z.object({ photo: z.string() }) } } },
  },
  responses: {
    200: { description: 'Deleted, or nothing to delete', content: { 'application/json': { schema: z.object({ ok: z.boolean() }) } } },
    401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

uploadRoutes.openapi(discard, async (c) => {
  const person = await personFor(c.get('authUser'));
  const key = photoKey(c.req.valid('json').photo);
  if (!key.startsWith(`photos/${person.id}/`)) return c.json({ ok: false }, 200);
  const [used] = await db
    .select({ id: t.items.id })
    .from(t.items)
    .where(sql`${key} = any(${t.items.images})`)
    .limit(1);
  if (used) return c.json({ ok: false }, 200);
  await deletePhotos([key]);
  return c.json({ ok: true }, 200);
});
