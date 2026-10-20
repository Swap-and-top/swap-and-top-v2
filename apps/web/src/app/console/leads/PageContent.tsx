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

import { toast } from 'sonner';
import {
  currentShop,
  mockLeads,
  mockShopReveals,
  mockUsers,
  newLeadCount,
  offersMadeBy,
  useConsoleStore,
  useOfferStore,
  type Lead,
  type LeadTab,
} from '@snt/core';
import {
  Badge,
  Button,
  ConsoleShell,
  Eyebrow,
  Field,
  ItemName,
  LeadCard,
  PosterRow,
  specSummary,
} from '@snt/ui';
import { CheckIcon, InfoIcon, PhoneIcon } from '@snt/ui/icons';
import { LeadAlertsChip } from '@/components/leadAlerts/LeadAlerts';
import { RevealsTable, SentOffersTable } from './LeadTables';
import { LeadTabs } from './LeadTabs';
import styles from './page.module.css';


/** The shop's own account: the offers it sends are made from it. */
const dealerId =
  mockUsers.find((user) => user.shopId === currentShop.id)?.id ?? '';

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

  /** The offers the shop has sent, newest first, in every state. */
  const offers = useOfferStore((store) => store.offers);
  const addOffer = useOfferStore((store) => store.add);
  const sent = offersMadeBy(offers, dealerId);

  const counts: Record<LeadTab, number> = {
    matching: mockLeads.length,
    reveals: mockShopReveals.length,
    offers: sent.length,
  };

  /** Sends the offer in the composer, as the shop, to the open request. */
  function sendOffer() {
    if (!active) return;
    const amount = Number(offerPrice.replace(/[^\d]/g, ''));
    addOffer({
      id: `o-${Date.now()}`,
      listingId: active.demand.id,
      fromUserId: dealerId,
      item: {
        listingId: active.matchedStockId,
        name: active.matchedStockLabel ?? 'Sourced to order',
      },
      cashAmount: amount,
      cashFrom: 'owner',
      message: offerMessage.trim() || undefined,
      state: 'pending',
      sentLabel: 'Just now',
    });
    // A name may end in its own full stop ("Tarisai M.").
    toast.success(
      `Offer sent to ${active.requester.displayName.replace(/\.$/, '')}.`,
      {
        action: { label: 'See it', onClick: () => setLeadTab('offers') },
      },
    );
  }

  return (
    <ConsoleShell
      shop={currentShop}
      title="Leads"
      meta="People asking for what you sell, newest first"
      newLeadCount={newLeadCount}
      actions={
        <>
          {/* How lead alerts stand; opens their settings. */}
          <div className={styles.alerts}>
            <LeadAlertsChip />
          </div>

          {/* The three tabs, as a segmented switch with their icons. */}
          <div className={styles.tabs}>
            <LeadTabs active={leadTab} counts={counts} onChange={setLeadTab} />
          </div>
        </>
      }
    >
      {/* Number reveals: who revealed the shop's number, and the deal
          check on each. Offers sent: the shop's offers, as the people who
          asked see them. Matching requests: the feed and review queue. */}
      {leadTab === 'reveals' ? (
        <RevealsTable reveals={mockShopReveals} />
      ) : leadTab === 'offers' ? (
        <SentOffersTable offers={sent} />
      ) : (
        <>
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
                    Wants{' '}
                    <ItemName side="wanted">{lead.demand.wants.name}</ItemName>
                  </span>
                  <span className={styles.listSub}>{subtitleFor(lead)}</span>
                  {lead.alert ? (
                    <span className={styles.listAlert}>
                      {alertLine(lead.alert)}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>

            {active ? (
              <div className={styles.detail}>
                <Eyebrow>They want</Eyebrow>
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
                      : undefined;
                  const cash =
                    active.demand.type === 'swap'
                      ? active.demand.cashAmount
                      : undefined;

                  if (!tradeIn) return null;

                  return (
                    <div className={styles.detailCards}>
                      <div className={styles.tradeInCard}>
                        <Eyebrow tight>Has</Eyebrow>
                        <ItemName
                          side="owned"
                          bold
                          className={styles.tradeInName}
                        >
                          {tradeIn.name}
                        </ItemName>
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
                        <CheckIcon size={14} weight={2.6} />1 match in your
                        stock
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
                          What they swap covers ${active.coversAmount}
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <div className={styles.matchBody}>
                      <span className={styles.placeholder}>
                        Dealers routinely source to order, so this is still a
                        lead.
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
                  <Button size="md" onClick={sendOffer}>
                    Send offer
                  </Button>
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
        </>
      )}
    </ConsoleShell>
  );
}

/** "Alerted by WhatsApp · 10:42", as the lead's alert was sent. */
function alertLine(alert: NonNullable<Lead['alert']>): string {
  const how = alert.via.includes('whatsapp')
    ? 'Alerted by WhatsApp'
    : 'Alerted in the app';
  return `${how} · ${alert.at}`;
}

function subtitleFor(lead: Lead): string {
  if (lead.demand.type === 'swap') {
    const cash = lead.demand.cashAmount;
    const upTo = lead.demand.cashUpTo ? ' up to' : '';
    return `Has ${lead.demand.has.name}${cash ? ` · adds${upTo} $${cash}` : ''}`;
  }
  return `Budget up to $${lead.demand.budget} · cash only`;
}
