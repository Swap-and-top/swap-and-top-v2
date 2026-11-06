'use client';

/**
 * Photos on a form: the post form and the Store console's stock form.
 *
 * Each photo goes up as soon as it is chosen (shrunk first, lib/photos.ts),
 * shown at once faded with a spinner, then as it is kept. The form saves
 * the addresses; its button waits while any are still going up (`busy`).
 * A photo chosen here and taken off again before saving is deleted at
 * once; one the listing already had goes when the listing is saved
 * without it (the API does that).
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

export interface PhotoPicking {
  photos: string[];
  /** Still going up: a local preview each. */
  pending: { id: string; preview: string }[];
  pick: (files: FileList | null) => void;
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
  /** Put up from this form and not saved yet: deleted if taken off. */
  const fresh = useRef(new Set<string>());
  const upload = useMutation({ mutationFn: uploadPhoto });

  function pick(files: FileList | null) {
    const room = MAX_PHOTOS - photos.length - pending.length;
    // Some phones give no type for their own photo formats: let the
    // browser try them.
    const chosen = Array.from(files ?? [])
      .filter((file) => !file.type || file.type.startsWith('image/'))
      .slice(0, Math.max(0, room));
    for (const file of chosen) {
      const id = crypto.randomUUID();
      const preview = URL.createObjectURL(file);
      setPending((now) => [...now, { id, preview }]);
      upload
        .mutateAsync(file)
        .then(
          (url) => {
            fresh.current.add(url);
            setPhotos((now) => [...now, url]);
          },
          (error: Error) => toast.error(error.message),
        )
        .finally(() => {
          setPending((now) => now.filter((each) => each.id !== id));
          URL.revokeObjectURL(preview);
        });
    }
  }

  function remove(url: string) {
    setPhotos((now) => now.filter((each) => each !== url));
    if (fresh.current.delete(url)) discardPhoto(url);
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
          picking.pick(event.target.files);
          event.target.value = '';
        }}
      />
    </div>
  );
}
