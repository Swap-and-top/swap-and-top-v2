'use client';

/**
 * Storefront.
 *
 * The trust statistics are stock count, confirmed deals and typical reply time.
 * The confirmed-deal count replaced the year the store joined: a deal count is a
 * far stronger signal than a date.
 *
 * Wireframe artboard: `Shopfront` (its name in the design file).
 *
 * Its owner and members see Add a listing and Manage store in place of Show
 * contacts and Follow, which are a buyer's.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  CATEGORY_LABELS,
  useSessionStore,
  type Category,
  type Listing,
  type Store,
} from '@snt/core';
import {
  AppHeader,
  Bone,
  Button,
  ButtonLink,
  GridCardList,
  GridCardListSkeleton,
  Screen,
  ScreenBody,
  StoreMark,
  StatStrip,
  StatStripSkeleton,
  Chip,
  ChipRow,
  VerifiedStoreBadge,
  replyShort,
  shareLink,
  startPageLoad,
} from '@snt/ui';
import { CheckIcon, ClockIcon, InfoIcon, PinIcon, ShareIcon } from '@snt/ui/icons';
import { postStart } from './PostAs';
import { RevealAction } from './RevealAction';
import styles from './Storefront.module.css';

type StoreTab = Category | 'all';

export function Storefront({
  store,
  listings,
}: {
  store: Store;
  listings: Listing[];
}) {
  return (
    <Screen>
      {/* The feed's own header, as on every page. */}
      <AppHeader />

      <ScreenBody>
        <StorefrontBody store={store} listings={listings} />
      </ScreenBody>
    </Screen>
  );
}

/**
 * The store itself, without the page around it: on the public storefront under
 * the feed's header, and in the Store console beside its sidebar.
 */
export function StorefrontBody({
  store,
  listings,
  own = false,
}: {
  store: Store;
  listings: Listing[];
  /** Seen by the store itself, in the console: no Show contacts or Follow,
      and its live listings counted as live. */
  own?: boolean;
}) {
  const [tab, setTab] = useState<StoreTab>('all');
  const router = useRouter();
  /** The viewer's own store (owner or member), as Me knows it. */
  const mine = useSessionStore((state) => state.viewer?.stores.find((each) => each.id === store.id));

  /** Posting, as this store: chosen by pressing Add a listing. */
  function addItem() {
    startPageLoad();
    router.push(postStart(store.id));
  }

  // What the store sells, as its owner chose, with its count even at none,
  // and any other category it has listings in; every one when it has not
  // chosen yet. In the usual order.
  const chosen = store.categories ?? [];
  const categories = (Object.keys(CATEGORY_LABELS) as Category[]).filter(
    (category) =>
      chosen.length === 0 || chosen.includes(category) || listings.some((listing) => listing.category === category),
  );

  /** All, then what it sells: pills, as the feed's categories are. */
  const pills: StoreTab[] = ['all', ...categories];

  const shown =
    tab === 'all'
      ? listings
      : listings.filter((listing) => listing.category === tab);

  /** The device's own share window, else the link copied (shareLink). */
  function share() {
    // The store's public address, wherever it is shared from.
    void shareLink({ title: store.name, url: `${window.location.origin}/store/${store.slug}` });
  }

  return (
    <>
      {/* The store: one white card, as the profile page is. */}
      <section className={styles.card}>
        <div className={styles.head}>
          <StoreMark initials={store.initials} logo={store.logo} size={56} />
          <div className={styles.headBody}>
            <h1 className={styles.name}>{store.name}</h1>
            {/* For 30 days after a rename, so its record cannot be shed. */}
            {store.formerName ? (
              <p className={styles.former}>formerly {store.formerName}</p>
            ) : null}
            {store.verified ? (
              <div className={styles.badgeRow}>
                <VerifiedStoreBadge size="md" label="Verified store" />
              </div>
            ) : mine?.role === 'owner' && !own ? (
              // Its owner only: where the Verified store badge will be, the
              // same size and shape in grey, and the way to ask (small blue
              // words, as Hillary asked, 2026-11-20).
              <div className={styles.badgeRow}>
                <span className={styles.unverified}>
                  <span className={styles.unverifiedDisc} aria-hidden>
                    <CheckIcon size={12} weight={3} />
                  </span>
                  {mine.verifyPending ? (
                    'Verification asked'
                  ) : (
                    <>
                      Not verified yet ·{' '}
                      <Link href={`/store/${store.slug}/edit#verify`} className={styles.verifyLink}>
                        Verify store
                      </Link>
                    </>
                  )}
                </span>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className={styles.share}
            aria-label="Share store"
            onClick={share}
          >
            <ShareIcon size={18} />
          </button>
        </div>

        {/* What the owner wrote, where it is and when it opens, each with
            its icon; a new store has only where it is. */}
        <ul className={styles.facts}>
          {store.description ? (
            <li>
              <InfoIcon size={15} />
              <span>{store.description}</span>
            </li>
          ) : null}
          <li>
            <PinIcon size={15} />
            <span>{store.location}</span>
          </li>
          {store.openingHours ? (
            <li>
              <ClockIcon size={15} />
              <span>{store.openingHours}</span>
            </li>
          ) : null}
        </ul>

        <StatStrip
          stats={[
            { value: store.stockCount, label: own ? 'live' : 'in stock' },
            {
              value: store.confirmedDeals,
              label: 'deals confirmed',
              tone: 'trust',
            },
            { value: replyShort(store.replyHours), label: 'replies in' },
          ]}
        />

        {/* Two actions, half each; a buyer's, so not on the store's own view.
            Its owner and members get theirs instead. */}
        {own ? null : mine ? (
          <div className={styles.actions}>
            <Button size="lg" block onClick={addItem}>
              Add a listing
            </Button>
            <ButtonLink
              href={mine.paidUntil ? `/console/stock?store=${store.id}` : `/me/stores/${store.id}`}
              variant="secondary"
              size="lg"
              block
            >
              Manage store
            </ButtonLink>
          </div>
        ) : (
          <div className={styles.actions}>
            {/* The store's own number, else its owner's, from the API: calls
                and WhatsApp. Whose it is is the store itself. */}
            <RevealAction
              listingId={`store-${store.id}`}
              ownerId={store.id}
              storeId={store.id}
              channels={['call', 'whatsapp']}
            />
            <Button variant="secondary" size="lg" block>
              Follow
            </Button>
          </div>
        )}
      </section>

      {/* What it sells, as the feed's category pills: filling the width
          where they fit, scrolling sideways on a phone where they don't. */}
      <div className={styles.tabs}>
        <ChipRow fill label="Store stock by category">
          {pills.map((value) => (
            <Chip key={value} selected={tab === value} onClick={() => setTab(value)}>
              {value === 'all' ? 'All' : CATEGORY_LABELS[value]}
            </Chip>
          ))}
        </ChipRow>
      </div>

      <div className={styles.grid}>
        <GridCardList listings={shown} />
      </div>
    </>
  );
}

/**
 * The store while it loads, built from its own styles: the card with its mark,
 * name and badge, the description, the numbers with their labels, the two
 * buttons, then the tabs and the stock grid. For the public page and the
 * console's Store profile alike.
 */
export function StorefrontBodySkeleton({ own = false }: { own?: boolean }) {
  return (
    <div aria-busy aria-label="Loading the store">
      <section className={styles.card}>
        <div className={styles.head}>
          <Bone shape="block" width={56} height={56} />
          <div className={styles.headBody}>
            <Bone width="55%" height={22} />
            <Bone width={110} height={14} style={{ marginTop: 8 }} />
          </div>
          <Bone shape="circle" width={36} height={36} />
        </div>
        <div>
          <Bone width="80%" height={14} />
          <Bone width="55%" height={14} style={{ marginTop: 9 }} />
        </div>
        <StatStripSkeleton labels={[own ? 'live' : 'in stock', 'deals confirmed', 'replies in']} />
        {/* As the real pair: one over the other on a phone, since the
            contact button carries its icons. */}
        {own ? null : (
          <div className={styles.actions}>
            <Bone shape="pill" height={48} data-stack-on-phone="" />
            <Bone shape="pill" height={48} />
          </div>
        )}
      </section>

      <div className={[styles.tabs, styles.tabsLoading].join(' ')} aria-hidden>
        {[44, 70, 72, 82].map((width, n) => (
          <Bone key={n} shape="pill" width={width} height={30} />
        ))}
      </div>

      <div className={styles.grid}>
        <GridCardListSkeleton count={4} />
      </div>
    </div>
  );
}

/** The public store page while it loads: the feed's header, then the store. */
export function StorefrontSkeleton() {
  return (
    <Screen>
      <AppHeader />
      <ScreenBody>
        <StorefrontBodySkeleton />
      </ScreenBody>
    </Screen>
  );
}
