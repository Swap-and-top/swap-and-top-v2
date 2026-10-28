'use client';

/**
 * Edit store details: what an owner changes freely (docs/product/
 * accounts-and-stores.md), the description, opening hours and area. The name
 * and web address are not here; changing them pauses the Verified store
 * badge, which comes later. Reached from Me and the console's Store profile.
 * Staff and others are told it is the owner's.
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
  SignInGate,
  Stack,
  startPageLoad,
} from '@snt/ui';
import { refreshStore } from '@/lib/refresh';
import { apiAsViewer } from '@/lib/supabase';
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
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState('');
  const [area, setArea] = useState('');
  const [town, setTown] = useState<Town>(DEFAULT_TOWN);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let gone = false;
    void fetch(`/api/stores/${encodeURIComponent(slug)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((store: { name: string; description: string; openingHours: string; location: string } | null) => {
        if (gone || !store) return;
        const place = splitPlace(store.location);
        setName(store.name);
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
    if (!area.trim()) {
      toast.error('Enter the store’s neighbourhood.');
      return;
    }
    setBusy(true);
    const { error } = await apiAsViewer(`/stores/${encodeURIComponent(mine.id)}`, {
      method: 'PATCH',
      body: { description: description.trim(), openingHours: hours.trim(), location: `${area.trim()}, ${town}` },
    });
    if (error) {
      setBusy(false);
      toast.error(error);
      return;
    }
    await refreshStore(slug);
    toast.success('Store details saved');
    startPageLoad();
    router.push(`/store/${slug}`);
  }

  const owner = mine?.role === 'owner';

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
                    <p className={styles.lead}>{name}, as buyers see it on its page.</p>
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
