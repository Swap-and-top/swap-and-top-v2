import type { BadgeTone } from '@snt/ui';

/** A person's standing as staff read it. */
export const STANDING_LABEL: Record<string, string> = {
  good: 'Good standing',
  warned: 'Warned',
  limited: 'Limited',
  suspended: 'Suspended',
  banned: 'Banned',
};

/** Its pill, worst darkest: grey, amber, red, then dark for a ban. */
export const STANDING_TONE: Record<string, BadgeTone> = {
  good: 'neutral',
  warned: 'warning',
  limited: 'warning',
  suspended: 'danger',
  banned: 'dark',
};

/** "Tarisai M." → "TM". */
export function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .map((part) => part.replace(/[^\p{L}]/gu, '').charAt(0))
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  );
}
