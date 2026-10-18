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
import { toast } from 'sonner';
import {
  currentShop,
  newLeadCount,
  NO_STOCK_FILTERS,
  useConsoleStore,
  useListingStatusStore,
  useShopStock,
} from '@snt/core';
import {
  Button,
  ButtonLink,
  ConsoleShell,
  Field,
  ImagePlaceholder,
  listingPhoto,
  Price,
  StatusBadge,
  specSummary,
} from '@snt/ui';
import { FilterIcon, PauseIcon, PlusIcon } from '@snt/ui/icons';
import { filterStock, filtersInUse } from './filterStock';
import { StockFiltersSheet } from './StockFiltersSheet';
import styles from './page.module.css';

export default function ConsoleStockPage() {
  const { stockQuery, setStockQuery, stockFilters, setStockFilters } =
    useConsoleStore();
  const [filtering, setFiltering] = useState(false);

  // What the shop holds, with what it has added since first.
  const all = useShopStock(currentShop.id);
  const stock = filterStock(all, stockFilters, stockQuery);
  const inUse = filtersInUse(stockFilters);
  const setStatus = useListingStatusStore((state) => state.setStatus);

  /** Back on sale, said so, with a way to put it back as it was. */
  function relist(id: string, title: string, was: 'sold' | 'paused') {
    setStatus(id, 'live');
    toast.success(`${title} is live again, back in the feed.`, {
      action: { label: 'Undo', onClick: () => setStatus(id, was) },
      // Long enough to reach Undo, as on the listing's own tools.
      duration: 4500,
    });
  }

  /** Out of the feed for now, said so, with a way to put it back. */
  function pause(id: string, title: string) {
    setStatus(id, 'paused');
    toast.success(`${title} is paused, out of the feed until you resume it.`, {
      action: { label: 'Undo', onClick: () => setStatus(id, 'live') },
      duration: 4500,
    });
  }

  const count = (status: string) =>
    all.filter((listing) => listing.status === status).length;
  // The count line: what is live, then anything else there is.
  const meta = [
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
      meta={meta}
      newLeadCount={newLeadCount}
      stockCount={all.length}
      actions={
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
                <span className={styles.filterCount} aria-label={`${inUse} on`}>
                  {inUse}
                </span>
              ) : null}
            </button>
            {/* Bulk import: the fastest way to onboard a dealer is to take
                their existing list and load it. */}
            <ButtonLink href="/console/stock/import" variant="blue" size="sm">
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
      }
    >
      <div className={styles.list}>
        {/* Desktop only — the table's column headings. */}
        <div className={styles.headerRow} aria-hidden>
          <span />
          <span>Item</span>
          <span>Specs</span>
          <span>Price</span>
          <span>Status</span>
          <span className={styles.alignRight}>Views</span>
          <span className={styles.alignRight}>Reveals</span>
          <span />
        </div>

        {stock.map((listing) => {
          const isDraft = listing.status === 'draft';
          const isSale = listing.type === 'sale';

          return (
            <div key={listing.id} className={styles.row}>
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

                <span className={styles.views}>{listing.viewCount || 0}</span>

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
                {isDraft ? (
                  <ButtonLink
                    href={`/console/stock/edit/${listing.id}`}
                    variant="secondary"
                    size="sm"
                  >
                    Finish
                  </ButtonLink>
                ) : listing.status === 'sold' || listing.status === 'paused' ? (
                  <>
                    {/* Sold or paused: back to live in one tap, or open it
                        to edit as it is. */}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        relist(
                          listing.id,
                          listing.title,
                          listing.status as 'sold' | 'paused',
                        )
                      }
                    >
                      {listing.status === 'sold' ? 'Relist' : 'Resume'}
                    </Button>
                    <ButtonLink
                      href={`/console/stock/edit/${listing.id}`}
                      variant="secondary"
                      size="sm"
                    >
                      Edit
                    </ButtonLink>
                  </>
                ) : (
                  <>
                    {/* Live: pause it in one tap, or open it to edit. */}
                    <Button
                      variant="secondary"
                      size="sm"
                      iconOnly
                      aria-label={`Pause ${listing.title}`}
                      title="Pause"
                      onClick={() => pause(listing.id, listing.title)}
                    >
                      <PauseIcon size={15} />
                    </Button>
                    <ButtonLink
                      href={`/console/stock/edit/${listing.id}`}
                      variant="secondary"
                      size="sm"
                    >
                      Edit
                    </ButtonLink>
                  </>
                )}
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

      {filtering ? (
        <StockFiltersSheet
          stock={all}
          query={stockQuery}
          filters={stockFilters}
          onApply={setStockFilters}
          onClose={() => setFiltering(false)}
        />
      ) : null}
    </ConsoleShell>
  );
}
