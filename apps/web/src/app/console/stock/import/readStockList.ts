/**
 * Reads a dealer's stock list: a CSV file, or rows pasted from a spreadsheet
 * (which arrive separated by tabs). The first row names the columns; they are
 * matched loosely, in any order, so a list kept for years in the dealer's own
 * words still comes in. Unknown columns are left out.
 */

import type { Category, Condition, ItemSpecs, NewStock } from '@snt/core';

/** One row as it will come in, and what happens to it. */
export interface ImportRow {
  /** The row's line in the sheet, counting the headings as line 1. */
  line: number;
  stock: NewStock;
  /** Live with a price; a draft without one; skipped without a name. */
  result: 'ready' | 'draft' | 'skipped';
}

/** The template's columns, in its order, with a worked example. */
export const TEMPLATE = [
  'name,category,condition,price,quantity,processor,ram,storage,notes',
  'Lenovo ThinkPad T480,Laptops,Used good,265,4,Core i5,16GB,256GB SSD,',
  'iPhone 11 64GB,Phones,Used like new,230,2,,4GB,64GB,Battery 86%',
  'Dell OptiPlex 7050,Desktops,Used good,180,1,Core i5,8GB,500GB HDD,',
].join('\n');

const COLUMNS: Record<string, keyof ColumnMap> = {
  name: 'name',
  item: 'name',
  title: 'name',
  model: 'name',
  description: 'name',
  category: 'category',
  type: 'category',
  condition: 'condition',
  grade: 'condition',
  price: 'price',
  'price usd': 'price',
  usd: 'price',
  amount: 'price',
  quantity: 'quantity',
  qty: 'quantity',
  stock: 'quantity',
  'how many': 'quantity',
  processor: 'processor',
  cpu: 'processor',
  ram: 'ram',
  memory: 'ram',
  storage: 'storage',
  ssd: 'storage',
  hdd: 'storage',
  notes: 'details',
  note: 'details',
  details: 'details',
};

interface ColumnMap {
  name: number;
  category: number;
  condition: number;
  price: number;
  quantity: number;
  processor: number;
  ram: number;
  storage: number;
  details: number;
}

/** Splits text into rows of cells, minding quotes in CSV. */
function cells(text: string): string[][] {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const separator = lines[0]?.includes('\t') ? '\t' : ',';

  return lines
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      if (separator === '\t') return line.split('\t').map((cell) => cell.trim());
      const out: string[] = [];
      let cell = '';
      let quoted = false;
      for (let at = 0; at < line.length; at += 1) {
        const char = line[at];
        if (quoted) {
          if (char === '"' && line[at + 1] === '"') {
            cell += '"';
            at += 1;
          } else if (char === '"') quoted = false;
          else cell += char;
        } else if (char === '"') quoted = true;
        else if (char === ',') {
          out.push(cell.trim());
          cell = '';
        } else cell += char;
      }
      out.push(cell.trim());
      return out;
    });
}

function categoryOf(text: string): Category {
  const word = text.toLowerCase();
  if (/laptop|notebook|macbook|thinkpad/.test(word)) return 'laptops';
  if (/phone|iphone|mobile|samsung/.test(word)) return 'phones';
  if (/desktop|tower|pc|optiplex|all in one/.test(word)) return 'desktops';
  if (/console|playstation|ps\d|xbox|switch/.test(word)) return 'consoles';
  if (/part|gpu|graphics|ram|ssd|hdd|motherboard|screen/.test(word)) return 'parts';
  if (/accessor|charger|cable|mouse|keyboard|bag|case/.test(word)) {
    return 'accessories';
  }
  return 'other';
}

function conditionOf(text: string): Condition | undefined {
  const word = text.toLowerCase();
  if (!word) return undefined;
  if (/box|sealed|brand new|^new$/.test(word)) return 'boxed-new';
  if (/like new|mint|excellent/.test(word)) return 'like-new';
  if (/fair|worn/.test(word)) return 'fair';
  return 'good';
}

function number(text: string): number | undefined {
  const value = Number(text.replace(/[^0-9.]/g, ''));
  return value > 0 ? Math.round(value) : undefined;
}

/** The rows of a list, read; empty when the headings name no item column. */
export function readStockList(text: string): {
  rows: ImportRow[];
  missingName: boolean;
} {
  const [headings, ...body] = cells(text);
  if (!headings) return { rows: [], missingName: false };

  const map: Partial<ColumnMap> = {};
  headings.forEach((heading, index) => {
    const key = COLUMNS[heading.toLowerCase().replace(/[^a-z ]/g, '').trim()];
    if (key && map[key] === undefined) map[key] = index;
  });
  if (map.name === undefined) return { rows: [], missingName: true };

  const read = (row: string[], key: keyof ColumnMap) =>
    map[key] === undefined ? '' : (row[map[key]!] ?? '').trim();

  const rows = body.map((row, index): ImportRow => {
    const title = read(row, 'name');
    const specs: ItemSpecs = {};
    if (read(row, 'processor')) specs.processor = read(row, 'processor');
    if (read(row, 'ram')) specs.ram = read(row, 'ram');
    if (read(row, 'storage')) specs.storage = read(row, 'storage');
    if (read(row, 'details')) specs.details = read(row, 'details');

    const price = number(read(row, 'price'));
    const stock: NewStock = {
      title,
      // A category the sheet does not give is guessed from the name.
      category: categoryOf(read(row, 'category') || title),
      condition: conditionOf(read(row, 'condition')),
      price,
      quantity: number(read(row, 'quantity')),
      specs,
    };

    return {
      line: index + 2,
      stock,
      result: !title ? 'skipped' : price ? 'ready' : 'draft',
    };
  });

  return { rows, missingName: false };
}
