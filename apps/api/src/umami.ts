/**
 * Visits, from Umami (Phase 7, Growth; docs/product/staff-console.md):
 * every visit to the site, signed in or not, and the sites that sent them,
 * read from Umami's API so no one has to open Umami for the everyday
 * figures. Umami keeps no names and sets no cookies, which fits Marketing's
 * rule of totals only.
 *
 * Connected by four settings: UMAMI_URL (the Umami server, e.g.
 * https://stats.example.com), UMAMI_WEBSITE_ID (the site's id in Umami),
 * and UMAMI_USERNAME and UMAMI_PASSWORD (a view only Umami user for the
 * console). The web app loads Umami's script with NEXT_PUBLIC_UMAMI_SCRIPT_URL
 * and NEXT_PUBLIC_UMAMI_WEBSITE_ID (app/layout.tsx). **None is set yet**
 * (Hillary, 2026-11-03: Umami comes with the final hosting), so until then
 * every answer here is sample figures, steady for each day, and Growth says
 * so plainly. Each answer from Umami is kept five minutes.
 */

const HARARE = 2 * 60 * 60_000;
const DAY = 24 * 60 * 60_000;
const KEEP_MS = 5 * 60_000;

export interface VisitTotals {
  visitors: number;
  visits: number;
  pageViews: number;
}

const settings = () => {
  const { UMAMI_URL, UMAMI_WEBSITE_ID, UMAMI_USERNAME, UMAMI_PASSWORD } = process.env;
  return UMAMI_URL && UMAMI_WEBSITE_ID && UMAMI_USERNAME && UMAMI_PASSWORD
    ? { url: UMAMI_URL.replace(/\/$/, ''), site: UMAMI_WEBSITE_ID, username: UMAMI_USERNAME, password: UMAMI_PASSWORD }
    : null;
};

/** Whether Umami is set up; if not, the figures are samples. */
export const umamiConnected = () => settings() !== null;

/* ── Umami's API ──────────────────────────────────────────────────────── */

let signedIn: { token: string; at: number } | null = null;
const kept = new Map<string, { at: number; answer: Promise<unknown> }>();

async function tokenFor(config: NonNullable<ReturnType<typeof settings>>): Promise<string> {
  if (signedIn && Date.now() - signedIn.at < 60 * 60_000) return signedIn.token;
  const response = await fetch(`${config.url}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: config.username, password: config.password }),
  });
  if (!response.ok) throw new Error(`Umami sign in failed (${response.status})`);
  const { token } = (await response.json()) as { token: string };
  signedIn = { token, at: Date.now() };
  return token;
}

async function ask<T>(path: string, query: Record<string, string | number>): Promise<T> {
  const config = settings()!;
  const address = `${config.url}/api/websites/${config.site}${path}?${new URLSearchParams(
    Object.entries(query).map(([k, v]): [string, string] => [k, String(v)]),
  )}`;
  const held = kept.get(address);
  if (held && Date.now() - held.at < KEEP_MS) return held.answer as Promise<T>;
  const answer = (async () => {
    const response = await fetch(address, { headers: { Authorization: `Bearer ${await tokenFor(config)}` } });
    if (response.status === 401) signedIn = null;
    if (!response.ok) throw new Error(`Umami answered ${response.status}`);
    return response.json();
  })();
  kept.set(address, { at: Date.now(), answer });
  answer.catch(() => kept.delete(address));
  return answer as Promise<T>;
}

/** A figure as Umami gives it: a number, or `{ value }` in older versions. */
const figure = (x: unknown) => (typeof x === 'number' ? x : Number((x as { value?: number } | undefined)?.value ?? 0));

/* ── Sample figures, until Umami is connected ─────────────────────────── */

/** A steady number from 0 to 1 for a text, so a day's sample never changes. */
function steady(text: string): number {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return ((h >>> 0) % 10_000) / 10_000;
}

/** A sample day's visits: growing over the months, busier at weekends. */
function sampleVisits(dayKey: string): number {
  const at = Date.parse(`${dayKey}T00:00:00Z`);
  const months = (at - Date.parse('2024-11-01T00:00:00Z')) / (30 * DAY);
  const weekday = new Date(at).getUTCDay();
  const busy = weekday === 0 || weekday === 6 ? 1.25 : weekday === 5 ? 1.1 : 1;
  return Math.round((220 + Math.max(0, months) * 26) * busy * (0.82 + steady(dayKey) * 0.36));
}

/** Each day's key ("2026-11-03", Harare's) from `start` to `end`, none
    after today. */
function daysBetween(start: Date, end: Date): string[] {
  const last = Math.min(end.getTime(), Date.now());
  const keys: string[] = [];
  for (let at = start.getTime(); at < last; at += DAY) keys.push(new Date(at + HARARE).toISOString().slice(0, 10));
  return keys;
}

const SAMPLE_SOURCES: [string, number][] = [
  ['google.com', 0.36],
  ['Direct', 0.24],
  ['facebook.com', 0.16],
  ['whatsapp.com', 0.12],
  ['instagram.com', 0.06],
  ['tiktok.com', 0.04],
  ['x.com', 0.02],
];

/* ── What Growth asks ─────────────────────────────────────────────────── */

/** Visitors, visits and page views from `start` to `end`. */
export async function visitTotals(start: Date, end: Date): Promise<VisitTotals> {
  if (!umamiConnected()) {
    const visits = daysBetween(start, end).reduce((sum, key) => sum + sampleVisits(key), 0);
    return { visitors: Math.round(visits * 0.71), visits, pageViews: Math.round(visits * 3.4) };
  }
  const stats = await ask<Record<string, unknown>>('/stats', { startAt: start.getTime(), endAt: end.getTime() - 1 });
  return { visitors: figure(stats.visitors), visits: figure(stats.visits), pageViews: figure(stats.pageviews) };
}

/** Visits a day ("2026-11-03") or a month ("2026-11"), in Harare's time. */
export async function visitsBy(by: 'day' | 'month', start: Date, end: Date): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (!umamiConnected()) {
    for (const key of daysBetween(start, end)) {
      const at = by === 'day' ? key : key.slice(0, 7);
      out.set(at, (out.get(at) ?? 0) + sampleVisits(key));
    }
    return out;
  }
  const series = await ask<{ sessions?: { x: string; y: number }[] }>('/pageviews', {
    startAt: start.getTime(),
    endAt: end.getTime() - 1,
    unit: by,
    timezone: 'Africa/Harare',
  });
  for (const { x, y } of series.sessions ?? []) {
    const at = x.slice(0, by === 'day' ? 10 : 7);
    out.set(at, (out.get(at) ?? 0) + y);
  }
  return out;
}

/** The sites that sent visitors, most first ("Direct" for none). */
export async function visitSources(start: Date, end: Date): Promise<{ name: string; visits: number }[]> {
  if (!umamiConnected()) {
    const visits = daysBetween(start, end).reduce((sum, key) => sum + sampleVisits(key), 0);
    return SAMPLE_SOURCES.map(([name, share]) => ({ name, visits: Math.round(visits * share) }));
  }
  const rows = await ask<{ x: string | null; y: number }[]>('/metrics', {
    startAt: start.getTime(),
    endAt: end.getTime() - 1,
    type: 'referrer',
    limit: 10,
  });
  return rows.map(({ x, y }) => ({ name: x || 'Direct', visits: y }));
}
