'use client';

/**
 * Console — the stock form: Add stock, and Edit or Finish on an item.
 *
 * One item at a time, set as the post form is: one white card, sentence case
 * bold blue labels set in over pale rounded boxes, the details the category
 * asks for two to a row, and the buttons at the foot of the form.
 *
 * Saved through the API: a new item is posted as the store
 * (POST /api/listings), an existing one changed in place
 * (PATCH /api/listings/{id}), and a new status set through the status
 * endpoint. Photos are chosen from the device and shown at once, but are not
 * uploaded yet. An item with a price goes live; one without is kept as a
 * draft, since nothing is listed unpriced.
 *
 * Given an item, the form opens filled in with it: "Finish" on a draft, to
 * price and list it, or "Edit" on anything else, to change it in place.
 */

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  CATEGORY_LABELS,
  CONDITION_LABELS,
  currentStore,
  useListingStatusStore,
  type Category,
  type Condition,
  type ItemSpecs,
  type SaleListing,
} from '@snt/core';
import {
  Button,
  ButtonLink,
  Chip,
  ChipRow,
  ConsoleShell,
  Dropdown,
  Field,
  Img,
  specFieldsFor,
  startPageLoad,
  TickTile,
  useConsoleTarget,
} from '@snt/ui';
import { CloseIcon, PlusIcon } from '@snt/ui/icons';
import { SponsorBanner } from '@/components/sponsor/SponsorBanner';
import { refreshListing } from '@/lib/refresh';
import { apiSend } from '@/lib/query';
import { stockKey, useConsoleStock } from './useConsoleStock';
import styles from './StockForm.module.css';

const CATEGORIES: Category[] = [
  'laptops',
  'phones',
  'desktops',
  'consoles',
  'parts',
  'accessories',
  'other',
];

const CONDITIONS = Object.keys(CONDITION_LABELS) as Condition[];

const MAX_PHOTOS = 8;

/** The statuses an item already listed can be given on the form. */
type ListedStatus = 'live' | 'paused' | 'sold';

const isListed = (status: string): status is ListedStatus =>
  status === 'live' || status === 'paused' || status === 'sold';

const STATUS_CHOICES: Record<ListedStatus, string> = {
  live: 'Live',
  paused: 'Paused',
  sold: 'Sold',
};

/** How the saved message says it. */
const STATUS_SAVED: Record<ListedStatus, string> = {
  live: 'live again',
  paused: 'paused',
  sold: 'marked sold',
};

/** A whole number of dollars from what was typed, or nothing. */
function dollars(text: string): number | undefined {
  const value = Number(text.replace(/[^0-9.]/g, ''));
  return value > 0 ? Math.round(value) : undefined;
}

export function StockForm({ editing }: { editing?: SaleListing }) {
  const router = useRouter();
  const store = useConsoleTarget() ?? currentStore;
  const stock = useConsoleStock(store.id) ?? [];
  const setStatus = useListingStatusStore((state) => state.setStatus);

  const item = editing?.item;
  const isDraft = editing?.status === 'draft';

  const [category, setCategory] = useState<Category>(
    editing?.category ?? CATEGORIES[0]!,
  );
  const [title, setTitle] = useState(editing?.title ?? '');
  const [specs, setSpecs] = useState<ItemSpecs>(item?.specs ?? {});
  const [condition, setCondition] = useState<Condition>(
    item?.condition ?? CONDITIONS[0]!,
  );
  const [price, setPrice] = useState(
    editing && editing.price > 0 ? String(editing.price) : '',
  );
  const [quantity, setQuantity] = useState(
    editing?.stockCount ? String(editing.stockCount) : '',
  );
  const [acceptsSwaps, setAcceptsSwaps] = useState(
    editing?.acceptsSwaps ?? false,
  );
  const [photos, setPhotos] = useState<string[]>(item?.images ?? []);
  // Live, paused or sold: only for an item already listed.
  const [listedStatus, setListedStatus] = useState<ListedStatus | undefined>(
    editing && isListed(editing.status) ? editing.status : undefined,
  );

  const picker = useRef<HTMLInputElement>(null);
  const conditionLabel = useId();
  const fields = specFieldsFor(category);

  // Photos chosen here and not kept are let go when the page closes.
  const kept = useRef(false);
  const latest = useRef(photos);
  latest.current = photos;
  useEffect(
    () => () => {
      if (kept.current) return;
      latest.current
        .filter((url) => url.startsWith('blob:') && !item?.images.includes(url))
        .forEach((url) => URL.revokeObjectURL(url));
    },
    [item],
  );

  const named = title.trim().length > 0;
  const priced = dollars(price) !== undefined;

  function addPhotos(files: FileList | null) {
    if (!files) return;
    const room = MAX_PHOTOS - photos.length;
    const urls = Array.from(files)
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, room)
      .map((file) => URL.createObjectURL(file));
    setPhotos((current) => [...current, ...urls]);
  }

  function removePhoto(index: number) {
    setPhotos((current) => {
      const url = current[index]!;
      // Only a photo chosen here, not one the item already had.
      if (url.startsWith('blob:') && !item?.images.includes(url)) {
        URL.revokeObjectURL(url);
      }
      return current.filter((_, at) => at !== index);
    });
  }

  const queryClient = useQueryClient();

  /** What the form holds, as the API takes it. */
  function formItem() {
    return {
      title: title.trim(),
      category,
      condition,
      price: dollars(price),
      specs: Object.fromEntries(
        Object.entries(specs).filter(([, value]) => value?.trim()),
      ) as Record<string, string>,
      stockCount: dollars(quantity),
      acceptsSwaps,
    };
  }

  /** Saves the item (as a draft, or listed), then opens Stock. Resolves with
      what to say once it is saved. */
  const saveItem = useMutation({
    mutationFn: async (draft: boolean): Promise<string> => {
      const item = formItem();
      if (editing) {
        // A draft with a price is listed when they choose to list it.
        const publish = isDraft && !draft;
        const data = await apiSend<{ slug: string; status: string }>(
          `/listings/${encodeURIComponent(editing.id)}`,
          'PATCH',
          { ...item, publish },
        );
        // A new status chosen on the form, saved after the changes.
        let status = data.status;
        if (listedStatus && listedStatus !== editing.status && !isDraft) {
          await apiSend(`/listings/${encodeURIComponent(editing.id)}/status`, 'PATCH', {
            status: listedStatus,
          });
          status = listedStatus;
        }
        setStatus(editing.id, status as SaleListing['status']);
        await refreshListing(data.slug);
        return isDraft && status === 'live'
          ? `${item.title} is live in your stock.`
          : status === 'draft'
            ? `${item.title} is saved as a draft.`
            : status !== editing.status
              ? `Changes saved, ${item.title} is ${STATUS_SAVED[status as ListedStatus]}.`
              : 'Changes saved.';
      }
      const data = await apiSend<{ slug: string }>('/listings', 'POST', {
        kind: 'sale',
        storeId: store.id,
        category: item.category,
        haveTitle: item.title,
        condition: item.condition,
        specs: item.specs,
        price: item.price,
        stockCount: item.stockCount,
        acceptsSwaps: item.acceptsSwaps,
        draft,
        // A store's stock is reached as the store is; its own contact
        // ways come later.
        contactChannels: ['whatsapp', 'call'],
        allowStoreOffers: true,
        contactSignedInOnly: false,
        contactShownTo: 'everyone',
        contactToStores: false,
      });
      await refreshListing(data.slug);
      return draft ? `${item.title} is saved as a draft.` : `${item.title} is live in your stock.`;
    },
    onSuccess: (message) => {
      // Stock shows it at once, read again rather than from before.
      void queryClient.invalidateQueries({ queryKey: stockKey(store.id) });
      toast.success(message);
      startPageLoad();
      router.push('/console/stock');
    },
    onError: (error) => toast.error(error.message || 'We could not save it. Try again in a minute.'),
  });

  /** Which button is saving, so it shows the spinner until Stock opens. */
  const saving: 'draft' | 'listed' | null =
    saveItem.isPending || saveItem.isSuccess ? (saveItem.variables ? 'draft' : 'listed') : null;

  function save(draft: boolean) {
    kept.current = true;
    saveItem.mutate(draft);
  }

  const heading = !editing
    ? {
        title: 'Add stock',
        meta: 'One item at a time. For a whole list, use Bulk import.',
      }
    : isDraft
      ? { title: 'Finish draft', meta: 'Add what is missing, then list it.' }
      : { title: 'Edit item', meta: 'Changes show on the listing once saved.' };

  return (
    <ConsoleShell
      store={store}
      title={heading.title}
      meta={heading.meta}
      stockCount={stock.length}
    >
      {/* Boost this listing, on top of the edit card: a live item not
          sponsored yet (or, once it is, until when, with Extend). */}
      {editing && !isDraft ? (
        <SponsorBanner listing={editing} className={styles.sponsor} />
      ) : null}

      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          if (named && priced) save(false);
        }}
      >
        {/* An item already listed: live or paused (or sold, or live
            again), chosen like everything else here and saved with it. */}
        {editing && !isDraft && listedStatus ? (
          <div className={styles.standing}>
            <span className={styles.label}>Current status</span>
            <div
              className={styles.standingChoices}
              role="group"
              aria-label="Current status"
            >
              {(editing.status === 'sold'
                ? (['sold', 'live'] as const)
                : (['live', 'paused'] as const)
              ).map((value) => (
                <Chip
                  key={value}
                  selected={listedStatus === value}
                  onClick={() => setListedStatus(value)}
                >
                  {STATUS_CHOICES[value]}
                </Chip>
              ))}
            </div>
          </div>
        ) : null}

        <div className={styles.group}>
          <span className={styles.label}>Category</span>
          {/* Scrolls sideways within the card, cut at its edges. */}
          <div className={styles.chips}>
            <ChipRow fill label="Choose a category">
              {CATEGORIES.map((value) => (
                <Chip
                  key={value}
                  selected={category === value}
                  onClick={() => setCategory(value)}
                >
                  {CATEGORY_LABELS[value]}
                </Chip>
              ))}
            </ChipRow>
          </div>
        </div>

        <div className={styles.group}>
          <span className={styles.label}>
            Photos{' '}
            <span className={styles.optional}>
              ({photos.length} of {MAX_PHOTOS})
            </span>
          </span>
          <div className={styles.photos}>
            {photos.map((url, index) => (
              <div key={url} className={styles.photoThumb}>
                <Img
                  src={url}
                  alt={`Photo ${index + 1}`}
                  className={styles.photo}
                />
                <button
                  type="button"
                  aria-label={`Remove photo ${index + 1}`}
                  className={styles.removePhoto}
                  onClick={() => removePhoto(index)}
                >
                  <CloseIcon size={12} weight={2.4} />
                </button>
              </div>
            ))}
            <button
              type="button"
              aria-label="Add photos"
              className={styles.addPhoto}
              onClick={() => picker.current?.click()}
              disabled={photos.length >= MAX_PHOTOS}
            >
              <PlusIcon size={21} />
            </button>
            <input
              ref={picker}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(event) => {
                addPhotos(event.target.files);
                event.target.value = '';
              }}
            />
          </div>
        </div>

        <Field
          label="Name"
          placeholder="e.g. Lenovo ThinkPad T480"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />

        {/* The details this category asks for, two to a row, with the
            condition, the price and how many among them. */}
        <div className={styles.specs}>
          {fields.map((field) => (
            <Field
              key={field.key}
              label={field.label}
              placeholder={`e.g. ${field.example}`}
              value={specs[field.key] ?? ''}
              onChange={(event) =>
                setSpecs((current) => ({
                  ...current,
                  [field.key]: event.target.value,
                }))
              }
            />
          ))}
          {category === 'other' ? (
            <Field
              className={styles.wide}
              label="Details"
              placeholder="e.g. Canon EOS 200D, with its lens and charger"
              value={specs.details ?? ''}
              onChange={(event) =>
                setSpecs((current) => ({
                  ...current,
                  details: event.target.value,
                }))
              }
            />
          ) : null}
          <div className={styles.field}>
            <span
              id={conditionLabel}
              className={[styles.label, styles.setIn].join(' ')}
            >
              Condition
            </span>
            <Dropdown<Condition>
              labelledBy={conditionLabel}
              value={condition}
              onChange={setCondition}
              options={CONDITIONS.map((value) => ({
                value,
                label: CONDITION_LABELS[value],
              }))}
            />
          </div>
          <Field
            label="Price"
            strong
            inputMode="numeric"
            placeholder="e.g. $250"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
          />
          <Field
            label="How many you have"
            inputMode="numeric"
            placeholder="e.g. 3"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </div>

        <TickTile
          checked={acceptsSwaps}
          onChange={setAcceptsSwaps}
          label="Accept swaps"
          hint="Buyers can offer something they have, with cash on top."
        />

        {/* At the foot of the form. Without a price it can only wait as a
            draft. */}
        {editing && !isDraft ? (
          // An item already listed keeps its status: Cancel beside Save.
          <div className={styles.actions}>
            <ButtonLink href="/console/stock" variant="secondary" size="lg">
              Cancel
            </ButtonLink>
            <Button
              type="submit"
              size="lg"
              disabled={!named || !priced}
              loading={saving !== null}
            >
              Save changes
            </Button>
          </div>
        ) : (
          <div className={styles.actions}>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              disabled={!named || saving !== null}
              loading={saving === 'draft'}
              onClick={() => save(true)}
            >
              Save as draft
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={!named || !priced || saving !== null}
              loading={saving === 'listed'}
            >
              Add to stock
            </Button>
          </div>
        )}
        {/* Adding or finishing has two buttons already: Cancel takes a row
            of its own under them. */}
        {editing && !isDraft ? null : (
          <ButtonLink
            href="/console/stock"
            variant="secondary"
            size="lg"
            block
            className={styles.cancel}
          >
            Cancel
          </ButtonLink>
        )}
        {named && !priced ? (
          <p className={styles.note}>
            {editing && !isDraft
              ? 'A listed item needs a price.'
              : 'Add a price to list it, or save it as a draft for now.'}
          </p>
        ) : null}
      </form>
    </ConsoleShell>
  );
}
