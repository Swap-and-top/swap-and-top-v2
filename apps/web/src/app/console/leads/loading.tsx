/**
 * Loading: Leads. Built from the page's own styles: the alerts pill and
 * Lead settings, the two tabs as bars, then on a phone a feed of lead cards
 * in bones, line for line, and from a laptop the list beside the open
 * request. The page shows it too until its leads, number reveals and lead
 * settings have all come, so it changes to the real page at once.
 */

import { currentStore } from '@snt/core';
import { Bone, ConsoleShell, Panel } from '@snt/ui';
import styles from './page.module.css';
import skeleton from './loading.module.css';

/** A line of a lead card, as tall as the real one, its bone centred. */
function Line({ height, gap, children }: { height: number; gap: number; children: React.ReactNode }) {
  return <div style={{ height, marginTop: gap, display: 'flex', alignItems: 'center' }}>{children}</div>;
}

/** A lead card in bones, line for line as the real one (LeadCard): the
    label and age, what is wanted, the area and budget, for a swap the item
    they have, whether it matches, who asks, and the two buttons. */
function LeadCardBones({ swap }: { swap: boolean }) {
  return (
    <Panel padded>
      <div className={skeleton.head} style={{ height: 24 }}>
        <Bone shape="pill" width={swap ? 63 : 78} height={24} />
        <Bone width={62} height={11} />
      </div>
      <Line height={20} gap={12}>
        <Bone width="58%" height={16} />
      </Line>
      <Line height={16} gap={4}>
        <Bone width="55%" height={11} />
      </Line>
      {swap ? <Bone shape="block" height={60} style={{ marginTop: 11 }} /> : null}
      <Line height={16} gap={swap ? 10 : 9}>
        <Bone width="52%" height={11} />
      </Line>
      <Line height={16} gap={12}>
        <Bone width={70} height={11} />
      </Line>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 13 }}>
        <Bone shape="pill" height={44} />
        <Bone shape="pill" height={44} />
      </div>
    </Panel>
  );
}

/** The feed on a phone, the list beside the open request on a laptop, in
    bones; also shown by the page while its leads load. */
export function LeadsBones() {
  return (
    <>
      {/* Phone: a feed of lead cards. */}
      <div className={styles.feed} aria-busy aria-label="Loading leads">
        {[false, true, false].map((swap, i) => (
          <LeadCardBones key={i} swap={swap} />
        ))}
      </div>

      {/* Laptop: the list beside the open request. */}
      <div className={styles.panes} aria-hidden>
        <div className={styles.list}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={styles.listItem}>
              <Bone width={140} height={18} />
              <Bone width={`${74 - (i % 3) * 10}%`} height={16} style={{ marginTop: 10 }} />
              <Bone width="58%" height={11} style={{ marginTop: 8 }} />
            </div>
          ))}
        </div>

        <div className={styles.detail}>
          <Bone width={70} height={12} />
          <Bone width="46%" height={30} style={{ marginTop: 7 }} />
          <Bone width={200} height={13} style={{ marginTop: 10 }} />

          <div className={styles.detailCards}>
            <div className={[styles.tradeInCard, skeleton.box].join(' ')}>
              <Bone width={40} height={10} />
              <Bone width="60%" height={18} style={{ marginTop: 12 }} />
              <Bone width="80%" height={12} style={{ marginTop: 12 }} />
              <Bone width="55%" height={12} style={{ marginTop: 8 }} />
            </div>
            <div className={[styles.cashCard, skeleton.box].join(' ')}>
              <Bone width={64} height={10} />
              <Bone width={80} height={28} style={{ marginTop: 10 }} />
            </div>
          </div>

          <div className={[styles.matchPanel, skeleton.box, skeleton.match].join(' ')}>
            <Bone width={140} height={12} />
            <Bone width="40%" height={16} style={{ marginTop: 12 }} />
            <Bone width="25%" height={11} style={{ marginTop: 8 }} />
          </div>

          <div className={styles.composer}>
          <div>
            <Bone width={110} height={12} style={{ marginLeft: 20, marginBottom: 8 }} />
            <Bone shape="pill" height={48} />
          </div>
          <div>
            <Bone width={80} height={12} style={{ marginLeft: 20, marginBottom: 8 }} />
            <Bone shape="pill" height={48} />
          </div>
          <Bone shape="pill" height={44} className={styles.composerSend} />
        </div>

        <div className={[styles.requester, skeleton.requester].join(' ')}>
            <Bone shape="circle" width={36} height={36} />
            <div className={skeleton.lines}>
              <Bone width={180} height={14} />
              <Bone width={240} height={11} />
            </div>
            <Bone shape="pill" width={150} height={36} />
          </div>
        </div>
      </div>
    </>
  );
}

export default function Loading() {
  return (
    <ConsoleShell
      store={currentStore}
      title="Leads"
      meta="People asking for what you sell, newest first"
      actions={
        <>
          {/* How alerts stand, and Lead settings beside it. */}
          <div className={styles.alerts}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Bone shape="pill" width={170} height={30} />
              <Bone shape="pill" width={146} height={36} />
            </span>
          </div>
          {/* The tabs' switch: its pale strip, a bar for each tab. */}
          <div className={[styles.tabs, skeleton.tabs].join(' ')} aria-hidden>
            {[0, 1].map((i) => (
              <span key={i} className={skeleton.tabBone}>
                <Bone width="70%" height={14} />
              </span>
            ))}
          </div>
        </>
      }
    >
      <LeadsBones />
    </ConsoleShell>
  );
}
