/**
 * The load test: how many users at once the server carries before it slows.
 *
 * Each pretend user does what a real visitor does most: opens the feed,
 * scrolls a little, searches, opens a few listings, pausing between pages
 * as a person reads. More pretend users are added every minute or two. The
 * test stops itself once pages get slow or start failing, which is the sign
 * the server is near its limit; Beszel's chart shows the processor and
 * memory at that moment.
 *
 * It only reads public pages: nothing is posted, saved or counted (no
 * searches noted for Growth, no listing views), so no data needs removing,
 * apart from the slow requests the API may note for Health while the server
 * is struggling (`request_issues`, during the test's time).
 *
 * Run it with k6 (https://k6.io), from the Melbourne server so Johannesburg
 * only does the real work, at a quiet time (staging and production share
 * Johannesburg):
 *
 *   docker run --rm -i -e SLOW_MS=2000 -e BASE_URL=https://sntstaging.gretaworksdigital.com grafana/k6:2.3.0 run - < visit.js
 *
 * First a quick one person try, to see how fast pages are when the server
 * is idle (from Melbourne the distance alone makes a page about 0.9 seconds,
 * so the full test there uses SLOW_MS=2000):
 *
 *   docker run --rm -i -e BASE_URL=https://sntstaging.gretaworksdigital.com -e QUICK=1 grafana/k6:2.3.0 run - < visit.js
 *
 * Settings, all optional: BASE_URL (the site), SLOW_MS (when a page counts
 * as too slow, 1500 by default), QUICK=1 (the one person try), TOP (climb
 * to this many users at once instead, to find the server's maximum; with
 * SLOW_MS=6000 it runs until pages fail rather than when they slow).
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';

const BASE = (__ENV.BASE_URL || 'https://sntstaging.gretaworksdigital.com').replace(/\/$/, '');
const SLOW_MS = Number(__ENV.SLOW_MS || 1500);
const QUICK = __ENV.QUICK === '1';
const TOP = Number(__ENV.TOP || 0);

/** Words people search for. */
const SEARCHES = ['iphone', 'samsung', 'laptop', 'hp', 'dell', 'ps4', 'charger', 'macbook', 'tecno', 'screen'];
const CATEGORIES = ['phones', 'laptops', 'desktops', 'consoles', 'parts', 'accessories'];

export const options = QUICK
  ? { vus: 1, iterations: 3 }
  : {
      scenarios: {
        visitors: {
          executor: 'ramping-vus',
          startVUs: 0,
          // Users at once, added step by step over about 18 minutes; with TOP,
          // a quicker climb to that many, held for 2 minutes at the top.
          stages: TOP
            ? [
                { duration: '2m', target: Math.round(TOP * 0.4) },
                { duration: '3m', target: Math.round(TOP * 0.6) },
                { duration: '3m', target: Math.round(TOP * 0.8) },
                { duration: '3m', target: TOP },
                { duration: '2m', target: TOP },
              ]
            : [
                { duration: '2m', target: 25 },
                { duration: '2m', target: 50 },
                { duration: '2m', target: 100 },
                { duration: '3m', target: 200 },
                { duration: '3m', target: 400 },
                { duration: '3m', target: 700 },
                { duration: '3m', target: 1000 },
              ],
          gracefulRampDown: '10s',
        },
      },
      thresholds: {
        // Stop once 1 page in 20 is slower than SLOW_MS ...
        http_req_duration: [{ threshold: `p(95)<${SLOW_MS}`, abortOnFail: true, delayAbortEval: '30s' }],
        // ... or more than 1 request in 100 fails.
        http_req_failed: [{ threshold: 'rate<0.01', abortOnFail: true, delayAbortEval: '30s' }],
      },
    };

const pick = (list) => list[Math.floor(Math.random() * list.length)];
/** A person reading the page: 3 to 8 seconds. */
const read = () => sleep(3 + Math.random() * 5);

function get(url, name, wantBody = false) {
  const res = http.get(url, {
    tags: { name },
    responseType: wantBody ? 'text' : 'none',
    headers: { 'User-Agent': 'snt-loadtest' },
  });
  check(res, { [`${name} answered`]: (r) => r.status === 200 });
  return res;
}

export default function visit() {
  let slugs = [];

  group('feed', () => {
    get(`${BASE}/`, 'feed page');
    // The feed's listings, as the page asks for them, and one more page as they scroll.
    const page = get(`${BASE}/api/listings?limit=20`, 'listings api', true);
    try {
      const body = page.json();
      slugs = (body.listings || []).map((l) => l.slug);
      if (body.nextCursor) {
        get(`${BASE}/api/listings?limit=20&cursor=${encodeURIComponent(body.nextCursor)}`, 'listings api');
      }
    } catch (_) {
      // A failed page is already counted.
    }
  });
  read();

  group('search', () => {
    if (Math.random() < 0.5) {
      get(`${BASE}/search?q=${encodeURIComponent(pick(SEARCHES))}`, 'search page');
    } else {
      get(`${BASE}/api/listings?limit=20&category=${pick(CATEGORIES)}`, 'listings api');
    }
  });
  read();

  // Two or three listings opened.
  const opens = 2 + Math.floor(Math.random() * 2);
  for (let n = 0; n < opens && slugs.length; n += 1) {
    group('listing', () => {
      get(`${BASE}/listing/${encodeURIComponent(pick(slugs))}`, 'listing page');
    });
    read();
  }
}
