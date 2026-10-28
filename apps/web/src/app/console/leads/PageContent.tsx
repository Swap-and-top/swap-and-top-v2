'use client';

/**
 * Console — Leads.
 *
 * Renders both wireframe artboards: `ConsoleLeadsM` as a feed of cards at phone
 * width, and `ConsoleLeadsD` as a two-pane review queue from `lg` up.
 *
 * This is the screen to open twenty seconds into a store conversation: here is
 * someone who wants what you stock, here is what they offer to swap, here is
 * the cash, and here is your matching item.
 *
 * Matching requests come from the API (GET /api/stores/{id}/leads), for the
 * store the console is open for; an offer is sent as the store
 * (POST /api/offers with its id), from the composer beside a lead on a
 * laptop, or from a lead card's sheet on a phone. Number reveals come from
 * the API too (GET /api/stores/{id}/reveals), recorded as people use Show
 * contact on the store's listings.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  contactOpenToStores,
  currentStore,
  newLeadCount,
  rememberListings,
  useConsoleStore,
  useOfferStore,
  type Lead,
  type LeadTab,
  type Listing,
  type NumberReveal,
  type Offer,
  type User,
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
  Sheet,
  Stack,
  leadAlertLine,
  leadFacts,
  useCloseSheet,
  useConsoleTarget,
} from '@snt/ui';
import { CheckIcon, InfoIcon } from '@snt/ui/icons';
import { LeadAlertsChip } from '@/components/leadAlerts/LeadAlerts';
import { RevealAction } from '@/components/RevealAction';
import { apiAsViewer } from '@/lib/supabase';
import { RevealsTable } from './LeadTables';
import { LeadTabs } from './LeadTabs';
import styles from './page.module.css';

/** A lead as the API gives it: the requester in brief, and whether the
    store has an offer standing on it. */
type LeadIn = Omit<Lead, 'requester'> & {
  requester: { id: string; displayName: string; confirmedDeals: number };
  offered: boolean;
};

/** The requester as the cards read a person. */
function personOf(requester: LeadIn['requester'], area: string): User {
  return {
    ...requester,
    phoneVerified: true,
    role: 'user',
    standing: 'good',
    location: area,
    joinedAt: '',
    hasUpheldReports: false,
  };
}

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

  const store = useConsoleTarget() ?? currentStore;
  const [leads, setLeads] = useState<Lead[] | null>(null);
  /** Leads the store has an offer standing on. */
  const [offered, setOffered] = useState<Set<string>>(new Set());
  /** On a phone: the lead whose offer sheet is open. */
  const [offering, setOffering] = useState<Lead | null>(null);
  const [sending, setSending] = useState(false);
  /** Who saw how to reach the store, from the API. */
  const [reveals, setReveals] = useState<NumberReveal[] | null>(null);

  useEffect(() => {
    let gone = false;
    void apiAsViewer<{ reveals: NumberReveal[]; listings: Listing[] }>(
      `/stores/${encodeURIComponent(store.id)}/reveals`,
      { method: 'GET' },
    ).then(({ data, error }) => {
      if (gone) return;
      if (error || !data) {
        setReveals([]);
        return;
      }
      rememberListings(data.listings);
      setReveals(data.reveals);
    });
    return () => {
      gone = true;
    };
  }, [store.id]);

  useEffect(() => {
    let gone = false;
    void apiAsViewer<{ leads: LeadIn[] }>(`/stores/${encodeURIComponent(store.id)}/leads`, {
      method: 'GET',
    }).then(({ data, error }) => {
      if (gone) return;
      if (error || !data) {
        toast.error(error ?? 'We could not load the leads.');
        setLeads([]);
        return;
      }
      // Found by id wherever an offer card looks its listing up.
      rememberListings(data.leads.map((lead) => lead.demand));
      setOffered(new Set(data.leads.filter((lead) => lead.offered).map((lead) => lead.id)));
      setLeads(
        data.leads.map(({ offered: _, ...lead }) => ({
          ...lead,
          requester: personOf(lead.requester, lead.area),
        })),
      );
    });
    return () => {
      gone = true;
    };
  }, [store.id]);

  const list = leads ?? [];
  const active = list.find((lead) => lead.id === activeLeadId) ?? list[0];

  const offers = useOfferStore((state) => state.offers);
  const router = useRouter();

  const counts: Record<LeadTab, number> = {
    matching: list.length,
    reveals: reveals?.length ?? 0,
  };

  /** Sends an offer as the store, on a lead: its matching item, or one to
      source to order, for the price typed. Whether it went. */
  async function sendOffer(lead: Lead, priceText: string, message: string): Promise<boolean> {
    const amount = Number(priceText.replace(/[^\d]/g, ''));
    if (!amount) {
      toast.error('Enter your price.');
      return false;
    }
    setSending(true);
    const { data, error } = await apiAsViewer<Offer>('/offers', {
      method: 'POST',
      body: {
        listingId: lead.demand.id,
        item: {
          listingId: lead.matchedStockId,
          name: lead.matchedStockLabel ?? 'Sourced to order',
        },
        cashAmount: amount,
        cashFrom: 'owner',
        message: message.trim() || undefined,
        storeId: store.id,
      },
    });
    setSending(false);
    if (error || !data) {
      toast.error(error ?? 'We could not send it. Try again in a minute.');
      return false;
    }
    useOfferStore.setState((state) => ({ offers: [data, ...state.offers] }));
    setOffered((current) => new Set(current).add(lead.id));
    // A name may end in its own full stop ("Tarisai M.").
    toast.success(
      `Offer sent to ${lead.requester.displayName.replace(/\.$/, '')}.`,
      {
        // To the Offers page, on Sent, where the store's offers are.
        action: {
          label: 'See it',
          onClick: () => {
            setOffersTab('sent');
            router.push('/console/trade-ins');
          },
        },
      },
    );
    return true;
  }

  return (
    <ConsoleShell
      store={store}
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
      {/* Number reveals: who revealed the store's number, and the deal
          check on each. Matching requests: the feed and review queue. The
          store's own offers are on the Offers page, under Sent. */}
      {leadTab === 'reveals' ? (
        <RevealsTable reveals={reveals ?? []} />
      ) : (
        <>
          {/* Phone: a feed. */}
          <div className={styles.feed}>
            {list.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onOffer={() =>
                  offered.has(lead.id)
                    ? toast('You already sent an offer on this one. It is on Offers, under Sent.')
                    : setOffering(lead)
                }
                contact={
                  canReach(lead, offers, store.id) ? (
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
              {list.map((lead) => (
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
                        Stores routinely source to order, so this is still a
                        lead.
                      </span>
                    </div>
                  )}
                </div>

                {offered.has(active.id) ? (
                  <p className={styles.keptBack}>
                    <CheckIcon size={14} weight={2.6} />
                    Your offer is sent. It is on Offers, under Sent.
                  </p>
                ) : (
                  <div className={styles.composer}>
                    <Field
                      label="Your swap price"
                      strong
                      className={styles.composerPrice}
                      placeholder="e.g. $255"
                      value={offerPrice}
                      onChange={(event) => setOfferPrice(event.target.value)}
                    />
                    <Field
                      label="Message"
                      className={styles.composerMessage}
                      placeholder="e.g. I have one in the store. Come and see it."
                      value={offerMessage}
                      onChange={(event) => setOfferMessage(event.target.value)}
                    />
                    <Button
                      size="md"
                      loading={sending}
                      onClick={async () => {
                        if (await sendOffer(active, offerPrice, offerMessage)) {
                          setOfferPrice('');
                          setOfferMessage('');
                        }
                      }}
                    >
                      Send offer
                    </Button>
                  </div>
                )}

                <div className={styles.requester}>
                  <PosterRow
                    user={active.requester}
                    trailing={
                      canReach(active, offers, store.id) ? (
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
                      offer, and did not open them to stores. */}
                  {canReach(active, offers, store.id) ? null : (
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

      {offering ? (
        <LeadOfferSheet
          lead={offering}
          sending={sending}
          onSend={(price, message) => sendOffer(offering, price, message)}
          onClose={() => setOffering(null)}
        />
      ) : null}
    </ConsoleShell>
  );
}

/** On a phone: the offer to a lead, as the laptop's composer has it. */
function LeadOfferSheet({
  lead,
  sending,
  onSend,
  onClose,
}: {
  lead: Lead;
  sending: boolean;
  onSend: (price: string, message: string) => Promise<boolean>;
  onClose: () => void;
}) {
  return (
    <Sheet narrow title="Send an offer" onClose={onClose}>
      <LeadOfferForm lead={lead} sending={sending} onSend={onSend} />
    </Sheet>
  );
}

function LeadOfferForm({
  lead,
  sending,
  onSend,
}: {
  lead: Lead;
  sending: boolean;
  onSend: (price: string, message: string) => Promise<boolean>;
}) {
  const close = useCloseSheet();
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');
  return (
    <Stack gap={6}>
      <p className={styles.sheetLead}>
        To {lead.requester.displayName.replace(/\.$/, '')}, for their{' '}
        {lead.demand.wants.name}:{' '}
        {lead.matchedStockLabel ? `your ${lead.matchedStockLabel}` : 'sourced to order'}.
      </p>
      <Field
        label="Your swap price"
        strong
        placeholder="e.g. $255"
        value={price}
        onChange={(event) => setPrice(event.target.value)}
      />
      <Field
        label="Message"
        placeholder="e.g. I have one in the store. Come and see it."
        value={message}
        onChange={(event) => setMessage(event.target.value)}
      />
      <Button
        size="lg"
        block
        loading={sending}
        onClick={async () => {
          if (await onSend(price, message)) close();
        }}
      >
        Send offer
      </Button>
    </Stack>
  );
}

/**
 * Whether the store may see the requester's details: they show them to
 * everyone, or let stores see them, or accepted the store's offer.
 */
function canReach(lead: Lead, offers: Offer[], storeId: string): boolean {
  if (contactOpenToStores(lead.demand)) return true;
  return offers.some(
    (offer) =>
      offer.listingId === lead.demand.id &&
      offer.fromStoreId === storeId &&
      offer.state === 'accepted',
  );
}
