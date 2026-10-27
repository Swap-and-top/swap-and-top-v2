'use client';

/**
 * Console — Sponsored items: every item the shop has sponsored now, as a
 * table, each with its own actions. Reached from Stats ("Manage sponsored
 * items"), not the menu. A row: the item and when it ends, its daily
 * budget and about how many people that reaches, what it has cost so far,
 * its reveals since, and a menu to Extend, see it as a buyer, or Stop
 * (with Undo). "Sponsor an item" sits at the top.
 */

import { useState } from 'react';
import { toast } from 'sonner';
import {
  currentShop,
  dollars,
  getListing,
  newLeadCount,
  reachPerDay,
  useShopSponsorships,
  useSponsorStore,
  type Sponsorship,
} from '@snt/core';
import {
  ActionMenu,
  Button,
  ButtonLink,
  ConsoleShell,
  ImagePlaceholder,
  listingPhoto,
  type MenuAction,
} from '@snt/ui';
import {
  ChevronLeftIcon,
  EyeIcon,
  MegaphoneIcon,
  TrashIcon,
} from '@snt/ui/icons';
import { SponsorSheet } from '@/components/sponsor/SponsorSheet';
import styles from './page.module.css';

export default function SponsoredItemsPage() {
  // The shop's own: other people sponsor their listings too.
  const sponsorships = useShopSponsorships(currentShop.id);
  const stop = useSponsorStore((state) => state.stop);
  const restore = useSponsorStore((state) => state.restore);
  /** The Sponsor sheet: for an item (to extend), or to pick one. */
  const [sheet, setSheet] = useState<{ listingId?: string } | null>(null);

  const perDay = sponsorships.reduce((sum, s) => sum + s.dailyBudget, 0);

  function stopOne(s: Sponsorship, name: string) {
    stop(s.listingId);
    toast.success(`${name} is no longer sponsored.`, {
      action: { label: 'Undo', onClick: () => restore(s) },
      duration: 4500,
    });
  }

  function actionsFor(
    s: Sponsorship,
    name: string,
    slug?: string,
  ): MenuAction[] {
    return [
      {
        label: 'Extend',
        icon: <MegaphoneIcon size={17} weight={1.9} />,
        onSelect: () => setSheet({ listingId: s.listingId }),
      },
      ...(slug
        ? [
            {
              label: 'View as a buyer',
              icon: <EyeIcon size={17} />,
              href: `/listing/${slug}/preview`,
            },
          ]
        : []),
      {
        label: 'Stop sponsoring',
        icon: <TrashIcon size={17} />,
        danger: true,
        onSelect: () => stopOne(s, name),
      },
    ];
  }

  return (
    <ConsoleShell
      shop={currentShop}
      title="Sponsored items"
      meta={
        sponsorships.length > 0
          ? `${sponsorships.length} running · ${dollars(perDay)} a day in all`
          : 'Nothing sponsored right now'
      }
      newLeadCount={newLeadCount}
      actions={
        <div className={styles.toolbar}>
          <ButtonLink href="/console/stats" variant="secondary" size="sm">
            <ChevronLeftIcon size={16} />
            Back to stats
          </ButtonLink>
          <Button size="sm" onClick={() => setSheet({})}>
            Sponsor an item
          </Button>
        </div>
      }
    >
      {sponsorships.length === 0 ? (
        <p className={styles.none}>
          Nothing is sponsored. Sponsor an item to show it in a labelled slot
          in the feed, from $1 a day.
        </p>
      ) : (
        <div className={styles.list}>
          {/* Wide screens only: the column headings. */}
          <div className={styles.headerRow} aria-hidden>
            <span />
            <span>Item</span>
            <span>Daily budget</span>
            <span>Reach a day</span>
            <span>Spent</span>
            <span>Reveals since</span>
            <span />
          </div>

          {sponsorships.map((s) => {
            const listing = getListing(s.listingId);
            const name = listing?.title ?? 'An item';
            const [low, high] = reachPerDay(s.dailyBudget);
            return (
              <div key={s.listingId} className={styles.row}>
                {listing ? (
                  <ImagePlaceholder
                    src={listingPhoto(listing)}
                    height={44}
                    width={44}
                    small
                    className={styles.thumb}
                  />
                ) : (
                  <span />
                )}
                <span className={styles.item}>
                  <span className={styles.name}>{name}</span>
                  <span className={styles.until}>
                    Until {s.endsLabel} · {s.daysLeft}{' '}
                    {s.daysLeft === 1 ? 'day' : 'days'} left
                  </span>
                </span>
                <span className={styles.budget}>
                  {dollars(s.dailyBudget)}
                  <span className={styles.small}> a day</span>
                </span>
                <span className={styles.reach}>
                  {low.toLocaleString('en-US')} to{' '}
                  {high.toLocaleString('en-US')}
                </span>
                <span className={styles.spent}>{dollars(s.spent)}</span>
                <span className={styles.reveals}>
                  {s.revealsSince > 0 ? (
                    <>
                      {s.revealsSince}
                      {s.lift ? (
                        <span className={styles.small}> · {s.lift}</span>
                      ) : null}
                    </>
                  ) : (
                    <span className={styles.small}>
                      Started {s.startedLabel}
                    </span>
                  )}
                </span>
                {/* A phone's card: the figures in one quiet line. */}
                <span className={styles.phoneMeta}>
                  {dollars(s.dailyBudget)} a day · about{' '}
                  {low.toLocaleString('en-US')} to{' '}
                  {high.toLocaleString('en-US')} people a day ·{' '}
                  {dollars(s.spent)} spent
                  {s.revealsSince > 0
                    ? ` · ${s.revealsSince} reveals since`
                    : ''}
                </span>
                <span className={styles.action}>
                  <ActionMenu
                    label={`More for ${name}`}
                    actions={actionsFor(s, name, listing?.slug)}
                  />
                </span>
              </div>
            );
          })}
        </div>
      )}

      {sheet ? (
        <SponsorSheet
          listingId={sheet.listingId}
          onClose={() => setSheet(null)}
        />
      ) : null}
    </ConsoleShell>
  );
}
