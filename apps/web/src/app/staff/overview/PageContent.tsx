'use client';

/**
 * The Overview, every team member's first page in the Staff console
 * (GET /api/staff/overview): the numbers their departments need, a week,
 * a month or a year at a time, the current one or any before it. The API
 * gives the sections this person may see (the business, Trust and safety,
 * Sales, Finance, Marketing, DevOps; the super admin, all) and the tiles
 * in each, each section whole. Each section is a tab, so one is on show at a
 * glance (Hillary, 2026-11-03); one alone has no tab strip. The first is My
 * overview, the cards this person chose and ordered themselves behind its
 * gear (CardsSheet); once it has cards the page opens on it, until then on
 * their first part of the team. A tile of what
 * happened shows the change on the period before and, tapped, its chart
 * under the tiles, this period beside the one before, as on the Store
 * console's Stats; a tile of what stands now says so. Totals only, no names; look only. Test payments
 * never count, and a tile says what it left out.
 */

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useId, useState } from 'react';
import { Button, Chip, ChipRow, Dropdown, Panel, Tabs } from '@snt/ui';
import { SettingsIcon } from '@snt/ui/icons';
import { apiGet, QueryProblem } from '@/lib/query';
import { useLoadingBar } from '@/lib/loadingBar';
import { useOnTeam } from '@/lib/staff';
import { Legend, LineChart, money, type Series } from '../revenue/charts';
import { staffKeys } from '../sections';
import { StaffPage } from '../StaffPage';
import { CardsSheet, type Choice } from './CardsSheet';
import Loading, { MINE_COUNT } from './loading';
import styles from './page.module.css';

type Unit = 'week' | 'month' | 'year';

interface Tile {
  key: string;
  label: string;
  kind: 'period' | 'now';
  money: boolean;
  current: number;
  previous?: number;
  chart?: { current: number[]; previous: number[] };
  note?: string;
}

interface Section {
  key: string;
  title: string;
  tiles: Tile[];
  note?: string;
}

interface Overview {
  unit: Unit;
  period: string;
  periods: { value: string; label: string }[];
  label: string;
  previousLabel: string;
  labels: string[];
  sections: Section[];
  /** The cards they may put on My overview. */
  choices: Choice[];
}

/** This period and the one before, as on Revenue. */
const CURRENT = '#1cb67f';
const PREVIOUS = '#255dab';

const UNITS: { value: Unit; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

/** The shorter tab names for a phone. */
const SHORT: Record<string, string> = { business: 'Business', trust: 'Trust' };

/** "Up 3 on Oct 2026", "Down $4 on ...", "Same as ...". */
function change(now: number, before: number, label: string, asMoney: boolean) {
  const diff = now - before;
  const shown = asMoney ? money(Math.abs(diff)) : String(Math.abs(diff));
  return diff === 0 ? `Same as ${label}` : `${diff > 0 ? 'Up' : 'Down'} ${shown} on ${label}`;
}

export default function OverviewPage() {
  const onTeam = useOnTeam();
  const periodLabel = useId();
  const [unit, setUnit] = useState<Unit>('month');
  /** None until chosen: the current one. */
  const [period, setPeriod] = useState<string | undefined>();
  /** The tab on show: the first, to start. */
  const [tab, setTab] = useState<string | undefined>();
  /** The tile in each tab's chart: its first of what happened, to start. */
  const [picked, setPicked] = useState<Record<string, string>>({});
  /** Customize my overview, open. */
  const [choosing, setChoosing] = useState(false);

  const data = useQuery({
    queryKey: [...staffKeys.overview, unit, period],
    queryFn: () => apiGet<Overview>(`/staff/overview?unit=${unit}${period ? `&period=${period}` : ''}`),
    enabled: onTeam,
    // What is on show stays, faded, while another length or period comes.
    placeholderData: keepPreviousData,
  });

  // Another length or period on the way: the top bar runs.
  useLoadingBar(data.isPlaceholderData);

  // How many cards My overview holds, kept in this browser so the next
  // visit's skeleton opens in its shape. Storage, not loading.
  const mineCount = data.data?.sections.find((each) => each.key === 'mine')?.tiles.length;
  useEffect(() => {
    if (mineCount === undefined) return;
    try {
      localStorage.setItem(MINE_COUNT, String(mineCount));
    } catch {
      // No storage: the skeleton opens on the first part of the team.
    }
  }, [mineCount]);

  // Until the numbers have come, the page's whole skeleton (rule 12).
  if (!data.data && !data.isError) return <Loading />;
  const now = data.data;

  // Their tabs: My overview while there is a card to choose (not for
  // DevOps alone), then their parts of the team.
  const sections = now?.sections.filter((each) => each.key !== 'mine' || now.choices.length > 0) ?? [];
  const mine = sections.find((each) => each.key === 'mine');
  // The tab on show, if this person still has it, else My overview once it
  // has cards, else their first part of the team; and the tile in its
  // chart, the one picked or its first of what happened.
  const section =
    sections.find((each) => each.key === tab) ??
    (mine?.tiles.length ? mine : (sections.find((each) => each.key !== 'mine') ?? mine));
  const periodTiles = section?.tiles.filter((tile) => tile.kind === 'period') ?? [];
  const charted = periodTiles.find((tile) => tile.key === picked[section?.key ?? '']) ?? periodTiles[0];
  const series: Series[] =
    now && charted?.chart
      ? [
          { name: now.label, color: CURRENT, values: charted.chart.current },
          { name: now.previousLabel, color: PREVIOUS, values: charted.chart.previous },
        ]
      : [];

  return (
    <StaffPage
      title="Overview"
      meta="The numbers your part of the team needs, a week, a month or a year at a time"
      actions={
        now ? (
          <>
          {sections.length > 1 && section ? (
            <div className={styles.tabs}>
              <Tabs<string>
                tabs={sections.map((each) => ({ value: each.key, label: each.title, short: SHORT[each.key] }))}
                active={section.key}
                onChange={setTab}
                label="Which part of the team"
              />
            </div>
          ) : null}
          <div className={styles.controls}>
            <ChipRow label="A week, a month or a year">
              {UNITS.map((each) => (
                <Chip
                  key={each.value}
                  selected={unit === each.value}
                  onClick={() => {
                    setUnit(each.value);
                    setPeriod(undefined);
                  }}
                >
                  {each.label}
                </Chip>
              ))}
            </ChipRow>
            <span id={periodLabel} hidden>
              Which one
            </span>
            <Dropdown<string>
              value={now.period}
              options={now.periods}
              onChange={setPeriod}
              labelledBy={periodLabel}
              className={styles.filter}
            />
          </div>
          </>
        ) : null
      }
    >
      {data.isError && !now ? (
        <QueryProblem error={data.error} onRetry={() => void data.refetch()} />
      ) : now ? (
        <div className={data.isPlaceholderData ? styles.loading : undefined} aria-busy={data.isPlaceholderData || undefined}>
          {sections.length === 0 ? (
            <Panel padded>
              <p className={styles.lead}>There are no numbers for your part of the team yet.</p>
            </Panel>
          ) : null}
          {section?.key === 'mine' ? (
            // My overview's button to customize it: the gear and its words
            // (while it is empty, the one button under the line is enough).
            <div className={styles.mineBar}>
              <span className={styles.lead}>
                {section.tiles.length ? 'The cards you chose, in your order' : 'Pick the cards you want to see here'}
              </span>
              {section.tiles.length ? (
                <button type="button" className={styles.gear} onClick={() => setChoosing(true)}>
                  <SettingsIcon size={18} />
                  Customize my overview
                </button>
              ) : null}
            </div>
          ) : null}
          {section?.key === 'mine' && section.tiles.length === 0 ? (
            <div className={styles.notePanel}>
              <Button onClick={() => setChoosing(true)}>Customize my overview</Button>
            </div>
          ) : section ? (
            section.note ? (
              <div className={styles.notePanel}>
                <p className={styles.lead}>{section.note}</p>
              </div>
            ) : (
              <>
                <div className={styles.tiles}>
                  {section.tiles.map((tile) =>
                    tile.kind === 'now' ? (
                      <div key={tile.key} className={styles.tile}>
                        <span className={styles.tileLabel}>{tile.label}</span>
                        <span className={styles.tileValue}>{tile.current}</span>
                        {tile.note ? <span className={styles.tileNote}>{tile.note}</span> : null}
                      </div>
                    ) : (
                      <button
                        key={tile.key}
                        type="button"
                        aria-pressed={charted?.key === tile.key}
                        className={[styles.tile, styles.tap, charted?.key === tile.key ? styles.tileOn : '']
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() => setPicked((was) => ({ ...was, [section.key]: tile.key }))}
                      >
                        <span className={styles.tileLabel}>{tile.label}</span>
                        <span className={styles.tileValue}>{tile.money ? money(tile.current) : tile.current}</span>
                        <span className={styles.tileNote}>
                          {change(tile.current, tile.previous ?? 0, now.previousLabel, tile.money)}
                        </span>
                        {tile.note ? <span className={styles.tileNote}>{tile.note}</span> : null}
                      </button>
                    ),
                  )}
                </div>
                {charted ? (
                  <div className={styles.card}>
                    <h2 className={styles.heading}>
                      {charted.label}, {now.label}
                    </h2>
                    <Legend items={series} line />
                    <LineChart
                      labels={now.labels}
                      series={series}
                      count={!charted.money}
                      label={`${charted.label} for ${now.label}, beside ${now.previousLabel}`}
                    />
                  </div>
                ) : null}
              </>
            )
          ) : null}
        </div>
      ) : null}

      {choosing && now ? (
        <CardsSheet
          choices={now.choices}
          chosen={mine?.tiles.map((tile) => tile.key) ?? []}
          onSaved={() => {
            setChoosing(false);
            setTab('mine');
          }}
          onClose={() => setChoosing(false)}
        />
      ) : null}
    </StaffPage>
  );
}
