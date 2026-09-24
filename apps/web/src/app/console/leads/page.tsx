'use client';

/**
 * Console — Leads.
 *
 * Renders both wireframe artboards: `ConsoleLeadsM` as a feed of cards at phone
 * width, and `ConsoleLeadsD` as a two-pane review queue from `lg` up.
 *
 * This is the screen to open twenty seconds into a dealer conversation: here is
 * someone who wants what you stock, here is what they are trading in, here is
 * the cash, and here is your matching item.
 */

import {
  currentShop,
  LEAD_TAB_LABELS,
  mockLeads,
  newLeadCount,
  useConsoleStore,
  type Lead,
  type LeadTab,
} from '@snt/core';
import {
  Badge,
  Button,
  ConsoleShell,
  Eyebrow,
  Field,
  LeadCard,
  PosterRow,
  specSummary,
} from '@snt/ui';
import { CheckIcon, InfoIcon, PhoneIcon } from '@snt/ui/icons';
import styles from './page.module.css';

const TABS: LeadTab[] = ['matching', 'reveals', 'offers'];

const TAB_COUNTS: Record<LeadTab, number> = {
  matching: mockLeads.length,
  reveals: 18,
  offers: 7,
};

export default function ConsoleLeadsPage() {
  const {
    leadTab,
    setLeadTab,
    activeLeadId,
    setActiveLead,
    offerPrice,
    offerMessage,
    setOfferPrice,
    setOfferMessage,
  } = useConsoleStore();

  const active =
    mockLeads.find((lead) => lead.id === activeLeadId) ?? mockLeads[0];

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

          <div className={styles.tabs} role="tablist" aria-label="Leads">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={tab === leadTab}
                className={[styles.tab, tab === leadTab ? styles.tabActive : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => setLeadTab(tab)}
              >
                {LEAD_TAB_LABELS[tab]} {TAB_COUNTS[tab]}
              </button>
            ))}
          </div>
        </>
      }
    >
      {/* Phone: a feed. */}
      <div className={styles.feed}>
        {mockLeads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </div>

      {/* Desktop: request list beside request detail. */}
      <div className={styles.panes}>
        <div className={styles.list}>
          {mockLeads.map((lead) => (
            <button
              key={lead.id}
              type="button"
              onClick={() => setActiveLead(lead.id)}
              className={[
                styles.listItem,
                lead.id === active?.id ? styles.listItemActive : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className={styles.listHead}>
                {lead.isNew ? <Badge tone="accentSolid">New</Badge> : null}
                <span className={styles.listAge}>
                  {lead.receivedAt} · {lead.area}
                </span>
              </span>
              <span className={styles.listTitle}>
                Wants {lead.demand.wants.name}
              </span>
              <span className={styles.listSub}>{subtitleFor(lead)}</span>
            </button>
          ))}
        </div>

        {active ? (
          <div className={styles.detail}>
            <Eyebrow>Request</Eyebrow>
            <h1 className={styles.detailTitle}>
              {active.demand.wants.name}
            </h1>
            <div className={styles.detailMeta}>
              Posted {active.receivedAt} · {active.area}
            </div>

            {(() => {
              const tradeIn =
                active.demand.type === 'swap'
                  ? active.demand.has
                  : active.demand.tradeIn;
              const cash =
                active.demand.type === 'swap'
                  ? active.demand.cashAmount
                  : undefined;

              if (!tradeIn) return null;

              return (
                <div className={styles.detailCards}>
                  <div className={styles.tradeInCard}>
                    <Eyebrow tight>They are trading in</Eyebrow>
                    <div className={styles.tradeInName}>{tradeIn.name}</div>
                    <div className={styles.tradeInSpecs}>
                      {specSummary(tradeIn, 4)}
                      {tradeIn.defects ? (
                        <>
                          <br />
                          {tradeIn.defects}
                        </>
                      ) : null}
                    </div>
                  </div>

                  {cash ? (
                    <div className={styles.cashCard}>
                      <Eyebrow tight accent>
                        They add
                      </Eyebrow>
                      <div className={styles.cashValue}>${cash}</div>
                      <div className={styles.cashNote}>cash on top</div>
                    </div>
                  ) : null}
                </div>
              );
            })()}

            <div className={styles.matchPanel}>
              <div className={styles.matchHead}>
                {active.matchedStockLabel ? (
                  <>
                    <CheckIcon size={14} weight={2.6} />1 match in your stock
                  </>
                ) : (
                  <>
                    <InfoIcon size={14} weight={1.9} />
                    Nothing matching in your stock
                  </>
                )}
              </div>

              {active.matchedStockLabel ? (
                <div className={styles.matchBody}>
                  <div className={styles.matchInfo}>
                    <div className={styles.matchName}>
                      {active.matchedStockLabel}
                    </div>
                    <div className={styles.matchSpecs}>
                      Listed in your stock
                    </div>
                  </div>
                  {active.coversAmount ? (
                    <span className={styles.matchCovers}>
                      Their trade-in covers ${active.coversAmount}
                    </span>
                  ) : null}
                </div>
              ) : (
                <div className={styles.matchBody}>
                  <span className={styles.placeholder}>
                    Dealers routinely source to order — this is still a lead.
                  </span>
                </div>
              )}
            </div>

            <div className={styles.composer}>
              <Field
                label="Your swap price"
                strong
                className={styles.composerPrice}
                value={offerPrice}
                onChange={(event) => setOfferPrice(event.target.value)}
              />
              <Field
                label="Message"
                className={styles.composerMessage}
                value={offerMessage}
                onChange={(event) => setOfferMessage(event.target.value)}
              />
              <Button size="md">Send offer</Button>
            </div>

            <div className={styles.requester}>
              <PosterRow
                user={active.requester}
                trailing={
                  <Button variant="secondary" size="sm">
                    <PhoneIcon size={16} />
                    Show number
                  </Button>
                }
              />
            </div>
          </div>
        ) : null}
      </div>
    </ConsoleShell>
  );
}

function subtitleFor(lead: Lead): string {
  if (lead.demand.type === 'swap') {
    const cash = lead.demand.cashAmount;
    return `Trading in ${lead.demand.has.name}${cash ? ` · adds $${cash}` : ''}`;
  }
  const tradeIn = lead.demand.tradeIn;
  return `Budget up to $${lead.demand.budget}${
    tradeIn ? ` · trading in ${tradeIn.name}` : ' · no trade-in'
  }`;
}
