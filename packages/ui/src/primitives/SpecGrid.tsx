/**
 * SpecGrid — the specification table.
 *
 * `specRowsFor` turns an Item into rows in a category-aware order, so a laptop
 * leads with its processor and a phone leads with its storage. Empty values are
 * dropped rather than shown blank.
 */

import type { Item } from '@snt/core';
import { CONDITION_LABELS } from '@snt/core';
import styles from './SpecGrid.module.css';

export interface SpecRow {
  label: string;
  value: string;
  /** Spans the full width. Use it for defects and other prose. */
  wide?: boolean;
}

export function SpecGrid({ rows }: { rows: SpecRow[] }) {
  if (rows.length === 0) return null;

  return (
    <dl className={styles.grid}>
      {rows.map((row) => (
        <div
          key={row.label}
          className={[styles.cell, row.wide ? styles.wide : '']
            .filter(Boolean)
            .join(' ')}
        >
          <dt className={styles.label}>{row.label}</dt>
          <dd className={styles.value}>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** One detail a category asks for: its key, its label, and an example. */
export interface SpecField {
  key: keyof Item['specs'];
  label: string;
  /** A real example, shown faintly in the empty box on the post form. */
  example: string;
}

/**
 * Which specs matter, and in which order, per category: what a listing
 * shows, what the post form asks for, and what search filters by. Other
 * has none: it is described in words instead.
 */
const ORDER: Record<string, SpecField[]> = {
  laptops: [
    { key: 'processor', label: 'Processor', example: 'Core i5-8250U' },
    { key: 'ram', label: 'RAM', example: '16GB' },
    { key: 'storage', label: 'Storage', example: '256GB SSD' },
    { key: 'graphics', label: 'Graphics', example: 'Integrated' },
    { key: 'screen', label: 'Screen', example: '14in 1080p' },
    { key: 'battery', label: 'Battery', example: 'Holds 4h' },
  ],
  desktops: [
    { key: 'processor', label: 'Processor', example: 'Core i7-8700' },
    { key: 'ram', label: 'RAM', example: '16GB' },
    { key: 'storage', label: 'Storage', example: '512GB SSD' },
    { key: 'graphics', label: 'Graphics', example: 'GTX 1660' },
    { key: 'formFactor', label: 'Form factor', example: 'Tower' },
  ],
  phones: [
    { key: 'storage', label: 'Storage', example: '128GB' },
    { key: 'ram', label: 'RAM', example: '6GB' },
    { key: 'battery', label: 'Battery', example: '89% health' },
    { key: 'colour', label: 'Colour', example: 'Black' },
  ],
  consoles: [
    { key: 'storage', label: 'Storage', example: '1TB' },
    { key: 'controllers', label: 'Controllers', example: '2' },
  ],
  parts: [
    { key: 'partType', label: 'Type', example: 'Graphics card' },
    { key: 'capacity', label: 'Capacity', example: '8GB' },
  ],
  accessories: [{ key: 'colour', label: 'Colour', example: 'White' }],
  other: [],
};

/** The details a category asks for, in order. */
export function specFieldsFor(category: Item['category']): SpecField[] {
  return ORDER[category] ?? [];
}

export function specRowsFor(item: Item): SpecRow[] {
  const rows: SpecRow[] = [];

  for (const { key, label } of ORDER[item.category] ?? []) {
    const value = item.specs[key];
    if (value) rows.push({ label, value });
  }

  if (item.condition) {
    rows.push({ label: 'Condition', value: CONDITION_LABELS[item.condition] });
  }

  /** Something in Other is described in words, a row of its own. */
  if (item.specs.details) {
    rows.push({ label: 'Details', value: item.specs.details, wide: true });
  }

  /** Defects are surfaced, never buried. Hiding flaws produces failed meetings. */
  if (item.defects) {
    rows.push({ label: 'Defects noted', value: item.defects, wide: true });
  }

  if (item.accessories) {
    rows.push({ label: 'Accessories', value: item.accessories, wide: true });
  }

  return rows;
}

/**
 * The specs part of a card's spec line, e.g. ["Core i5", "16GB RAM",
 * "256GB SSD"] — the wording the design uses.
 *
 * At most three, because a card gets one line. Processor loses its part number
 * and memory its generation; the detail screen shows both in full.
 */
export function specParts(
  item: Pick<Item, 'category' | 'specs'>,
  limit = 3,
): string[] {
  /** "Core i5-8250U" → "Core i5". A card has no room for a part number. */
  const shortCpu = (value: string) => value.split('-')[0] ?? value;

  /** "16GB DDR4" → "16GB RAM". The generation belongs on the detail screen. */
  const shortMem = (value: string) =>
    `${value.replace(/\s+(DDR\d|LPDDR\d)\b.*$/i, '')} RAM`;

  const candidates: (string | undefined)[] =
    item.category === 'phones'
      ? [item.specs.storage, item.specs.ram ? shortMem(item.specs.ram) : undefined]
      : item.category === 'parts'
        ? [item.specs.partType, item.specs.capacity]
        : [
            item.specs.processor ? shortCpu(item.specs.processor) : undefined,
            item.specs.ram ? shortMem(item.specs.ram) : undefined,
            item.specs.storage,
          ];

  return candidates.filter((part): part is string => Boolean(part)).slice(0, limit);
}

/**
 * The single spec line on a card, e.g.
 * "Lenovo ThinkPad T480 · Core i5 · 16GB RAM · 256GB SSD".
 */
export function specSummary(item: Item, limit = 3): string {
  return [item.name, ...specParts(item, limit)].join(' · ');
}
