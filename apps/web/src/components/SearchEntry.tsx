'use client';

/**
 * SearchEntry — the search bar, and the search panel that drops from it.
 *
 * The bar is the field: it stays exactly where it is and looks as it does,
 * and you type straight into it. Activating it only adds a border and a close
 * cross at its right end, opposite the search icon. Nothing at or above the
 * bar moves — the header stays as it is.
 *
 * What changes is everything beneath: a panel slides down from just under the
 * bar and covers the rest of the screen. As you type it shows the first few
 * matching listings under a heading that names the search, with a "Filters"
 * button beside it that opens category, listing type and price. Search terms
 * to try float right under the bar like a tooltip, over the panel rather than
 * taking room in it.
 * Before anything is typed it shows the latest listings, so it is never blank.
 *
 * Only "View all results", a suggested term or Enter goes to the results
 * page. Tapping a listing opens that listing. Escape, the cross or a tap on
 * the header puts everything back: the panel slides back up into the bar. The
 * cross also empties the bar.
 */

import { useRouter } from 'next/navigation';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { createPortal } from 'react-dom';
import {
  CATEGORY_LABELS,
  liveListings,
  NO_SPEC_FILTERS,
  searchListings,
  suggestSearchTerms,
  type Category,
  type SearchCategory,
  type TypeFilter,
} from '@snt/core';
import { CompactListingRow } from '@snt/ui';
import { CloseIcon, SearchIcon } from '@snt/ui/icons';
import {
  QuotedQuery,
  SearchFilters,
  type SearchFilterValues,
} from './SearchFilters';
import { MAX_QUERY, searchHref } from './searchParams';
import styles from './SearchEntry.module.css';

const PLACEHOLDER = 'Search phone, laptops, consoles, parts, accessories';

/** Listings shown in the panel — a preview; the results page has them all. */
const PREVIEW = 5;

/**
 * Space between the bar and the panel: just enough for the bar's border, so
 * the floating suggestions can hang close under it. The panel pads its own
 * top to keep its contents where they were.
 */
const GAP = 6;

export function SearchEntry({
  query: currentQuery = '',
  category: currentCategory = 'all',
  type: currentType = 'all',
  min: currentMin = '',
  max: currentMax = '',
}: {
  /** The search already on screen, on the results page. Shown in the bar. */
  query?: string;
  category?: SearchCategory;
  type?: TypeFilter;
  min?: string;
  max?: string;
}) {
  const router = useRouter();
  const bar = useRef<HTMLFormElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  /** Sliding back up: still on screen, but the bar is already at rest. */
  const [closing, setClosing] = useState(false);
  /** What the panel was showing when it began to close, held while it goes. */
  const leaving = useRef('');
  const [query, setQuery] = useState(currentQuery);
  const [filters, setFilters] = useState<SearchFilterValues>({
    category: currentCategory,
    type: currentType,
    min: currentMin,
    max: currentMax,
  });
  /** Where the panel starts: just under the bar, wherever the bar is. */
  const [top, setTop] = useState(0);

  function activate() {
    if (open && !closing) return;
    // Tapped again while it was sliding away: it comes straight back.
    setClosing(false);
    if (open) return;
    setFilters({
      category: currentCategory,
      type: currentType,
      min: currentMin,
      max: currentMax,
    });
    setOpen(true);
  }

  /**
   * Put everything back: the bar as it was at once, and the panel slides up
   * into it. The page beneath is uncovered once the panel has gone.
   */
  function close({ clear = false }: { clear?: boolean } = {}) {
    leaving.current = query.trim();
    setClosing(true);
    // The cross empties the bar. Escape or a tap outside only backs out, so
    // the bar goes back to the search already on screen, if there is one.
    setQuery(clear ? '' : currentQuery);
    input.current?.blur();
  }

  /** Gone with no slide — the page is changing under it anyway. */
  function dismiss() {
    setOpen(false);
    setClosing(false);
  }

  // Measure before paint, so the panel never appears in the wrong place.
  useLayoutEffect(() => {
    if (!open) return;
    const measure = () => {
      const rect = bar.current?.getBoundingClientRect();
      if (rect) setTop(rect.bottom + GAP);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [open]);

  useEffect(() => {
    if (!open || closing) return;

    // The page behind stays put, so the bar stays where it is.
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';

    // A tap anywhere that is not the bar or the panel — the header — closes.
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (bar.current?.contains(target) || panel.current?.contains(target)) {
        return;
      }
      close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      root.style.overflow = previous;
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
    // Re-run when it opens or closes, and on each search typed, so `close`
    // knows what the panel is showing.
  }, [open, closing, query]);

  const typed = query.trim();
  const active = open && !closing;

  /** The results page — for Enter, a suggested term, or "View all". */
  function goToResults(q: string) {
    dismiss();
    input.current?.blur();
    router.push(searchHref({ q, ...filters }));
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (typed) goToResults(typed);
  }

  return (
    <>
      <form
        ref={bar}
        role="search"
        className={[styles.bar, active ? styles.barActive : '']
          .filter(Boolean)
          .join(' ')}
        onSubmit={onSubmit}
        // A tap anywhere on the bar, not only on the text, starts a search.
        onClick={() => input.current?.focus()}
      >
        <SearchIcon size={18} />
        <input
          ref={input}
          type="search"
          className={styles.input}
          aria-label="Search gadgets"
          aria-expanded={active}
          aria-controls={active ? 'search-panel' : undefined}
          placeholder={PLACEHOLDER}
          enterKeyHint="search"
          autoComplete="off"
          maxLength={MAX_QUERY}
          value={query}
          onFocus={activate}
          onChange={(event) => {
            setQuery(event.target.value);
            activate();
          }}
        />
        {active ? (
          <button
            type="button"
            className={styles.close}
            aria-label="Close search"
            onClick={(event) => {
              // Not a tap on the bar: do not hand focus back to the field.
              event.stopPropagation();
              close({ clear: true });
            }}
          >
            <CloseIcon size={16} weight={2.2} />
          </button>
        ) : null}
      </form>

      {open
        ? createPortal(
            <SearchPanel
              ref={panel}
              top={top}
              typed={closing ? leaving.current : typed}
              closing={closing}
              onClosed={dismiss}
              filters={filters}
              onFilters={(change) =>
                setFilters((current) => ({ ...current, ...change }))
              }
              onResults={goToResults}
              onPick={dismiss}
            />,
            document.body,
          )
        : null}
    </>
  );
}

function SearchPanel({
  ref,
  top,
  typed,
  closing,
  onClosed,
  filters,
  onFilters,
  onResults,
  onPick,
}: {
  ref: React.Ref<HTMLDivElement>;
  top: number;
  typed: string;
  /** Sliding back up into the bar; `onClosed` is called once it has gone. */
  closing: boolean;
  onClosed: () => void;
  filters: SearchFilterValues;
  onFilters: (change: Partial<SearchFilterValues>) => void;
  onResults: (query: string) => void;
  /** A listing was tapped: the panel goes, and the listing opens. */
  onPick: () => void;
}) {
  const { category, type, min, max } = filters;
  /** The filters start closed: the results come first. */
  const [filtersOpen, setFiltersOpen] = useState(false);

  // The listing type narrows everything below it, suggestions included.
  const ofType = liveListings.filter(
    (listing) => type === 'all' || listing.type === type,
  );
  const terms = suggestSearchTerms(ofType, typed, category);
  // Nothing typed yet: the newest listings, so the panel is not blank.
  const matches = searchListings(ofType, {
    ...NO_SPEC_FILTERS,
    query: typed,
    category,
    minPrice: min,
    maxPrice: max,
  });
  const preview = matches.slice(0, PREVIEW);

  // The suggestions float over the top of the panel. A tap anywhere else in
  // the panel puts them away until the search is typed further.
  const termList = useRef<HTMLUListElement>(null);
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);
  const showTerms =
    typed !== '' && terms.length > 0 && dismissedFor !== typed && !closing;

  return (
    <div
      ref={ref}
      id="search-panel"
      role="dialog"
      aria-label="Search"
      className={[styles.panel, closing ? styles.panelClosing : '']
        .filter(Boolean)
        .join(' ')}
      style={{ top }}
      onAnimationEnd={(event) => {
        if (closing && event.target === event.currentTarget) onClosed();
      }}
      onPointerDown={(event) => {
        if (showTerms && !termList.current?.contains(event.target as Node)) {
          setDismissedFor(typed);
        }
      }}
    >
      <div className={styles.column}>
        {showTerms ? (
          <ul
            ref={termList}
            className={styles.terms}
            aria-label="Suggested searches"
          >
            {terms.map((term) => (
              <li key={term}>
                <button
                  type="button"
                  className={styles.term}
                  onClick={() => onResults(term)}
                >
                  <SearchIcon size={16} />
                  <span>{term}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className={styles.body}>
          <section className={styles.results}>
            {/* Says what the list is — the results for exactly what was
                typed, and how many — with the filters behind a button. */}
            <SearchFilters
              heading={
                typed ? (
                  <>
                    Search results for <QuotedQuery q={typed} bold />
                  </>
                ) : (
                  'Latest listings'
                )
              }
              count={typed ? matches.length : undefined}
              open={filtersOpen}
              onToggle={() => setFiltersOpen((current) => !current)}
              values={filters}
              onChange={onFilters}
              // Enter in the max price is Enter in the search bar.
              onSubmit={() => {
                if (typed) onResults(typed);
              }}
            />

            {preview.length > 0 ? (
              // A tap on a listing opens it; the search closes behind it.
              <div className={styles.rows} onClick={onPick}>
                {preview.map((listing) => (
                  <CompactListingRow key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <p className={styles.none}>
                {typed ? (
                  <>
                    Nothing matches <QuotedQuery q={typed} bold />
                  </>
                ) : (
                  'Nothing matches'
                )}
                {category === 'all'
                  ? ''
                  : ` in ${CATEGORY_LABELS[category as Category]}`}
                . Try a shorter search or change the filters.
              </p>
            )}

            {typed && matches.length > 0 ? (
              <button
                type="button"
                className={styles.more}
                onClick={() => onResults(typed)}
              >
                {matches.length > PREVIEW
                  ? `View all ${matches.length} search results`
                  : 'View more search results'}
              </button>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
