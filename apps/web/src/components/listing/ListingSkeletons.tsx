/**
 * A listing page while it loads, one for each kind: built from the real
 * page's own styles, so every shape sits where its content will.
 *
 *  - For sale: the white card with the photo on top, the name and price, the
 *    details two to a row, the line of facts; then the seller and buttons.
 *  - Swap: the card with its two sides, "Has" over a photo band and "Looking
 *    for" over a band, then the terms; then the poster and buttons.
 *  - Wanted: no photo at all, since the poster does not have the thing: the
 *    card with the request and budget, its details; then the poster and
 *    buttons, and the note about store offers.
 */

import {
  AppHeader,
  Bone,
  Screen,
  ScreenBody,
  Stack,
} from '@snt/ui';
import { PreviewBanner } from './PreviewBanner';
import sale from './SaleDetail.module.css';
import swap from './SwapDetail.module.css';
import request from './RequestDetail.module.css';

/** The details grid: short ones two to a row, ruled as the real one is. */
function FactBones({
  styles,
  count,
  wide = 0,
}: {
  styles: typeof sale;
  count: number;
  /** Rows of their own, for prose such as defects noted. */
  wide?: number;
}) {
  return (
    <dl className={styles.facts}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.fact}>
          <dt>
            <Bone width={56} height={13} />
          </dt>
          <dd style={{ marginTop: 6 }}>
            <Bone width={[90, 70, 110, 80][i % 4]} height={18} />
          </dd>
        </div>
      ))}
      {Array.from({ length: wide }).map((_, i) => (
        <div key={`w${i}`} className={[styles.fact, styles.factWide].join(' ')}>
          <dt>
            <Bone width={90} height={13} />
          </dt>
          <dd style={{ marginTop: 6 }}>
            <Bone width="70%" height={18} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Who posted it: their picture, name and trust line. */
function PosterBones() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 62 }}>
      <Bone shape="circle" width={44} height={44} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Bone width={130} height={16} />
        <Bone width={190} height={13} />
      </div>
    </div>
  );
}

/**
 * The buttons under it and their line of advice: one over the other, each
 * full width, as on a sale or swap; or side by side, as on a wanted post.
 */
function ActionBones({ sideBySide = false }: { sideBySide?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        style={{
          display: 'flex',
          flexDirection: sideBySide ? 'row' : 'column',
          gap: 8,
        }}
      >
        {/* Side by side, half each, as the real pair is. */}
        {[0, 1].map((i) => (
          <Bone
            key={i}
            shape="pill"
            height={48}
            width={sideBySide ? 'auto' : '100%'}
            style={sideBySide ? { flex: '1 1 0', minWidth: 0 } : undefined}
          />
        ))}
      </div>
      {sideBySide ? (
        <Bone width={240} height={16} style={{ alignSelf: 'center' }} />
      ) : (
        <>
          <Bone width="80%" height={13} style={{ alignSelf: 'center' }} />
          <Bone width="50%" height={13} style={{ alignSelf: 'center', marginTop: -2 }} />
        </>
      )}
    </div>
  );
}

/** The line of facts at the foot of the card, with save and share opposite. */
function SummaryBones({
  styles,
  tall = false,
}: {
  styles: typeof sale;
  /** Room for the line to run to two, as a sale's often does. */
  tall?: boolean;
}) {
  return (
    <div className={styles.summary}>
      <Bone width={200} height={tall ? 13 : 12} />
      <Bone width={76} height={tall ? 32 : 24} />
    </div>
  );
}

export function SaleListingSkeleton({ preview = false }: { preview?: boolean }) {
  return (
    <Screen surface>
      <AppHeader />
      {preview ? <PreviewBanner /> : null}
      <div className={sale.panel} aria-busy aria-label="Loading listing">
        <section className={sale.card}>
          <div className={sale.media}>
            <Bone shape="block" height="100%" className={sale.photo} style={{ borderRadius: 0 }} />
          </div>
          <div className={sale.body}>
            <div className={sale.heading}>
              <Bone width="55%" height={22} />
              <Bone width={70} height={24} />
            </div>
            <FactBones styles={sale} count={6} wide={1} />
            <SummaryBones styles={sale} />
          </div>
        </section>
      </div>
      <ScreenBody>
        <div className={sale.identity}>
          <PosterBones />
        </div>
        <div className={sale.contact}>
          <ActionBones />
        </div>
      </ScreenBody>
    </Screen>
  );
}

export function SwapListingSkeleton({ preview = false }: { preview?: boolean }) {
  return (
    <Screen surface>
      <AppHeader />
      {preview ? <PreviewBanner /> : null}
      <div className={swap.panel} aria-busy aria-label="Loading listing">
        <div className={swap.card} style={{ background: 'var(--snt-bg-card)', borderRadius: 'var(--snt-radius-xl)' }}>
          {[0, 1].map((side) => (
            <section key={side} className={swap.side}>
              <Bone width={side === 0 ? 40 : 90} height={16} style={{ alignSelf: 'center', margin: '2px 0' }} />
              <div className={swap.band} style={{ background: 'none' }}>
                {/* The photo's part of the band: on top on a phone, beside
                    the details on a wider screen, as the real one is. */}
                <div className={swap.media}>
                  <Bone
                    shape="block"
                    height="100%"
                    style={{ position: 'absolute', inset: 0, borderRadius: 0 }}
                  />
                </div>
                <div className={swap.info} style={{ background: 'var(--snt-skeleton-low)' }}>
                  <div className={swap.heading}>
                    <Bone width="50%" height={25} />
                  </div>
                  <FactBones
                    styles={swap as typeof sale}
                    count={4}
                    wide={side === 0 ? 2 : 0}
                  />
                </div>
              </div>
            </section>
          ))}
          <div className={swap.summary}>
            <Bone width={180} height={20} />
            <Bone width={76} height={24} />
            <Bone width={220} height={14} style={{ marginTop: 2 }} />
          </div>
        </div>
      </div>
      <ScreenBody>
        <div className={swap.identity}>
          <PosterBones />
        </div>
        <div className={swap.actions}>
          <ActionBones />
        </div>
      </ScreenBody>
    </Screen>
  );
}

export function RequestListingSkeleton({ preview = false }: { preview?: boolean }) {
  return (
    <Screen surface>
      <AppHeader />
      {preview ? <PreviewBanner /> : null}
      <div className={sale.panel} aria-busy aria-label="Loading listing">
        <section className={sale.card}>
          <div className={sale.body}>
            <div className={sale.heading}>
              <div className={request.what}>
                <Bone width={80} height={11} />
                <Bone width={200} height={22} style={{ marginTop: 8 }} />
              </div>
              <span className={request.budget}>
                <Bone width={50} height={11} />
                <Bone width={70} height={24} style={{ marginTop: 8 }} />
              </span>
            </div>
            <FactBones styles={sale} count={2} />
            <SummaryBones styles={sale} />
          </div>
        </section>
      </div>
      <ScreenBody>
        <Stack gap={6}>
          <PosterBones />
          <ActionBones sideBySide />
          <Bone shape="block" height={42} />
        </Stack>
      </ScreenBody>
    </Screen>
  );
}
