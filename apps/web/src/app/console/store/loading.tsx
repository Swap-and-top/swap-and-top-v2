/**
 * Loading: Store profile. The heading and its button are the page's own; the
 * shop itself in bones (see ShopfrontBodySkeleton).
 */

import { currentShop, newLeadCount } from '@snt/core';
import { Bone, ConsoleShell } from '@snt/ui';
import { ShopfrontBodySkeleton } from '@/components/Shopfront';
import styles from './page.module.css';

export default function Loading() {
  return (
    <ConsoleShell
      shop={currentShop}
      title="Store profile"
      meta="Your store as buyers find it"
      newLeadCount={newLeadCount}
      actions={
        <div className={styles.toolbar}>
          <Bone shape="pill" width={200} height={30} />
          <Bone shape="pill" width={150} height={36} />
        </div>
      }
    >
      <div className={styles.shop}>
        <ShopfrontBodySkeleton />
      </div>
    </ConsoleShell>
  );
}
