# Swap & Top

## The signature feature in detail

**Status:** Decided
**Read this if:** you are building the swap listing, the swap card, or anything that consumes swap demand.

---

## Overview

A swap listing says: *I have this, I want that, and cash makes up the difference.*

It is the platform's distinctive feature, the reason the name exists, and — structurally — the most valuable object in the system, because it is simultaneously a listing and a lead.

```ascii
ONE POST, TWO ROLES:

                    ┌─────────────────┐
                    │   SWAP LISTING  │
                    └────────┬────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   ┌─────────────────┐              ┌──────────────────┐
   │  SUPPLY         │              │  DEMAND          │
   │  appears in the │              │  appears in the  │
   │  browse feed    │              │  Wanted feed and │
   │  as a swap card │              │  as a dealer lead│
   └─────────────────┘              └──────────────────┘
```

---

## What a swap listing contains

| Part | Detail |
| --- | --- |
| **What they have** | Item name, full specifications for the category, condition, defects, accessories, 2–8 photos |
| **What they want** | Item name or description, plus whichever specifications matter. No photos — they do not own it. |
| **Cash direction** | They add cash, they receive cash, or straight swap |
| **Cash amount** | Required unless straight swap |

The asymmetry is deliberate. The thing they have is described precisely because a counterparty is evaluating it. The thing they want can be loose — "any i7 with 16GB and an SSD" is a perfectly good request and more likely to match than a single exact model.

---

## Cash direction

Three states, always expressed from the poster's point of view.

| State | Meaning | Who posts this |
| --- | --- | --- |
| **They add cash** | Trading up. Their device is worth less, they make up the difference. | The large majority |
| **They receive cash** | Trading down. They want money back along with the swap. | A minority, usually people who need cash |
| **Straight swap** | Even trade. | Uncommon |

### The ratio is a metric worth watching

Almost everyone wants to trade **up**. That creates a structural matching problem:

```ascii
THE DOUBLE COINCIDENCE PROBLEM:

  Someone wants to trade a lesser device UP.
  A peer match needs someone with the better device
  who wants to trade DOWN for cash.

  trading up   ████████████████████████████  most people
  trading down ███                            few people

  Result: peer-to-peer swaps rarely match.
```

This is the classic reason barter loses to money. The party who is happy to trade down is a **dealer** — they take the older device plus cash, hand over the better one from stock, and resell the trade-in. That is their business model.

**Two consequences:**

1. **Dealers are liquidity, not just revenue.** They must be present from day one, or the feed fills with unanswered trade-up requests and users leave within a fortnight. See [../business/go-to-market.md](../business/go-to-market.md).
2. **Track the ratio.** If trade-up posts dominate and trade-down posts are rare, every unmatched trade-up post is one only a dealer can fill. That number tells you directly how much dealer capacity is needed. See [../operations/metrics.md](../operations/metrics.md).

---

## The swap card

The most recognisable element in the product. Full specification in [../product/card-system.md](../product/card-system.md).

Two things make it unmistakable: the two-tile split, and the two brand colours — a blue "Has" tile carrying the cash amount, beside a green "Looking for" tile.

It has to survive being screenshotted into WhatsApp and viewed small, out of context.

---

## The swap detail screen

Wireframe frame: `DetailSwap`.

```ascii
┌──────────────────────────────────────┐
│ ←  Swap & Top              ♡    ↗    │
├──────────────────────────────────────┤
│  ┌────────┐   ⇄      ┌ ─ ─ ─ ─┐     │  ← tinted panel
│  │ photo  │  +$240   │  want  │     │
│  └────────┘  they add└ ─ ─ ─ ─┘     │
│  THEY HAVE            THEY WANT      │
│  MacBook Air 2017     Any i7 16GB    │
├──────────────────────────────────────┤
│  WHAT THEY ARE TRADING IN            │
│  Processor    │ RAM                  │
│  Storage      │ Condition            │
│  Defects noted                       │
├──────────────────────────────────────┤
│  Tarisai M. · 3 confirmed deals      │
│  University of Zimbabwe · joined...  │
├──────────────────────────────────────┤
│  7 viewed today · 2 offers made      │
├──────────────────────────────────────┤
│ [ I have this — make an offer ]  📞  │
│  Meet on campus · check for locks    │
└──────────────────────────────────────┘
```

Note the primary action: **"I have this — make an offer"**, not "contact seller." The swap is a proposal, so the natural response is a counter-proposal. Revealing the number is the secondary action.

**Defects are shown prominently** rather than buried. A trade-in's flaws are exactly what a counterparty needs to know, and hiding them produces failed meetings and reports.

---

## Making an offer

An offer against a swap listing carries:

- Which item the offerer is putting forward — for a dealer, an item from their stock
- The cash amount they propose, which may differ from the asking amount
- A short message

**Offers are not binding and not escrowed.** They are a structured way of starting the conversation, after which the two parties settle it themselves. This is consistent with the contact-broker model throughout.

The listing owner sees offers on their own listing and in their account hub. Offer counts appear publicly on the listing as a liveness signal.

---

## How a swap becomes a lead

Automatically, with no extra action from the poster.

1. A swap listing is published with the dealer-offers consent enabled (the default)
2. It is indexed as demand: what is wanted, what is coming back in trade, how much cash
3. Dealers whose stock matches the wanted specification are alerted
4. The dealer sees the lead with the trade-in and the cash on offer, and an explicit note of which of their items matches

If the poster disables dealer offers, the listing remains fully public and contactable but does not enter dealer lead feeds. See [wanted-and-leads.md](./wanted-and-leads.md).

---

## Matching rules

A dealer's stock matches a swap's wanted specification when:

- The category matches
- Every specified minimum is met or exceeded — "16GB" means 16 or more, not exactly 16
- Where a model is named, the dealer's item is that model or a stated equivalent
- The dealer's price is within reach of the trade-in value plus the offered cash

That last condition prevents obviously pointless matches, and requires a rough trade-in valuation. Early on this is approximate; as listing data accumulates it improves. Being slightly generous is better than being strict — a dealer would rather dismiss a marginal lead than never see it.

---

## Why this generalises

Trade-in-plus-cash is not a gadget novelty. It is **how cars are traded everywhere in the world**. That confirms the primitive is sound and points at the eventual category expansion. Vehicles are deferred — see [../product/roadmap.md](../product/roadmap.md) — but the mechanic will carry over unchanged.

---

## Definition of done

- [ ] Swap listings capture both items with correct specification sets
- [ ] All three cash directions supported, with the amount label changing accordingly
- [ ] The swap card is visually distinct at every size, including compact
- [ ] Swap listings appear in both the browse feed and the Wanted feed
- [ ] Defects are surfaced prominently on the detail screen
- [ ] Offers can be made and are visible to the owner
- [ ] Dealer matching runs on the wanted specification and respects consent
- [ ] The trade-up versus trade-down ratio is measurable

---

## Related documentation

- [Listing Types](./listing-types.md) — the shared model
- [Wanted & Leads](./wanted-and-leads.md) — the demand side and the revenue product
- [Card System](../product/card-system.md) — the signature card
- [Post Flow](../product/post-flow.md) — the cash direction control
- [Go To Market](../business/go-to-market.md) — why dealers must arrive with users
- [Metrics](../operations/metrics.md) — the ratio and the response rate

---

**Last Updated:** September 2026
