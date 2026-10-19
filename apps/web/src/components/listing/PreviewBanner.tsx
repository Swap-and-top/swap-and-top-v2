'use client';

/**
 * The strip over a listing in buyer preview: says that this is how buyers
 * see it, and offers the way back to where the owner came from.
 */

import { useRouter } from 'next/navigation';
import { Button, startPageLoad } from '@snt/ui';
import { EyeIcon } from '@snt/ui/icons';
import styles from './PreviewBanner.module.css';

export function PreviewBanner() {
  const router = useRouter();

  function close() {
    startPageLoad();
    // Back to the page it was opened from; to Stock if opened directly.
    if (window.history.length > 1) router.back();
    else router.push('/console/stock');
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.banner} role="status">
        <EyeIcon size={20} />
        <p className={styles.text}>
          <strong>Buyer preview.</strong> This is how buyers see your listing.
        </p>
        <Button variant="secondary" size="sm" onClick={close}>
          Close preview
        </Button>
      </div>
    </div>
  );
}
