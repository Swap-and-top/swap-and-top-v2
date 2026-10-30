/**
 * Loading: Store profile. The heading and its button are the page's own; the
 * store itself in bones (see StorefrontBodySkeleton).
 */

import { currentStore } from '@snt/core';
import { Bone, ConsoleShell } from '@snt/ui';
import { StorefrontBodySkeleton } from '@/components/Storefront';
import styles from './page.module.css';

export default function Loading() {
  return (
    <ConsoleShell
      store={currentStore}
      title="Store profile"
      meta="Your store as buyers find it"
      actions={
        <div className={styles.toolbar}>
          <Bone shape="pill" width={200} height={30} />
          <Bone shape="pill" width={150} height={36} />
        </div>
      }
    >
      <div className={styles.store}>
        <StorefrontBodySkeleton own />
      </div>
    </ConsoleShell>
  );
}
