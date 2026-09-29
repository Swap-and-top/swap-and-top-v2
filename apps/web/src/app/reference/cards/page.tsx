/**
 * Component reference — the card system.
 *
 * Mirrors the `Cards` artboard. Useful while working on cards, since the four
 * types are rarely visible together in the app itself.
 *
 * Route: /reference/cards
 */

import type { Metadata } from 'next';
import {
  getListing,
  getShop,
  getUser,
  type RequestListing,
  type SaleListing,
  type SwapListing,
} from '@snt/core';
import { SaleCard, SwapCard, WantedCard } from '@snt/ui';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Card reference · Swap & Top',
};

export default function CardReferencePage() {
  const userSale = getListing('l-hp-probook-450') as SaleListing;
  const dealerSale = getListing('l-dell-latitude-7490') as SaleListing;
  const swap = getListing('l-macbook-swap') as SwapListing;
  const wanted = getListing('l-rtx-wanted') as RequestListing;

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>The card system</h1>
      <p className={styles.intro}>
        Four card types share one feed. A user must be able to tell them apart in
        under a second, while scrolling. Each card carries only what is needed to
        decide whether to tap.
      </p>

      <div className={styles.rows}>
        <section className={styles.row}>
          <div className={styles.sampleCol}>
            <div className={styles.label}>1 — User sale</div>
            <div className={styles.sample}>
              <SaleCard listing={userSale} seller={getUser(userSale.ownerId)} />
            </div>
          </div>
          <p className={styles.note}>
            The plainest card. Photo, price, condition, one spec line, seller and
            age. No badge — and the absence of a shop row is itself the signal: a
            buyer can tell instantly this is a private seller, which changes what
            they expect about price and negotiation.
          </p>
        </section>

        <section className={styles.row}>
          <div className={styles.sampleCol}>
            <div className={styles.label}>2 — Dealer sale</div>
            <div className={styles.sample}>
              <SaleCard listing={dealerSale} shop={getShop(dealerSale.shopId)} />
            </div>
          </div>
          <p className={styles.note}>
            Adds a shop row: logo, name, verified badge, stock count. Reads as
            commercial and accountable. Paid placement is labelled{' '}
            <strong>Sponsored</strong> on the image, never hidden — and slots are
            interleaved through the feed rather than sorted to the top.
          </p>
        </section>

        <section className={styles.row}>
          <div className={styles.sampleCol}>
            <div className={[styles.label, styles.labelAccent].join(' ')}>
              3 — Swap (the signature)
            </div>
            <div className={styles.sample}>
              <SwapCard listing={swap} seller={getUser(swap.ownerId)} />
            </div>
          </div>
          <p className={styles.note}>
            The only card with the has / looking-for split: a blue tile for what
            they have, carrying the cash, and a green tile for what they want.
            This is the card that gets screenshotted into WhatsApp, so it has to
            be recognisable at a glance and out of context.
          </p>
        </section>

        <section className={styles.row}>
          <div className={styles.sampleCol}>
            <div className={styles.label}>4 — Wanted (the dealer product)</div>
            <div className={styles.sample}>
              <WantedCard listing={wanted} requester={getUser(wanted.ownerId)} />
            </div>
          </div>
          <p className={styles.note}>
            No photo, because they do not have the thing. Text first, then the
            budget, then one button. That button is the lead a dealer pays to be
            alerted about. A request carrying a trade-in gets a trade-in strip,
            which makes it the higher-value lead.
          </p>
        </section>
      </div>
    </main>
  );
}
