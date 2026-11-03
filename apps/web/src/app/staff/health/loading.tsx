/**
 * Loading: Health, in the page's own shape: the four tiles, the deploy
 * card, the last 30 days' tiles and chart, and the three tables. The page
 * shows it too until the figures have come.
 */

import { Bone } from '@snt/ui';
import { StaffPage } from '../StaffPage';
import shared from '../revenue/page.module.css';
import growth from '../growth/page.module.css';
import styles from './page.module.css';

/** A bone the height of a line of small text, as the text it stands for. */
const LINE = { margin: '2px 0' };

function Tiles({ count }: { count: number }) {
  return (
    <div className={[shared.tiles, count === 3 ? growth.threeTiles : ''].join(' ')}>
      {Array.from({ length: count }, (_, n) => (
        <div key={n} className={shared.tile}>
          <Bone width={110} height={12} style={LINE} />
          <Bone width={70} height={19} />
          <Bone width={130} height={12} style={LINE} />
        </div>
      ))}
    </div>
  );
}

function Table({ heads, row, rows }: { heads: string[]; row?: string; rows: number }) {
  return (
    <div className={shared.list}>
      <div className={[shared.headerRow, row].join(' ')} aria-hidden>
        {heads.map((head) => (
          <span key={head}>{head}</span>
        ))}
      </div>
      {Array.from({ length: rows }, (_, n) => (
        <div key={n} className={[shared.row, row].join(' ')}>
          <Bone width={110} height={12} style={LINE} />
          {heads.slice(1).map((head) => (
            <Bone key={head} width={36} height={12} style={{ ...LINE, marginLeft: 'auto' }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Loading() {
  return (
    <StaffPage title="Health" meta="How the site is running, and its errors and slow requests over the last 30 days">
      {/* The page says so off the live site. */}
      {process.env.NODE_ENV === 'production' ? null : (
        <p className={shared.testNote}>
          Errors and slow requests are recorded on the live site only. This copy runs on a computer, so none are
          counted here.
        </p>
      )}
      <Tiles count={4} />
      <section className={[shared.card, styles.deploy].join(' ')}>
        <div className={shared.heading}>
          <Bone width={110} height={18} />
        </div>
        <Bone width={320} height={12} style={{ margin: '6px 0 7px' }} />
      </section>
      <div className={[shared.heading, growth.gap].join(' ')}>
        <Bone width={150} height={18} />
      </div>
      <Tiles count={3} />
      <section className={shared.card}>
        <div className={shared.cardHead}>
          <Bone width={240} height={18} />
        </div>
        <Bone width={170} height={12} style={{ margin: '2px 0 12px' }} />
        <Bone shape="block" height={240} />
      </section>
      <div className={shared.heading}>
        <Bone width={90} height={18} />
      </div>
      <Table heads={['Route', 'Errors', 'Slow', 'Average time']} row={styles.routeRow} rows={3} />
      <div className={[shared.heading, growth.gap].join(' ')}>
        <Bone width={90} height={18} />
      </div>
      <Table heads={['When', 'Route', 'What', 'Time']} row={styles.latestRow} rows={3} />
      <div className={[shared.heading, growth.gap].join(' ')}>
        <Bone width={90} height={18} />
      </div>
      <Table heads={['Month', 'Errors', 'Slow']} row={growth.twoRow} rows={12} />
    </StaffPage>
  );
}
