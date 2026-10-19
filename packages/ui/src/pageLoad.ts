/**
 * Tells the top loading bar a page is on its way, for moves made in code
 * (`router.push`); taps on links are seen by the bar itself. Call it just
 * before the move. See apps/web PageLoadBar.
 */

export const PAGE_LOAD_START = 'snt:page-load-start';

export function startPageLoad(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(PAGE_LOAD_START));
  }
}
