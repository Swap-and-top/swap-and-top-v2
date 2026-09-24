/**
 * PosterRow and ShopRow.
 *
 * The "who am I dealing with" block on a listing detail screen. Both show
 * behaviour: confirmed deals, typical reply time, account age, clean record.
 */

import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Shop, User } from '@snt/core';
import { ChevronRightIcon } from '../icons';
import { Avatar, ShopMark } from '../primitives/Placeholder';
import { Panel } from '../primitives/Surface';
import { ConfirmedDealsBadge, VerifiedDealerBadge } from '../primitives/Trust';
import { monthYear, replyLabel } from '../format';
import styles from './IdentityRow.module.css';

/** A private seller or requester. */
export function PosterRow({
  user,
  trailing,
}: {
  user: User;
  /** Optional right-hand slot, e.g. a Show number button on a lead. */
  trailing?: ReactNode;
}) {
  const meta = [
    replyLabel(user.replyHours),
    `joined ${monthYear(user.joinedAt)}`,
    user.hasUpheldReports ? undefined : 'no reports',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Panel>
      <div className={styles.row}>
        <Avatar size={36} />
        <div className={styles.body}>
          <div className={styles.nameLine}>
            <span className={styles.name}>{user.displayName}</span>
            <ConfirmedDealsBadge count={user.confirmedDeals} long />
          </div>
          <div className={styles.meta}>{meta}</div>
        </div>
        {trailing ? <div className={styles.trailing}>{trailing}</div> : null}
      </div>
    </Panel>
  );
}

/** A dealer's shop, linking through to the shopfront. */
export function ShopRow({ shop }: { shop: Shop }) {
  const meta = [
    `${shop.stockCount} listings`,
    replyLabel(shop.replyHours)?.toLowerCase(),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Panel>
      <Link href={`/shop/${shop.slug}`} className={styles.row}>
        <ShopMark initials={shop.initials} size={36} />
        <div className={styles.body}>
          <div className={styles.nameLine}>
            <span className={styles.name}>{shop.name}</span>
            {shop.verified ? (
              <VerifiedDealerBadge size="md" label="Verified dealer" />
            ) : null}
          </div>
          <div className={styles.meta}>{meta}</div>
        </div>
        <span className={styles.chevron}>
          <ChevronRightIcon size={18} />
        </span>
      </Link>
    </Panel>
  );
}
