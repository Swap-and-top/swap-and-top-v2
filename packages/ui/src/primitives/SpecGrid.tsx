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

/** Which specs matter, and in which order, per category. */
const ORDER: Record<string, { key: keyof Item['specs']; label: string }[]> = {
  laptops: [
    { key: 'processor', label: 'Processor' },
    { key: 'ram', label: 'RAM' },
    { key: 'storage', label: 'Storage' },
    { key: 'graphics', label: 'Graphics' },
    { key: 'screen', label: 'Screen' },
    { key: 'battery', label: 'Battery' },
  ],
  desktops: [
    { key: 'processor', label: 'Processor' },
    { key: 'ram', label: 'RAM' },
    { key: 'storage', label: 'Storage' },
    { key: 'graphics', label: 'Graphics' },
    { key: 'formFactor', label: 'Form factor' },
  ],
  phones: [
    { key: 'storage', label: 'Storage' },
    { key: 'ram', label: 'RAM' },
    { key: 'battery', label: 'Battery' },
    { key: 'colour', label: 'Colour' },
  ],
  consoles: [
    { key: 'storage', label: 'Storage' },
    { key: 'controllers', label: 'Controllers' },
  ],
  parts: [
    { key: 'partType', label: 'Type' },
    { key: 'capacity', label: 'Capacity' },
  ],
  accessories: [{ key: 'colour', label: 'Colour' }],
};

export function specRowsFor(item: Item): SpecRow[] {
  const rows: SpecRow[] = [];

  for (const { key, label } of ORDER[item.category] ?? []) {
    const value = item.specs[key];
    if (value) rows.push({ label, value });
  }

  if (item.condition) {
    rows.push({ label: 'Condition', value: CONDITION_LABELS[item.condition] });
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
 * The single spec line on a card, e.g. "ThinkPad T480 · i5 · 16GB · 256GB SSD".
 *
 * At most three specs, because a card gets one line and a fourth pushes the
 * layout around. Processor is shortened — a card has no room for a full part
 * number, and the detail screen shows it in full.
 */
export function specSummary(item: Item, limit = 3): string {
  /** "Core i5-8250U" → "i5". A card has no room for a part number. */
  const shortCpu = (value: string) =>
    value.replace(/^(Core |Intel |AMD )/i, '').split('-')[0] ?? value;

  /** "16GB DDR4" → "16GB". The generation belongs on the detail screen. */
  const shortMem = (value: string) => value.replace(/\s+(DDR\d|LPDDR\d)\b.*$/i, '');

  /**
   * "Lenovo ThinkPad T480" → "ThinkPad T480" when the brand is already
   * implied by the model name. Keeps the line to one row on a phone.
   */
  const shortName = (() => {
    if (!item.brand) return item.name;
    const stripped = item.name.replace(new RegExp(`^${item.brand}\\s+`, 'i'), '');
    return stripped.length > 0 ? stripped : item.name;
  })();

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

  const parts = [shortName, ...candidates.filter(Boolean).slice(0, limit)];
  return parts.join(' · ');
}
