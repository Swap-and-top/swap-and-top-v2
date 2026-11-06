/**
 * Photos, before they leave the phone: drawn again at most 1600 pixels on
 * their long side, as WebP (or JPEG where a browser cannot make WebP), so a
 * photo of several MB goes up as a few hundred KB, kind to data bundles and
 * to R2. Drawing it also turns it the right way up and leaves behind what
 * the camera wrote into the file, such as where it was taken.
 *
 * Then sent to POST /api/uploads/photo, which checks it and keeps it on R2
 * (apps/api/src/routes/uploads.ts).
 */

import { apiSend } from './query';

/** The long side, in pixels, a photo is brought down to; a logo, smaller. */
const LONG_SIDE = 1600;
const LOGO_SIDE = 512;

/** A photo as the browser draws it, or why it cannot. */
function load(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That photo could not be opened. Choose a JPEG or PNG photo.'));
    };
    image.src = url;
  });
}

function encode(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** The photo, smaller, as WebP or JPEG. */
export async function shrinkPhoto(file: File, longSide = LONG_SIDE): Promise<Blob> {
  const image = await load(file);
  const scale = Math.min(1, longSide / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.naturalWidth * scale);
  canvas.height = Math.round(image.naturalHeight * scale);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('That photo could not be opened. Try again.');
  // White behind a PNG's see through parts, as JPEG has none.
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  // A browser that cannot make WebP hands back a PNG instead: JPEG then.
  const webp = await encode(canvas, 'image/webp', 0.8);
  if (webp && webp.type === 'image/webp') return webp;
  const jpeg = await encode(canvas, 'image/jpeg', 0.82);
  if (!jpeg) throw new Error('That photo could not be opened. Try again.');
  return jpeg;
}

/** A shrunk photo as a form, as the API takes one. */
async function photoForm(file: File, longSide?: number): Promise<FormData> {
  const photo = await shrinkPhoto(file, longSide);
  const form = new FormData();
  form.append('photo', photo, photo.type === 'image/webp' ? 'photo.webp' : 'photo.jpg');
  return form;
}

/** Shrinks a photo and keeps it on R2: its address, to show and to save. */
export async function uploadPhoto(file: File): Promise<string> {
  const { url } = await apiSend<{ key: string; url: string }>('/uploads/photo', 'POST', await photoForm(file));
  return url;
}

/** Shrinks a logo and makes it the store's at once: its address. */
export async function uploadLogo(storeId: string, file: File): Promise<string> {
  const form = await photoForm(file, LOGO_SIDE);
  const { logo } = await apiSend<{ logo: string }>(`/stores/${encodeURIComponent(storeId)}/logo`, 'PUT', form);
  return logo;
}

/** Deletes a photo taken off a form before it was saved. */
export function discardPhoto(url: string): void {
  void apiSend('/uploads/photo', 'DELETE', { photo: url }).catch(() => undefined);
}
