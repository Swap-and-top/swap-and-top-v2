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

import {
  currentShop,
  getShopListings,
  newLeadCount,
  useConsoleStore,
} from '@snt/core';
import {
  Button,
  ConsoleShell,
  Field,
  ImagePlaceholder,
  listingPhoto,
  Price,
  StatusBadge,
  specSummary,
} from '@snt/ui';
import { FilterIcon, PlusIcon } from '@snt/ui/icons';
import styles from './page.module.css';

export default function ConsoleStockPage() {
  const { stockQuery, setStockQuery } = useConsoleStore();

  const all = getShopListings(currentShop.id);

  const stock = all.filter((listing) => {
    if (!stockQuery.trim()) return true;
    return listing.title.toLowerCase().includes(stockQuery.trim().toLowerCase());
  });

  const live = all.filter((listing) => listing.status === 'live').length;
  const sold = all.filter((listing) => listing.status === 'sold').length;
  const drafts = all.filter((listing) => listing.status === 'draft').length;

  return (
    <ConsoleShell
      shop={currentShop}
      title="Stock"
      meta={`${live} live · ${sold} sold this week · ${drafts} draft`}
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
            <Button variant="secondary" size="sm">
              <FilterIcon size={16} />
              Filters
            </Button>
            {/* Bulk import: the fastest way to onboard a dealer is to take
                their existing list and load it. */}
            <Button variant="outline" size="sm">
              Bulk import
            </Button>
            <Button size="sm">
              <PlusIcon size={17} />
              Add stock
            </Button>
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
            <div
              key={listing.id}
              className={[
                styles.row,
                isDraft ? styles.rowDraft : '',
                listing.promotion === 'sponsored' ? styles.rowSponsored : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
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
                  <Price amount={listing.price} size="sm" />
                ) : (
                  <span className={styles.noPrice}>No price yet</span>
                )}

                <StatusBadge
                  status={listing.status}
                  sponsored={listing.promotion === 'sponsored'}
                />

                <span className={styles.views}>
                  {listing.viewCount || '—'}
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
                    '—'
                  )}
                </span>
              </span>

              <span className={styles.action}>
                {isDraft ? (
                  <Button variant="secondary" size="sm">
                    Finish
                  </Button>
                ) : listing.status === 'sold' ? (
                  <Button variant="secondary" size="sm">
                    Relist
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm">
                    Edit
                  </Button>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {/* Phone only — a single thumb-reachable action. */}
      <div className={styles.addBar}>
        <Button size="lg" block>
          <PlusIcon size={19} />
          Add stock
        </Button>
      </div>
    </ConsoleShell>
  );
}
