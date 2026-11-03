/**
 * Loading: Growth, in the page's own shape: the controls, the four tiles,
 * the two chart cards, the tables and the boosts' tiles. The page shows it
 * too until the period has come.
 */

import { Bone } from '@snt/ui';
import { StaffPage } from '../StaffPage';
import shared from '../revenue/page.module.css';
import styles from './page.module.css';

/** A bone the height of a line of small text, as the text it stands for. */
const LINE = { margin: '2px 0' };

/** The tables' headings, as the page has them (a period's own name is
    left blank). */
const HEADINGS = {
  sites: ['Site', 'Visits', 'Share'],
  sources: ['Source', 'New users', 'Went on to post'],
  searches: ['Search', '', ''],
  categories: ['Category', 'Listings', 'Views', 'Number reveals', 'Wanted listings'],
};

function Table({ rows, heads, gap = true, note = false }: { rows: number; heads: string[]; gap?: boolean; note?: boolean }) {
  const wide = heads.length === 5;
  const row = wide ? styles.categoryRow : styles.twoRow;
  return (
    <>
      <div className={[shared.heading, gap ? styles.gap : ''].join(' ')}>
        <Bone width={180} height={18} />
      </div>
      {note ? (
        <p className={styles.note}>
          <Bone width={320} height={12} />
        </p>
      ) : null}
      <div className={shared.list}>
        <div className={[shared.headerRow, row].join(' ')} aria-hidden>
          {heads.map((head, n) => (
            <span key={n}>{head || '\u00a0'}</span>
          ))}
        </div>
        {Array.from({ length: rows }, (_, n) => (
          <div key={n} className={[shared.row, row].join(' ')}>
            <Bone width={110} height={12} style={LINE} />
            {Array.from({ length: wide ? 4 : 2 }, (_, m) => (
              <Bone key={m} width={36} height={12} style={{ ...LINE, marginLeft: 'auto' }} />
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

export default function Loading() {
  return (
    <StaffPage
      title="Growth"
      meta="Visits, new users, searches and categories, a month or a year at a time"
      actions={
        <div className={shared.controls}>
          <Bone shape="pill" width={140} height={36} />
          <Bone shape="pill" width={200} height={36} />
        </div>
      }
    >
      {/* The page says so while Umami is not connected. */}
      {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ? null : (
        <p className={shared.testNote}>
          Visits and where visitors come from are sample figures. They will be real once Umami is connected.
        </p>
      )}
      <div className={shared.tiles}>
        {[0, 1, 2, 3].map((n) => (
          <div key={n} className={shared.tile}>
            <Bone width={90} height={12} style={LINE} />
            <Bone width={70} height={19} />
            {/* Active users' note runs to two lines. */}
            {n === 3 ? (
              <span style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '2px 0' }}>
                <Bone width={120} height={12} />
                <Bone width={60} height={12} />
              </span>
            ) : (
              <Bone width={120} height={12} style={LINE} />
            )}
          </div>
        ))}
      </div>
      {[0, 1].map((n) => (
        <section key={n} className={shared.card}>
          <div className={shared.cardHead}>
            <Bone width={170} height={18} />
          </div>
          <Bone width={170} height={12} style={{ margin: '2px 0 12px' }} />
          <Bone shape="block" height={240} />
        </section>
      ))}
      <Table rows={7} heads={HEADINGS.sites} gap={false} />
      <Table rows={4} heads={HEADINGS.sources} />
      <Table rows={5} heads={HEADINGS.searches} note />
      <Table rows={7} heads={HEADINGS.categories} />
      <div className={[shared.heading, styles.gap].join(' ')}>
        <Bone width={90} height={18} />
      </div>
      <div className={[shared.tiles, styles.threeTiles].join(' ')}>
        {[0, 1, 2].map((n) => (
          <div key={n} className={shared.tile}>
            <Bone width={110} height={12} style={LINE} />
            <Bone width={60} height={19} />
            <Bone width={120} height={12} style={LINE} />
          </div>
        ))}
      </div>
    </StaffPage>
  );
}
