/**
 * Counts a key action in Umami (Growth, and Umami's own Events and funnels):
 * a listing posted, a swap offered, a contact shown, a listing saved. Only
 * the kind of action and a plain detail such as the category: never a
 * name, a number, a title or anything typed. Nothing happens where Umami
 * is not loaded (localhost, or a browser that blocks it).
 */

type EventName = 'Posted a listing' | 'Offered a swap' | 'Showed contact' | 'Saved a listing';

export function track(name: EventName, data?: Record<string, string>): void {
  try {
    const umami = (window as unknown as { umami?: { track?: unknown } }).umami;
    if (typeof umami?.track === 'function') {
      (umami.track as (name: string, data?: Record<string, string>) => void)(name, data);
    }
  } catch {
    // Counting must never get in the way of the action itself.
  }
}
