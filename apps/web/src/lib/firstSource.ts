/**
 * Where a visitor first came from, for Growth's "Where new users came
 * from" (apps/api/src/routes/growth.ts). On their first visit this browser
 * keeps the campaign's source tag (`?utm_source=`), else the site that sent
 * them, else "direct", with the campaign tag (`?utm_campaign=`). Once they
 * have an account it is sent, once (`POST /api/me/source`); the API keeps
 * it only for an account made in the last day. The browser's storage only,
 * nothing loaded.
 */

import { apiSend } from './query';

const KEY = 'snt-first-source';

interface FirstSource {
  source: string;
  campaign?: string;
  sent?: boolean;
}

/** On a page's first load: notes where this visitor came from, if this
    browser has not already. */
export function noteFirstSource(): void {
  try {
    if (localStorage.getItem(KEY)) return;
    const params = new URLSearchParams(window.location.search);
    let source = params.get('utm_source')?.trim() || '';
    if (!source && document.referrer) {
      const host = new URL(document.referrer).hostname.replace(/^www\./, '');
      if (host !== window.location.hostname.replace(/^www\./, '')) source = host;
    }
    const campaign = params.get('utm_campaign')?.trim() || undefined;
    const noted: FirstSource = { source: (source || 'direct').slice(0, 80), campaign: campaign?.slice(0, 80) };
    localStorage.setItem(KEY, JSON.stringify(noted));
  } catch {
    // No storage, or a referrer that is not an address.
  }
}

/** Once signed in: sends it, once a browser. */
export function sendFirstSource(): void {
  try {
    const noted = JSON.parse(localStorage.getItem(KEY) ?? 'null') as FirstSource | null;
    if (!noted || noted.sent) return;
    localStorage.setItem(KEY, JSON.stringify({ ...noted, sent: true }));
    void apiSend('/me/source', 'POST', { source: noted.source, campaign: noted.campaign }).catch(() => undefined);
  } catch {
    // No storage.
  }
}
