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

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  contactOpenToDealers,
  currentShop,
  mockLeads,
  mockShopReveals,
  mockUsers,
  newLeadCount,
  useConsoleStore,
  useOfferStore,
  type Lead,
  type LeadTab,
  type Offer,
} from '@snt/core';
import {
  Badge,
  Button,
  ConsoleShell,
  Field,
  LeadCard,
  LeadLabel,
  LeadTradeIn,
  PosterRow,
  leadAlertLine,
  leadFacts,
} from '@snt/ui';
import { CheckIcon, InfoIcon } from '@snt/ui/icons';
import { LeadAlertsChip } from '@/components/leadAlerts/LeadAlerts';
import { RevealAction } from '@/components/RevealAction';
import { RevealsTable } from './LeadTables';
import { LeadTabs } from './LeadTabs';
import styles from './page.module.css';


/** The shop's own account: the offers it sends are made from it. */
const dealerId =
  mockUsers.find((user) => user.shopId === currentShop.id)?.id ?? '';

export default function ConsoleLeadsPage() {
  const {
    leadTab,
    setLeadTab,
    setOffersTab,
    activeLeadId,
    setActiveLead,
    offerPrice,
    offerMessage,
    setOfferPrice,
    setOfferMessage,
  } = useConsoleStore();

  const active =
    mockLeads.find((lead) => lead.id === activeLeadId) ?? mockLeads[0];

  const offers = useOfferStore((store) => store.offers);
  const addOffer = useOfferStore((store) => store.add);
  const router = useRouter();

  const counts: Record<LeadTab, number> = {
    matching: mockLeads.length,
    reveals: mockShopReveals.length,
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
        // To the Offers page, on Sent, where the shop's offers are.
        action: {
          label: 'See it',
          onClick: () => {
            setOffersTab('sent');
            router.push('/console/trade-ins');
          },
        },
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

          {/* The two tabs, as a segmented switch. */}
          <div className={styles.tabs}>
            <LeadTabs active={leadTab} counts={counts} onChange={setLeadTab} />
          </div>
        </>
      }
    >
      {/* Number reveals: who revealed the shop's number, and the deal
          check on each. Matching requests: the feed and review queue. The
          shop's own offers are on the Offers page, under Sent. */}
      {leadTab === 'reveals' ? (
        <RevealsTable reveals={mockShopReveals} />
      ) : (
        <>
          {/* Phone: a feed. */}
          <div className={styles.feed}>
            {mockLeads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                contact={
                  canReach(lead, offers) ? (
                    <RevealAction
                      listingId={lead.demand.id}
                      ownerId={lead.requester.id}
                      size="md"
                    />
                  ) : null
                }
              />
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
                  {/* As the phone's card: the label, the item wanted in
                      green, the facts small and grey. */}
                  <span className={styles.listHead}>
                    <LeadLabel lead={lead} />
                    <span className={styles.spacer} />
                    {lead.isNew ? <Badge tone="brand">New</Badge> : null}
                    <span className={styles.listAge}>{lead.receivedAt}</span>
                  </span>
                  <span className={styles.listTitle}>
                    {lead.demand.wants.name}
                  </span>
                  <span className={styles.listSub}>
                    {leadFacts(lead).map((fact) => (
                      <span key={fact}>{fact}</span>
                    ))}
                  </span>
                  {leadAlertLine(lead) ? (
                    <span className={styles.listAlert}>
                      {leadAlertLine(lead)}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>

            {active ? (
              <div className={styles.detail}>
                {/* Set as the phone's card, with more room: the label,
                    the item wanted, the facts, then what they have. */}
                <div className={styles.listHead}>
                  <LeadLabel lead={active} />
                  <span className={styles.spacer} />
                  {active.isNew ? <Badge tone="brand">New</Badge> : null}
                  <span className={styles.listAge}>{active.receivedAt}</span>
                </div>
                <h1 className={styles.detailTitle}>
                  {active.demand.wants.name}
                </h1>
                <div className={styles.listSub}>
                  {leadFacts(active).map((fact) => (
                    <span key={fact}>{fact}</span>
                  ))}
                </div>
                {leadAlertLine(active) ? (
                  <div className={styles.listAlert}>{leadAlertLine(active)}</div>
                ) : null}

                <div className={styles.detailTradeIn}>
                  <LeadTradeIn lead={active} details />
                </div>

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
                      canReach(active, offers) ? (
                        <RevealAction
                          listingId={active.demand.id}
                          ownerId={active.requester.id}
                          block={false}
                          size="sm"
                        />
                      ) : null
                    }
                  />
                  {/* They keep their details back until they accept an
                      offer, and did not open them to dealers. */}
                  {canReach(active, offers) ? null : (
                    <p className={styles.keptBack}>
                      <InfoIcon size={14} weight={1.9} />
                      Their contact details are shared only if they accept
                      your offer.
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </>
      )}
    </ConsoleShell>
  );
}

/**
 * Whether the shop may see the requester's details: they show them to
 * everyone, or let dealers see them, or accepted the shop's offer.
 */
function canReach(lead: Lead, offers: Offer[]): boolean {
  if (contactOpenToDealers(lead.demand)) return true;
  return offers.some(
    (offer) =>
      offer.listingId === lead.demand.id &&
      offer.fromUserId === dealerId &&
      offer.state === 'accepted',
  );
}
