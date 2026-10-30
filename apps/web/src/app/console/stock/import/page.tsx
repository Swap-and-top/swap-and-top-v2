'use client';

/**
 * Console — Bulk import.
 *
 * The fastest way to bring a store on is to take the list they already keep
 * and load it. Two steps, each a white card: bring the list in (a CSV file,
 * or rows pasted straight from a spreadsheet), then check what will come in
 * before importing it. Rows with a price go live; rows without one wait as
 * drafts; rows without a name are skipped, and say so. The list is added
 * as the store in one go (POST /api/stores/{id}/stock/import).
 */

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  CATEGORY_LABELS,
  CONDITION_LABELS,
  currentStore,
} from '@snt/core';
import {
  Badge,
  Button,
  ButtonLink,
  ConsoleShell,
  startPageLoad,
  useConsoleTarget,
} from '@snt/ui';
import { DownloadIcon, UploadIcon } from '@snt/ui/icons';
import { refreshStorePass } from '@/lib/refresh';
import { apiSend } from '@/lib/query';
import { stockKey, useConsoleStock } from '../useConsoleStock';
import { readStockList, TEMPLATE, type ImportRow } from './readStockList';
import styles from './page.module.css';

const RESULT = {
  ready: { tone: 'success', label: 'Goes live' },
  draft: { tone: 'neutral', label: 'Draft, no price' },
  skipped: { tone: 'danger', label: 'Skipped, no name' },
} as const;

export default function BulkImportPage() {
  const router = useRouter();
  const store = useConsoleTarget() ?? currentStore;
  const stock = useConsoleStock(store.id) ?? [];

  const [pasted, setPasted] = useState('');
  const [source, setSource] = useState<string | null>(null);
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const picker = useRef<HTMLInputElement>(null);

  function read(text: string, from: string) {
    const list = readStockList(text);
    if (list.missingName) {
      setRows(null);
      setProblem(
        'There is no column for the item’s name. The first row should name the columns, as the template’s does.',
      );
      return;
    }
    if (list.rows.length === 0) {
      setRows(null);
      setProblem('There are no rows under the headings.');
      return;
    }
    setProblem(null);
    setSource(from);
    setRows(list.rows);
  }

  async function readFile(file: File | undefined) {
    if (!file) return;
    read(await file.text(), file.name);
  }

  function downloadTemplate() {
    const url = URL.createObjectURL(
      new Blob([TEMPLATE], { type: 'text/csv;charset=utf-8' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'stock template.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  function startAgain() {
    setRows(null);
    setSource(null);
    setPasted('');
    setProblem(null);
  }

  const coming = rows?.filter((row) => row.result !== 'skipped') ?? [];
  const live = coming.filter((row) => row.result === 'ready').length;
  const drafts = coming.length - live;
  const skipped = (rows?.length ?? 0) - coming.length;

  const queryClient = useQueryClient();

  /** Adds the whole list as the store, then opens Stock. */
  const importList = useMutation({
    mutationFn: async () => {
      await apiSend<{ live: number; drafts: number }>(
        `/stores/${encodeURIComponent(store.id)}/stock/import`,
        'POST',
        {
          rows: coming.map(({ stock: row }) => ({
            title: row.title,
            category: row.category,
            condition: row.condition,
            price: row.price,
            quantity: row.quantity,
            specs: row.specs,
          })),
        },
      );
      // The feed and the store's page show the new stock at once.
      await refreshStorePass(store.slug);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: stockKey(store.id) });
      toast.success(`${coming.length} ${coming.length === 1 ? 'item' : 'items'} added to your stock.`);
      startPageLoad();
      router.push('/console/stock');
    },
    onError: (error) => toast.error(error.message || 'We could not import it. Try again in a minute.'),
  });

  return (
    <ConsoleShell
      store={store}
      title="Bulk import"
      meta="Bring in the list you already keep"
      stockCount={stock.length}
    >
      <div className={styles.page}>
        {!rows ? (
          <section className={styles.card}>
            <h2 className={styles.heading}>Bring in your list</h2>
            <p className={styles.intro}>
              A spreadsheet with a row for each item: its name, category,
              condition, price and how many you have. The first row names the
              columns. Start from the template if you have no list yet.
            </p>

            <Button
              variant="secondary"
              size="md"
              className={styles.template}
              onClick={downloadTemplate}
            >
              <DownloadIcon size={18} />
              Download the template
            </Button>

            {/* Choose a file, or drop one here. */}
            <button
              type="button"
              className={[styles.drop, dragging ? styles.dropOver : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => picker.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                void readFile(event.dataTransfer.files[0]);
              }}
            >
              <UploadIcon size={26} />
              <span className={styles.dropTitle}>Choose a CSV file</span>
              <span className={styles.dropHint}>or drop it here</span>
            </button>
            <input
              ref={picker}
              type="file"
              accept=".csv,.tsv,.txt,text/csv"
              hidden
              onChange={(event) => {
                void readFile(event.target.files?.[0]);
                event.target.value = '';
              }}
            />

            <div className={styles.or}>
              <span>or paste it</span>
            </div>

            <label className={styles.pasteLabel} htmlFor="paste">
              Rows from a spreadsheet, headings first
            </label>
            <textarea
              id="paste"
              className={styles.paste}
              rows={6}
              placeholder={'e.g. name, category, condition, price, quantity\nLenovo ThinkPad T480, Laptops, Used good, 265, 4'}
              value={pasted}
              onChange={(event) => setPasted(event.target.value)}
            />

            {problem ? <p className={styles.problem}>{problem}</p> : null}

            <Button
              size="lg"
              block
              disabled={!pasted.trim()}
              onClick={() => read(pasted, 'Pasted rows')}
            >
              Read the list
            </Button>
            <ButtonLink
              href="/console/stock"
              variant="secondary"
              size="lg"
              block
              className={styles.under}
            >
              Back to stock
            </ButtonLink>
          </section>
        ) : (
          <section className={styles.card}>
            <h2 className={styles.heading}>Check before importing</h2>
            <p className={styles.intro}>
              {source}: {rows.length} {rows.length === 1 ? 'row' : 'rows'}.{' '}
              {live} {live === 1 ? 'goes' : 'go'} live
              {drafts > 0
                ? `, ${drafts} ${drafts === 1 ? 'waits as a draft' : 'wait as drafts'} until priced`
                : ''}
              {skipped > 0 ? `, ${skipped} skipped with no name` : ''}.
            </p>

            <div className={styles.table}>
              <div className={styles.headerRow} aria-hidden>
                <span>Item</span>
                <span>Category</span>
                <span>Condition</span>
                <span className={styles.end}>Price</span>
                <span className={styles.end}>How many</span>
                <span>Result</span>
              </div>
              {rows.map((row) => (
                <div key={row.line} className={styles.row}>
                  <span
                    className={row.stock.title ? styles.name : styles.missing}
                  >
                    {row.stock.title || `Line ${row.line}, no name`}
                  </span>
                  <span className={styles.cell}>
                    {CATEGORY_LABELS[row.stock.category]}
                  </span>
                  <span className={styles.cell}>
                    {row.stock.condition
                      ? CONDITION_LABELS[row.stock.condition]
                      : 'Not given'}
                  </span>
                  <span
                    className={[
                      row.stock.price ? styles.price : styles.cell,
                      styles.end,
                    ].join(' ')}
                  >
                    {row.stock.price ? `$${row.stock.price}` : 'No price'}
                  </span>
                  <span className={[styles.cell, styles.end].join(' ')}>
                    {row.stock.quantity ?? 1}
                  </span>
                  <span className={styles.result}>
                    <Badge tone={RESULT[row.result].tone}>
                      {RESULT[row.result].label}
                    </Badge>
                  </span>
                </div>
              ))}
            </div>

            <Button
              size="lg"
              block
              disabled={coming.length === 0}
              // Held on until Stock opens, so it cannot be imported twice.
              loading={importList.isPending || importList.isSuccess}
              onClick={() => importList.mutate()}
            >
              {coming.length === 0
                ? 'Nothing to import'
                : `Import ${coming.length} ${coming.length === 1 ? 'item' : 'items'}`}
            </Button>
            {/* The other ways from here, side by side under it. */}
            <div className={[styles.pair, styles.under].join(' ')}>
              <Button variant="secondary" size="lg" onClick={startAgain}>
                Use a different list
              </Button>
              <ButtonLink href="/console/stock" variant="secondary" size="lg">
                Back to stock
              </ButtonLink>
            </div>
          </section>
        )}
      </div>
    </ConsoleShell>
  );
}
