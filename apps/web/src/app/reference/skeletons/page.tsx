/**
 * Component reference — skeletons.
 *
 * Every page that waits for content has its own loading screen, built from
 * that page's own styles. With the mock data they flash by too fast to see,
 * so each can be held on screen here and compared with its page.
 * Route: /reference/skeletons
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  AppHeader,
  Button,
  SaleCardSkeleton,
  Screen,
  ScreenBody,
  SwapCardSkeleton,
  WantedCardSkeleton,
} from '@snt/ui';
import { SlowToggle } from '@/components/SlowToggle';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Skeletons · Swap & Top',
};

/** Each loading screen beside the page it stands in for. */
const SCREENS: [string, string, string][] = [
  ['Feed', 'feed', '/'],
  ['Search results', 'search?q=laptop', '/search?q=laptop'],
  ['Wanted', 'wanted', '/wanted'],
  ['A listing for sale', 'listing-sale', '/listing/iphone-11-64gb-borrowdale-7e02'],
  ['A swap', 'listing-swap', '/listing/macbook-air-2017-for-i7-16gb-mt-pleasant-7c21'],
  ['A wanted post', 'listing-wanted', '/listing/wanted-rtx-3060-12gb-harare-4d12'],
  ['A shop', 'shop', '/shop/kopje-computers'],
  ['Saved', 'saved', '/saved'],
  ['Your account', 'me', '/me'],
  ['My listings', 'me-listings', '/me/listings'],
  ['Offers', 'me-offers', '/me/offers'],
  ['Deal check', 'deal', '/deals/dc-1/confirm'],
  ['Console: Stock', 'stock', '/console/stock'],
  ['Console: Edit item', 'stock-edit', '/console/stock/edit/l-thinkpad-t480'],
  ['Console: Leads', 'leads', '/console/leads'],
  ['Console: Swap offers', 'swap-offers', '/console/trade-ins'],
  ['Console: Promote', 'promote', '/console/promote'],
  ['Console: Shop profile', 'console-shop', '/console/shop'],
];

export default function SkeletonReferencePage() {
  return (
    <Screen>
      <AppHeader />
      <ScreenBody>
        <h1 className={styles.title}>Loading skeletons</h1>
        <p className={styles.intro}>
          Shown only while a page waits for its content, and only after a
          moment, so a quick page never flashes one. Pages with nothing to
          wait for, such as sign in, the post steps, Add stock and Bulk
          import, have none. Every shape pulses together, slowly.
        </p>

        <h2 className={styles.label}>See them as they happen</h2>
        <p className={styles.note}>
          With slow pages on, every page that has a skeleton waits about
          three seconds for its content, so its skeleton stays on screen.
          Tap through the app as usual. Only while developing, never on the
          live site; turn it off here when done.
        </p>
        <SlowToggle />

        <h2 className={styles.label}>Each page, held on screen</h2>
        <ul className={styles.list}>
          {SCREENS.map(([name, loading, page]) => (
            <li key={loading} className={styles.item}>
              <span>{name}</span>
              <span className={styles.links}>
                <Link href={`/reference/loading/${loading}`}>Skeleton</Link>
                <Link href={page}>Page</Link>
              </span>
            </li>
          ))}
        </ul>

        <h2 className={styles.label}>Buttons while they work</h2>
        <p className={styles.note}>
          The first app&apos;s spinner, in the button that was pressed, which
          keeps its size and cannot be pressed again. Moving to another page
          shows a thin yellow bar along the very top instead.
        </p>
        <div className={styles.buttons}>
          <Button loading>Send offer</Button>
          <Button variant="secondary" loading>
            Decline
          </Button>
          <Button variant="blue" size="sm" loading>
            Bulk import
          </Button>
        </div>

        <h2 className={styles.label}>The feed&apos;s three cards</h2>
        <div className={styles.cards}>
          <WantedCardSkeleton />
          <SaleCardSkeleton />
          <SwapCardSkeleton />
        </div>
      </ScreenBody>
    </Screen>
  );
}
