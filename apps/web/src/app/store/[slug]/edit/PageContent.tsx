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
 */

import { useEffect, useId, useState, type FormEvent } from 'react';
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
import { refreshStore } from '@/lib/refresh';
import { apiAsViewer, fetchViewer, supabase } from '@/lib/supabase';
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

export default function EditStorePage({ slug }: { slug: string }) {
  const router = useRouter();
  const townLabel = useId();
  const known = useSessionStore((state) => state.viewer !== null);
  const mine = useSessionStore((state) => state.viewer?.stores.find((store) => store.slug === slug));
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState('');
  /** As loaded, for the "formerly" note and the close sheet. */
  const [savedName, setSavedName] = useState('');
  /** The name shown as "formerly …" after a rename: the one already
      showing from a rename this month, else the name now. */
  const [formerName, setFormerName] = useState('');
  /** Verified store: a new name pauses it. */
  const [verified, setVerified] = useState(false);
  const [phone, setPhone] = useState('');
  // The store's own number, once who they are has loaded.
  const storeId = mine?.id;
  const storePhone = mine?.phone ?? '';
  useEffect(() => {
    if (storeId) setPhone(storePhone);
  }, [storeId, storePhone]);
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState('');
  const [area, setArea] = useState('');
  const [town, setTown] = useState<Town>(DEFAULT_TOWN);
  const [busy, setBusy] = useState(false);
  /** The check before closing it is open. */
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    let gone = false;
    void fetch(`/api/stores/${encodeURIComponent(slug)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then(
        (
          store: {
            name: string;
            formerName?: string;
            verified: boolean;
            description: string;
            openingHours: string;
            location: string;
          } | null,
        ) => {
        if (gone || !store) return;
        const place = splitPlace(store.location);
        setName(store.name);
        setSavedName(store.name);
        setFormerName(store.formerName ?? store.name);
        setVerified(store.verified);
        setDescription(store.description);
        setHours(store.openingHours);
        setArea(place.area);
        setTown(place.town);
        setLoaded(true);
      })
      .catch(() => undefined);
    return () => {
      gone = true;
    };
  }, [slug]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!mine) return;
    if (name.trim().length < 2) {
      toast.error('Enter the store’s name.');
      return;
    }
    if (!area.trim()) {
      toast.error('Enter the store’s neighbourhood.');
      return;
    }
    setBusy(true);
    const { error } = await apiAsViewer(`/stores/${encodeURIComponent(mine.id)}`, {
      method: 'PATCH',
      body: {
        name: name.trim(),
        phone: phone.trim(),
        description: description.trim(),
        openingHours: hours.trim(),
        location: `${area.trim()}, ${town}`,
      },
    });
    if (error) {
      setBusy(false);
      toast.error(error);
      return;
    }
    // A new name shows on Me and in the console at once.
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;
    if (token) useSessionStore.setState({ viewer: await fetchViewer(token) });
    await refreshStore(slug);
    toast.success('Store details saved');
    startPageLoad();
    router.push(`/store/${slug}`);
  }

  async function closeStore() {
    if (!mine) return;
    setBusy(true);
    const { error } = await apiAsViewer(`/stores/${encodeURIComponent(mine.id)}/close`, { method: 'POST' });
    if (error) {
      setBusy(false);
      toast.error(error);
      return;
    }
    // Who they are now leaves the store out, for Me and Post as.
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;
    if (token) useSessionStore.setState({ viewer: await fetchViewer(token) });
    await refreshStore(slug);
    toast.success(`${savedName} is closed`);
    startPageLoad();
    router.push('/me');
  }

  const owner = mine?.role === 'owner';
  /** The owner's own number, "077 123 4567", for "we will call you". */
  const ownerPhone = useSessionStore((state) => {
    const phone = state.viewer?.phone;
    return phone ? `0${phone.slice(4, 6)} ${phone.slice(6, 9)} ${phone.slice(9)}` : undefined;
  });

  return (
    <Screen>
      <AppHeader />
      <ScreenBody>
        <SignInGate>
          <Stack gap={6}>
            <h1 className={styles.title}>Edit store details</h1>
            {!known ? null : !owner ? (
              <Panel padded>
                <p className={styles.lead}>Only the store’s owner can change its details.</p>
              </Panel>
            ) : loaded ? (
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
                    <Button type="submit" size="lg" block loading={busy}>
                      Save
                    </Button>
                  </Stack>
                </form>
              </Panel>
            ) : null}
            {owner && loaded && mine ? <VerifyPanel storeId={mine.id} phone={ownerPhone} /> : null}
            {owner && loaded ? (
              <Button variant="secondary" block className={styles.close} onClick={() => setClosing(true)}>
                Close store
              </Button>
            ) : null}
            {closing ? (
              <Sheet narrow title={`Close ${savedName}`} onClose={() => setClosing(false)}>
                <Stack gap={4}>
                  <p className={styles.lead}>
                    Are you sure you want to close {savedName}? Its page and its listings come down
                    for everyone, staff lose access, and any store pass time left is lost. It
                    can’t be opened again. Your own account and listings stay as they are.
                  </p>
                  <Button variant="secondary" size="lg" block onClick={() => setClosing(false)}>
                    Keep the store
                  </Button>
                  <Button size="lg" block className={styles.closeConfirm} loading={busy} onClick={() => void closeStore()}>
                    Close store
                  </Button>
                </Stack>
              </Sheet>
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
