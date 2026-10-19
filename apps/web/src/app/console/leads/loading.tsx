/**
 * Loading: Leads. Built from the page's own styles: the alerts pill (real,
 * it does not depend on the leads), the tabs as bars, then on a phone a feed
 * of lead cards in bones and from a laptop the two cards side by side.
 */

import { CheckIcon } from '@snt/ui/icons';
import { currentShop, newLeadCount } from '@snt/core';
import { Bone, ConsoleShell, Panel } from '@snt/ui';
import styles from './page.module.css';
import skeleton from './loading.module.css';

/** A lead card in bones; some leads carry something to swap, some not. */
function LeadCardBones({ swap }: { swap: boolean }) {
  return (
    <Panel padded>
      <div className={skeleton.head}>
        <Bone shape="pill" width={40} height={20} />
        <Bone width={150} height={11} />
      </div>
      <Bone width="64%" height={18} style={{ marginTop: 12 }} />
      {swap ? (
        <Bone shape="block" height={44} style={{ marginTop: 10 }} />
      ) : (
        <Bone width="50%" height={13} style={{ marginTop: 8 }} />
      )}
      <Bone width="58%" height={12} style={{ marginTop: 12 }} />
      <div className={skeleton.actions}>
        <Bone shape="pill" width="auto" height={48} />
        <Bone shape="circle" width={48} height={48} />
      </div>
    </Panel>
  );
}

export default function Loading() {
  return (
    <ConsoleShell
      shop={currentShop}
      title="Leads"
      meta="People asking for what you sell, newest first"
      newLeadCount={newLeadCount}
      actions={
        <>
          <span className={styles.alertPill}>
            <CheckIcon size={13} weight={2.6} />
            Lead alerts active
          </span>
          <div className={[styles.tabs, skeleton.tabs].join(' ')} aria-hidden>
            <Bone width={150} height={14} />
            <Bone width={130} height={14} />
            <Bone width={100} height={14} />
          </div>
        </>
      }
    >
      {/* Phone: a feed of lead cards. */}
      <div className={styles.feed} aria-busy aria-label="Loading leads">
        {[true, false, false].map((swap, i) => (
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
            <div className={styles.composerPrice}>
              <Bone width={110} height={12} style={{ marginLeft: 20, marginBottom: 8 }} />
              <Bone shape="pill" height={48} />
            </div>
            <div className={styles.composerMessage}>
              <Bone width={80} height={12} style={{ marginLeft: 20, marginBottom: 8 }} />
              <Bone shape="pill" height={48} />
            </div>
            <Bone shape="pill" width={130} height={44} />
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
    </ConsoleShell>
  );
}
