# Monetization

## What is free, what is paid, and the order in which each product starts earning

**Status:** Decided — prices are hypotheses
**Read this if:** you are building anything that touches billing, limits, or promotion.

---

## Overview

One rule governs everything here:

> **Free where it grows the catalogue. Paid where it grows a seller's results.**

Posting is free for everyone. We are competing with a free product, every listing is inventory we need, and every listing is an indexable page and a shareable link. Charging sellers to post starves the platform of the only thing that makes it useful.

Revenue comes from dealers.

---

## What is free, permanently

- Browsing, searching, filtering
- Opening any listing
- Revealing a seller's phone number (rate-limited per device)
- Sharing a listing
- Posting sale, swap and request listings
- Saving listings
- Phone verification
- Building a confirmed-deal record

---

## What is paid

Four products, listed in the order they begin to earn.

### 1. Lead alerts — dealers

**What it is:** the dealer is notified the moment someone posts a request or swap matching what they stock. Includes the trade-in detail and the cash on offer.

**Why they pay:** in trade-in deals the first credible offer usually wins. This is speed, and speed is money.

**Earns from day one.** Its value comes from the quality of a single lead, not from how much traffic the platform has. This is the product to test first.

**Hypothesis price:** $10 per month.

**Also removes the reveal rate limit.** A dealer working volume will hit the per-device cap that exists to stop scraping. A paid dealer account lifts it.

---

### 2. Dealer console — dealers

**What it is:** a simple system to run stock, sales, trade-ins and customer records. Stock added here publishes to the marketplace in one action.

**Why they pay:** most small shops run on paper and WhatsApp. This saves real time, every day.

**Earns from day one, and it is the strategic centre of the plan.** Three reasons:

- It has **standalone value**. It is worth paying for even if the marketplace never reaches liquidity.
- It **inverts the cold-start problem**. Supply arrives because dealers are running their shop on our system, not because we recruited listings.
- It is **supportable remotely**, which matters given the founder's relocation.

It is also a [Greta Works Digital](./company-structure.md) product sold to Swap & Top's supply side — the bridge between the two companies.

**Hypothesis price:** $15–30 per month.

---

### 3. Sponsored slots — dealers

**What it is:** a dealer's listing appears in a clearly labelled slot in the browsing feed, roughly every sixth card.

**Why they pay:** visibility, once there is something to be visible in.

**Does not earn until there is traffic.** A boost on a feed with fifty visitors a day is worth nothing. So:

- Build it early, because it is cheap
- Give it away free during validation
- Measure reveals on sponsored listings against everything else
- Start charging once you can say *"sponsored listings got three times the contacts"*

Selling promotion with evidence is a different conversation from selling it on a promise.

**Critical implementation rule: interleave, do not sort to the top.** If promoted listings are simply sorted first, five paying dealers own the entire first screen and the feed stops feeling like a community. Labelled slots at fixed intervals, rotated among payers. Detail in [../features/feed-and-filters.md](../features/feed-and-filters.md).

**Hypothesis price:** $12 per item per week.

---

### 4. Friday Drop slots — dealers

**What it is:** a place in a weekly batch of checked deals, published together at a set time and announced to the campus channel.

**Why they pay:** attention is concentrated at a known moment, so a slot in it is worth more than a slot in a continuous feed.

**Earns early despite low traffic**, precisely because it concentrates attention in time rather than relying on volume.

**Hypothesis price:** $15 per slot.

See [go-to-market.md](./go-to-market.md) for what the drop is and why it exists.

---

## What is explicitly not sold

| Not sold | Why |
| --- | --- |
| **Posting** | Starves the catalogue; competitor is free |
| **Extra listing slots for ordinary users** | Same reason. Caps exist for spam control, not revenue |
| **Consumer tiers (pro, platinum)** | Billing complexity built before knowing anyone will pay |
| **Subscriptions for ordinary users** | Recurring billing is hard on local payment rails |
| **Success fees on completed sales** | Uncollectible — we are a contact broker and cannot see whether a sale happened |
| **Any trust signal for private sellers** | Trust must be earned through behaviour, never bought. Confirmed deals, reply time and account age are all free. |
| **Student or occupation verification** | Not the platform's business, a data-protection liability, and a weak signal |

---

## The listing cap, and why it is not a paywall

Ordinary users have a **soft cap on active listings** — roughly ten.

It is framed and enforced as **spam prevention**, and it is lifted by **free phone verification**, never by payment. This gets quality control without taxing the growth of the catalogue.

---

## Why success fees cannot work here

Worth stating explicitly, because it is a common instinct.

The platform introduces two people and steps out. No money passes through it. We have no way of knowing whether a deal closed, at what price, or at all. Any percentage-of-sale model would rely on self-reporting, which nobody does.

A flat fee is the only honest structure while the platform remains a contact broker. If the business ever owns the transaction — escrow, delivery, warranty — that changes completely, and the take rate goes from roughly zero to something meaningful. That is a different business and it is recorded in [../product/roadmap.md](../product/roadmap.md).

---

## Earning timeline

```ascii
WHICH PRODUCTS EARN, AND WHEN:

              no traffic        some traffic       real traffic
                  │                   │                  │
Lead alerts       ████████████████████████████████████████   earns immediately
Dealer console    ████████████████████████████████████████   earns immediately
Friday Drop       ░░░░░░░░████████████████████████████████   needs an audience at a set time
Sponsored slots   ░░░░░░░░░░░░░░░░░░░░████████████████████   needs volume
Verification fees ░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████████   needs the badge to mean something
```

---

## Collection

Manual first, deliberately. Dealers pay by mobile money, and a human flips the flag in the admin tools. Zero payment engineering during validation.

Automated collection only after dealers have actually paid something manually. Detail and the reasons in [../operations/payments-and-invoicing.md](../operations/payments-and-invoicing.md).

---

## The one number that matters

> **Will a dealer, having seen real leads for a month, pay anything at all?**

If yes, there is a business, and the architecture work is justified. If no, no amount of product quality fixes it. This is the primary gate in [../operations/validation-test.md](../operations/validation-test.md).

---

## Related documentation

- [Target Users](./target-users.md) — who pays and who does not
- [Go To Market](./go-to-market.md) — the drop, and how dealers are recruited
- [Payments & Invoicing](../operations/payments-and-invoicing.md) — collection mechanics
- [Dealer Console](../product/dealer-console.md) — the paid surface
- [Feed & Filters](../features/feed-and-filters.md) — sponsored slot placement rules
- [Validation Test](../operations/validation-test.md) — how willingness to pay gets tested

---

**Last Updated:** September 2026
