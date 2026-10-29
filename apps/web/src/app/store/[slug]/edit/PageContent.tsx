'use client';

/**
 * Edit store details (docs/product/accounts-and-stores.md): the name, the
 * store's phone number, the description, opening hours and area. A new name
 * shows "formerly …" under it on the store page for 30 days. The phone number
 * is for calls and WhatsApp; empty, the owner's own is used. The web address
 * does not change. Reached from Me and the console's Store profile.
 * Staff and others are told it is the owner's.
 *
 * At its foot, Close store, with a check first: its page and listings come
 * down for everyone, staff lose access, any pass time left goes; the owner
 * carries on as a person.
 *
 * The store is loaded through TanStack Query; the form is drawn once it has
 * come, starting from what was loaded, and saving and closing are mutations.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useId, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DEFAULT_TOWN, TOWNS, useSessionStore, type Town } from '@snt/core';
import {
  AppHeader,
  Button,
  ButtonLink,
  Dropdown,
  Field,
  FieldRow,
  Footer,
  Panel,
  Screen,
  ScreenBody,
  Sheet,
  SignInGate,
  Stack,
  startPageLoad,
} from '@snt/ui';
import { apiSend, publicGet, QueryProblem } from '@/lib/query';
import { refreshStore } from '@/lib/refresh';
import { refreshViewer } from '@/lib/viewer';
import { VerifyPanel } from './VerifyPanel';
import styles from './page.module.css';

const TOWN_OPTIONS = TOWNS.map((town) => ({ value: town, label: town }));

/** "Avondale, Harare" → its neighbourhood and town; a place without a known
    town stays whole, on Harare. */
function splitPlace(place: string): { area: string; town: Town } {
  const at = place.lastIndexOf(',');
  const town = at > 0 ? place.slice(at + 1).trim() : '';
  return (TOWNS as readonly string[]).includes(town)
    ? { area: place.slice(0, at).trim(), town: town as Town }
    : { area: place.trim(), town: DEFAULT_TOWN };
}

/** The store's details as its page has them. */
interface StoreDetails {
  name: string;
  formerName?: string;
  verified: boolean;
  description: string;
  openingHours: string;
  location: string;
}

type Mine = { id: string; role: 'owner' | 'staff'; phone?: string };

export default function EditStorePage({ slug }: { slug: string }) {
  const known = useSessionStore((state) => state.viewer !== null);
  const mine = useSessionStore((state) => state.viewer?.stores.find((store) => store.slug === slug));
  const owner = mine?.role === 'owner';
  const loaded = useQuery({
    queryKey: ['store', slug, 'page'],
    queryFn: () => publicGet<StoreDetails>(`/stores/${encodeURIComponent(slug)}`),
  });

  return (
    <Screen>
      <AppHeader />
      <ScreenBody>
        <SignInGate>
          <Stack gap={6}>
            <h1 className={styles.title}>Edit store details</h1>
            {!known ? null : !owner || !mine ? (
              <Panel padded>
                <p className={styles.lead}>Only the store’s owner can change its details.</p>
              </Panel>
            ) : loaded.isError ? (
              <QueryProblem error={loaded.error} onRetry={() => void loaded.refetch()} />
            ) : loaded.data ? (
              <StoreForm slug={slug} mine={mine} store={loaded.data} />
            ) : null}
            <ButtonLink href="/me" variant="secondary" block>
              Cancel
            </ButtonLink>
          </Stack>
        </SignInGate>
      </ScreenBody>
      <Footer />
    </Screen>
  );
}

/** The form, its Verified store panel and Close store, from the store as loaded. */
function StoreForm({ slug, mine, store }: { slug: string; mine: Mine; store: StoreDetails }) {
  const router = useRouter();
  const townLabel = useId();
  const queryClient = useQueryClient();
  const place = splitPlace(store.location);
  const [name, setName] = useState(store.name);
  /** As loaded, for the "formerly" note and the close sheet. */
  const savedName = store.name;
  /** The name shown as "formerly …" after a rename: the one already
      showing from a rename this month, else the name now. */
  const formerName = store.formerName ?? store.name;
  /** Verified store: a new name pauses it. */
  const verified = store.verified;
  const [phone, setPhone] = useState(mine.phone ?? '');
  const [description, setDescription] = useState(store.description);
  const [hours, setHours] = useState(store.openingHours);
  const [area, setArea] = useState(place.area);
  const [town, setTown] = useState<Town>(place.town);
  /** The check before closing it is open. */
  const [closing, setClosing] = useState(false);
  /** The owner's own number, "077 123 4567", for "we will call you". */
  const ownerPhone = useSessionStore((state) => {
    const own = state.viewer?.phone;
    return own ? `0${own.slice(4, 6)} ${own.slice(6, 9)} ${own.slice(9)}` : undefined;
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiSend(`/stores/${encodeURIComponent(mine.id)}`, 'PATCH', {
        name: name.trim(),
        phone: phone.trim(),
        description: description.trim(),
        openingHours: hours.trim(),
        location: `${area.trim()}, ${town}`,
      });
      // A new name shows on Me and in the console at once.
      await refreshViewer(queryClient);
      await refreshStore(slug);
    },
    onSuccess: () => {
      toast.success('Store details saved');
      startPageLoad();
      router.push(`/store/${slug}`);
    },
    onError: (error) => toast.error(error.message),
  });

  const closeMutation = useMutation({
    mutationFn: async () => {
      await apiSend(`/stores/${encodeURIComponent(mine.id)}/close`, 'POST');
      // Who they are now leaves the store out, for Me and Post as.
      await refreshViewer(queryClient);
      await refreshStore(slug);
    },
    onSuccess: () => {
      toast.success(`${savedName} is closed`);
      startPageLoad();
      router.push('/me');
    },
    onError: (error) => toast.error(error.message),
  });
  const busy = saveMutation.isPending || closeMutation.isPending;

  function save(event: FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2) {
      toast.error('Enter the store’s name.');
      return;
    }
    if (!area.trim()) {
      toast.error('Enter the store’s neighbourhood.');
      return;
    }
    saveMutation.mutate();
  }

  return (
    <>
      <Panel padded>
        <form onSubmit={save}>
          <Stack gap={5}>
            <p className={styles.lead}>{savedName}, as buyers see it on its page.</p>
            <Field
              label="Store name"
              placeholder="e.g. Kopje Computers"
              maxLength={60}
              value={name}
              onChange={(event) => setName(event.target.value)}
              hint={
                name.trim() !== savedName && name.trim() !== formerName
                  ? `Your store page will show “formerly ${formerName}” for 30 days.${
                      verified ? ' Verified store pauses until we check again.' : ''
                    }`
                  : undefined
              }
            />
            <Field
              label="Store phone number"
              placeholder="e.g. 077 123 4567"
              inputMode="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              hint="For calls and WhatsApp. Leave it empty to use your own number."
            />
            <label className={styles.field}>
              <span className={styles.label}>About the store</span>
              <textarea
                className={styles.textarea}
                rows={3}
                maxLength={300}
                placeholder="e.g. Laptops, phones and parts. Swaps welcome."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
            <Field
              label="Opening hours"
              placeholder="e.g. Mon to Sat, 8am to 5pm"
              maxLength={80}
              value={hours}
              onChange={(event) => setHours(event.target.value)}
            />
            <FieldRow>
              <Field
                label="Neighbourhood"
                placeholder="e.g. Avondale"
                value={area}
                onChange={(event) => setArea(event.target.value)}
              />
              <div className={styles.town}>
                <span id={townLabel} className={styles.label}>
                  City or town
                </span>
                <Dropdown value={town} options={TOWN_OPTIONS} onChange={setTown} labelledBy={townLabel} />
              </div>
            </FieldRow>
            <Button type="submit" size="lg" block loading={saveMutation.isPending} disabled={busy}>
              Save
            </Button>
          </Stack>
        </form>
      </Panel>
      <VerifyPanel storeId={mine.id} phone={ownerPhone} />
      <Button variant="secondary" block className={styles.close} onClick={() => setClosing(true)}>
        Close store
      </Button>
      {closing ? (
        <Sheet narrow title={`Close ${savedName}`} onClose={() => setClosing(false)}>
          <Stack gap={4}>
            <p className={styles.lead}>
              Are you sure you want to close {savedName}? Its page and its listings come down for everyone,
              staff lose access, and any store pass time left is lost. It can’t be opened again. Your own
              account and listings stay as they are.
            </p>
            <Button variant="secondary" size="lg" block onClick={() => setClosing(false)}>
              Keep the store
            </Button>
            <Button
              size="lg"
              block
              className={styles.closeConfirm}
              loading={closeMutation.isPending}
              onClick={() => closeMutation.mutate()}
            >
              Close store
            </Button>
          </Stack>
        </Sheet>
      ) : null}
    </>
  );
}
