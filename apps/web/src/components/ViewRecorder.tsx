'use client';

/**
 * Notes a view of a listing's page, once, as it opens
 * (POST /api/listings/{id}/views): the API counts a device once every half
 * hour and never the listing's owner. Shows nothing.
 */

import { useEffect } from 'react';
import { deviceId } from '@/lib/reveals';
import { supabase } from '@/lib/supabase';

export function ViewRecorder({ listingId }: { listingId: string }) {
  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      await fetch(`/api/listings/${encodeURIComponent(listingId)}/views`, {
        method: 'POST',
        headers: {
          'X-Device': deviceId(),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }).catch(() => null);
    })();
  }, [listingId]);
  return null;
}
