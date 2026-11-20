'use client';

/**
 * Photos on a form: the post form and the Store console's stock form.
 *
 * Each photo goes up as soon as it is chosen (shrunk first, lib/photos.ts),
 * shown at once faded with a spinner, then as it is kept. The form saves
 * the addresses; its button waits while any are still going up (`busy`).
 * A photo taken off is deleted at once unless a saved listing holds it
 * (the API checks, DELETE /uploads/photo), so it goes even after a trip to
 * the review step and back; one the listing already had goes when the
 * listing is saved without it.
 *
 * The same photo is added once: each is known by a fingerprint of its
 * bytes (whatever its name), and one already added, or going up, is left
 * out with a message.
 */

import { useMutation } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Img, Spinner } from '@snt/ui';
import { CloseIcon, PlusIcon } from '@snt/ui/icons';
import { discardPhoto, uploadPhoto } from '@/lib/photos';
import styles from './PhotoPicker.module.css';

/** The most photos a listing keeps. */
export const MAX_PHOTOS = 8;

/** Each photo added this visit, by its address: its fingerprint. Kept
    outside the form, so a trip to the review step and back keeps it. */
const fingerprints = new Map<string, string>();

/** A fingerprint of a file's bytes: the same photo gives the same one,
    whatever it is called. */
async function fingerprintOf(file: File): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export interface PhotoPicking {
  photos: string[];
  /** Still going up: a local preview each. */
  pending: { id: string; preview: string }[];
  pick: (files: FileList | File[] | null) => Promise<void>;
  remove: (url: string) => void;
  /** Any still going up: the form waits. */
  busy: boolean;
}

/** The photos of a form, kept by the form (`photos`, `setPhotos`). */
export function usePhotoPicker(
  photos: string[],
  setPhotos: (update: (now: string[]) => string[]) => void,
): PhotoPicking {
  const [pending, setPending] = useState<PhotoPicking['pending']>([]);
  /** The fingerprints of the photos still going up. */
  const going = useRef(new Set<string>());
  const upload = useMutation({ mutationFn: uploadPhoto });

  async function pick(files: FileList | File[] | null) {
    let room = MAX_PHOTOS - photos.length - pending.length;
    // Some phones give no type for their own photo formats: let the
    // browser try them.
    const images = Array.from(files ?? []).filter((file) => !file.type || file.type.startsWith('image/'));
    const taken = new Set([
      ...photos.map((url) => fingerprints.get(url)).filter((print): print is string => Boolean(print)),
      ...going.current,
    ]);
    let repeats = 0;
    for (const file of images) {
      if (room <= 0) break;
      const print = await fingerprintOf(file);
      if (taken.has(print)) {
        repeats += 1;
        continue;
      }
      taken.add(print);
      going.current.add(print);
      room -= 1;
      const id = crypto.randomUUID();
      const preview = URL.createObjectURL(file);
      setPending((now) => [...now, { id, preview }]);
      upload
        .mutateAsync(file)
        .then(
          (url) => {
            fingerprints.set(url, print);
            setPhotos((now) => [...now, url]);
          },
          (error: Error) => toast.error(error.message),
        )
        .finally(() => {
          going.current.delete(print);
          setPending((now) => now.filter((each) => each.id !== id));
          URL.revokeObjectURL(preview);
        });
    }
    if (repeats > 0) {
      toast.error(repeats === 1 ? 'You have added that photo already.' : 'You have added some of those photos already.');
    }
  }

  function remove(url: string) {
    fingerprints.delete(url);
    setPhotos((now) => now.filter((each) => each !== url));
    // Refused by the API while a saved listing holds it.
    discardPhoto(url);
  }

  return { photos, pending, pick, remove, busy: pending.length > 0 };
}

/** The row of photos, each with a cross to take it off, and the plus. */
export function PhotoPicker({ picking }: { picking: PhotoPicking }) {
  const input = useRef<HTMLInputElement>(null);
  const { photos, pending } = picking;
  const full = photos.length + pending.length >= MAX_PHOTOS;
  return (
    <div className={styles.photos}>
      {photos.map((url, index) => (
        <div key={url} className={styles.thumb}>
          <Img src={url} alt={`Photo ${index + 1}`} className={styles.photo} />
          <button
            type="button"
            aria-label={`Remove photo ${index + 1}`}
            className={styles.remove}
            onClick={() => picking.remove(url)}
          >
            <CloseIcon size={12} weight={2.4} />
          </button>
        </div>
      ))}
      {pending.map(({ id, preview }) => (
        <div key={id} className={styles.thumb} aria-busy>
          {/* The photo as chosen, faded, until it is kept. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className={[styles.photo, styles.going].join(' ')} />
          <span className={styles.spinner}>
            <Spinner size={20} label="Adding photo" />
          </span>
        </div>
      ))}
      <button
        type="button"
        aria-label="Add photos"
        className={styles.add}
        onClick={() => input.current?.click()}
        disabled={full}
      >
        <PlusIcon size={21} />
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          // Copied first: emptying the box below empties the list too.
          const files = Array.from(event.target.files ?? []);
          void picking.pick(files);
          event.target.value = '';
        }}
      />
    </div>
  );
}
