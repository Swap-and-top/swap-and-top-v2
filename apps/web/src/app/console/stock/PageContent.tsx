'use client';

/**
 * Console — Stock.
 *
 * Renders both wireframe artboards: `ConsoleStockM` at phone width and
 * `ConsoleStockD` from `lg` up. Same component, same markup, different grid.
 *
 * The reveal count per item is the point of this screen: it is the dealer's
 * evidence that the platform delivers, visible every time they open it.
 */

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  currentShop,
  newLeadCount,
  NO_STOCK_FILTERS,
  useConsoleStore,
  useListingStatusStore,
  useShopStock,
  useSponsorStore,
  type Listing,
  type ListingStatus,
  type StockTab,
} from '@snt/core';
import {
  ActionMenu,
  Button,
  ButtonLink,
  ConsoleShell,
  Field,
  ImagePlaceholder,
  listingPhoto,
  type MenuAction,
  Price,
  StatusBadge,
  Tabs,
  specSummary,
} from '@snt/ui';
import {
  CheckIcon,
  CloseIcon,
  EyeIcon,
  FilterIcon,
  MegaphoneIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  TrashIcon,
} from '@snt/ui/icons';
import { SponsorSheet } from '@/components/sponsor/SponsorSheet';
import { BoostedTab } from './BoostedTab';
import { filterStock, filtersInUse } from './filterStock';
import { StockFiltersSheet } from './StockFiltersSheet';
import styles from './page.module.css';

export default function ConsoleStockPage() {
  const {
    stockQuery,
    setStockQuery,
    stockFilters,
    setStockFilters,
    stockTab,
    setStockTab,
  } = useConsoleStore();
  const [filtering, setFiltering] = useState(false);
  /** The boost sheet, when open: on one item, or to pick one. */
  const [sponsoring, setSponsoring] = useState<{ listingId?: string } | null>(
    null,
  );

  // What the shop holds, with what it has added since first.
  const all = useShopStock(currentShop.id);
  const stock = filterStock(all, stockFilters, stockQuery);
  const inUse = filtersInUse(stockFilters);
  const setStatus = useListingStatusStore((state) => state.setStatus);
  const sponsorships = useSponsorStore((state) => state.sponsorships);
  const stopBoost = useSponsorStore((state) => state.stop);
  const restoreBoost = useSponsorStore((state) => state.restore);

  /** Stops an item's boost at once, says so, and offers to put it back. */
  function stop(listing: Listing) {
    const running = sponsorships.find((s) => s.listingId === listing.id);
    if (!running) return;
    stopBoost(listing.id);
    toast.success(`${listing.title} is no longer boosted.`, {
      action: { label: 'Undo', onClick: () => restoreBoost(running) },
      duration: 4500,
    });
  }

  /**
   * Changes an item's status at once, says so, and offers to put it back
   * as it was: from a row's three dot menu.
   */
  function change(listing: Listing, next: ListingStatus, told: string) {
    const was = listing.status;
    setStatus(listing.id, next);
    toast.success(told, {
      action: { label: 'Undo', onClick: () => setStatus(listing.id, was) },
      // Long enough to reach Undo, as on the listing's own tools.
      duration: 4500,
    });
  }

  /** What a row's menu offers, for where the item stands. */
  function actionsFor(listing: Listing): MenuAction[] {
    const edit = `/console/stock/edit/${listing.id}`;
    // The listing as a buyer sees it, the owner's tools hidden.
    const view = `/listing/${listing.slug}/preview`;
    const name = listing.title;
    const remove: MenuAction = {
      label: 'Delete',
      icon: <TrashIcon size={17} />,
      danger: true,
      onSelect: () => change(listing, 'withdrawn', `${name} is deleted.`),
    };

    switch (listing.status) {
      case 'draft':
        return [
          { label: 'Finish draft', icon: <PencilIcon size={17} />, href: edit },
          remove,
        ];
      case 'paused':
        return [
          { label: 'Edit item', icon: <PencilIcon size={17} />, href: edit },
          {
            label: 'Resume listing',
            icon: <PlayIcon size={16} />,
            onSelect: () =>
              change(
                listing,
                'live',
                `${name} is live again, back in the feed.`,
              ),
          },
          {
            label: 'Mark as sold',
            icon: <CheckIcon size={17} weight={2.2} />,
            onSelect: () => change(listing, 'sold', `${name} is marked sold.`),
          },
          remove,
        ];
      case 'sold':
        return [
          { label: 'Edit item', icon: <PencilIcon size={17} />, href: edit },
          {
            label: 'Relist',
            icon: <PlayIcon size={16} />,
            onSelect: () =>
              change(
                listing,
                'live',
                `${name} is live again, back in the feed.`,
              ),
          },
          { label: 'View as a buyer', icon: <EyeIcon size={17} />, href: view },
          remove,
        ];
      default:
        return [
          { label: 'Edit item', icon: <PencilIcon size={17} />, href: edit },
          // A live item for sale: boost it; while a boost runs, extend it
          // or stop it, all here, where the item is looked after.
          ...(listing.type === 'sale'
            ? [
                {
                  label:
                    listing.promotion === 'sponsored'
                      ? 'Extend boost'
                      : 'Boost this listing',
                  icon: <MegaphoneIcon size={17} weight={1.9} />,
                  onSelect: () => setSponsoring({ listingId: listing.id }),
                },
              ]
            : []),
          ...(listing.promotion === 'sponsored'
            ? [
                {
                  label: 'Stop boost',
                  icon: <CloseIcon size={16} />,
                  onSelect: () => stop(listing),
                },
              ]
            : []),
          {
            label: 'Pause listing',
            icon: <PauseIcon size={15} />,
            onSelect: () =>
              change(
                listing,
                'paused',
                `${name} is paused, out of the feed until you resume it.`,
              ),
          },
          {
            label: 'Mark as sold',
            icon: <CheckIcon size={17} weight={2.2} />,
            onSelect: () => change(listing, 'sold', `${name} is marked sold.`),
          },
          { label: 'View as a buyer', icon: <EyeIcon size={17} />, href: view },
          remove,
        ];
    }
  }

  const count = (status: string) =>
    all.filter((listing) => listing.status === status).length;
  // The count line: what is live, then anything else there is.
  const summary = [
    `${count('live')} live`,
    count('paused') ? `${count('paused')} paused` : '',
    count('sold') ? `${count('sold')} sold this week` : '',
    count('draft')
      ? `${count('draft')} ${count('draft') === 1 ? 'draft' : 'drafts'}`
      : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <ConsoleShell
      shop={currentShop}
      title="Stock"
      newLeadCount={newLeadCount}
      stockCount={all.length}
      actions={
        <>
          {/* Everything held, and what is boosted: boosting kept in
              sight, a tap away. */}
          <div className={styles.tabs}>
            <Tabs<StockTab>
              tabs={[
                { value: 'stock', label: 'Stock', count: all.length },
                {
                  value: 'boosted',
                  label: 'Boosted',
                  count: all.filter((l) => l.promotion === 'sponsored').length,
                },
              ]}
              active={stockTab}
              onChange={setStockTab}
              label="Stock or boosted"
            />
          </div>
          {stockTab === 'stock' ? (
            <div className={styles.toolbar}>
              <Field
                label="Search stock"
                hideLabel
                type="search"
                placeholder="Search your stock"
                value={stockQuery}
                onChange={(event) => setStockQuery(event.target.value)}
                size="sm"
                filled
                className={styles.search}
              />
              <div className={styles.toolbarActions}>
                {/* The feed's own Filter button: a blue outlined pill, solid
                while its filters are open, with a count of those in use. */}
                <button
                  type="button"
                  className={[styles.filter, filtering ? styles.filterOn : '']
                    .filter(Boolean)
                    .join(' ')}
                  aria-expanded={filtering}
                  onClick={() => setFiltering(true)}
                >
                  <FilterIcon size={15} weight={2} />
                  Filters
                  {inUse > 0 ? (
                    <span
                      className={styles.filterCount}
                      aria-label={`${inUse} on`}
                    >
                      {inUse}
                    </span>
                  ) : null}
                </button>
                {/* Bulk import: the fastest way to onboard a dealer is to take
                their existing list and load it. */}
                <ButtonLink
                  href="/console/stock/import"
                  variant="blue"
                  size="sm"
                >
                  Bulk import
                </ButtonLink>
                <ButtonLink
                  href="/console/stock/new"
                  size="sm"
                  className={styles.wideOnly}
                >
                  <PlusIcon size={17} />
                  Add stock
                </ButtonLink>
              </div>
            </div>
          ) : null}
        </>
      }
    >
      {stockTab === 'boosted' ? (
        <BoostedTab
          stock={all}
          onBoost={(listingId) => setSponsoring({ listingId })}
        />
      ) : (
        <>
          {/* What there is, just above the table. */}
          <p className={styles.summary}>{summary}</p>
          <div className={styles.list}>
            {/* Desktop only — the table's column headings. */}
            <div className={styles.headerRow} aria-hidden>
              <span />
              <span>Item</span>
              <span>Specs</span>
              <span>Price</span>
              <span>Status</span>
              <span className={styles.alignRight}>In stock</span>
              <span className={styles.alignRight}>Views</span>
              <span className={styles.alignRight}>Reveals</span>
              <span />
            </div>

            {stock.map((listing) => {
              const isDraft = listing.status === 'draft';
              const isSale = listing.type === 'sale';

              return (
                <div key={listing.id} className={styles.row}>
                  {/* The whole row opens the item to edit (a draft, to finish):
                  a link stretched over it, under the menu button. */}
                  <Link
                    href={`/console/stock/edit/${listing.id}`}
                    className={styles.rowLink}
                    aria-label={`${isDraft ? 'Finish' : 'Edit'} ${listing.title}`}
                  />
                  <ImagePlaceholder
                    src={listingPhoto(listing)}
                    height={44}
                    width={44}
                    small
                    empty={isDraft}
                    className={styles.thumb}
                  />

                  <span className={styles.title}>{listing.title}</span>

                  <span className={styles.specs}>
                    {isSale && !isDraft
                      ? specSummary(listing.item, 4)
                      : isDraft
                        ? 'Needs specs and photos'
                        : listing.title}
                  </span>

                  <span className={styles.meta}>
                    {isSale && !isDraft ? (
                      <Price
                        amount={listing.price}
                        size="sm"
                        className={styles.price}
                      />
                    ) : (
                      <span className={styles.noPrice}>No price yet</span>
                    )}

                    <StatusBadge
                      status={listing.status}
                      sponsored={listing.promotion === 'sponsored'}
                    />

                    {/* How many the shop holds; one when no number is given. */}
                    <span className={styles.inStock}>
                      {listing.type === 'sale' ? (listing.stockCount ?? 1) : 1}
                    </span>

                    <span className={styles.views}>
                      {listing.viewCount || 0}
                    </span>

                    <span className={styles.reveals}>
                      {listing.revealCount > 0 ? (
                        <>
                          <span className={styles.revealsValue}>
                            {listing.revealCount}
                          </span>{' '}
                          reveals
                        </>
                      ) : (
                        'No reveals'
                      )}
                    </span>
                  </span>

                  <span className={styles.action}>
                    <ActionMenu
                      label={`More for ${listing.title}`}
                      actions={actionsFor(listing)}
                    />
                  </span>
                </div>
              );
            })}

            {/* Searched or filtered down to nothing: say so, and the way back. */}
            {stock.length === 0 ? (
              <div className={styles.none}>
                <p>Nothing in your stock matches.</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setStockQuery('');
                    setStockFilters(NO_STOCK_FILTERS);
                  }}
                >
                  Show everything
                </Button>
              </div>
            ) : null}
          </div>

          {/* Phone only — a single thumb-reachable action. */}
          <div className={styles.addBar}>
            <ButtonLink href="/console/stock/new" size="lg" block>
              <PlusIcon size={19} />
              Add stock
            </ButtonLink>
          </div>
        </>
      )}

      {filtering ? (
        <StockFiltersSheet
          stock={all}
          query={stockQuery}
          filters={stockFilters}
          onApply={setStockFilters}
          onClose={() => setFiltering(false)}
        />
      ) : null}

      {sponsoring ? (
        <SponsorSheet
          listingId={sponsoring.listingId}
          onClose={() => setSponsoring(null)}
        />
      ) : null}
    </ConsoleShell>
  );
}
