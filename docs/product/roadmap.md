# Roadmap

## Order of work, and what is deliberately deferred

**Status:** Decided
**Read this if:** you are scoping the build, or tempted to add something.

---

## Overview

The roadmap has a gate in the middle of it. Everything before the gate is cheap and reversible. Everything after it is a serious commitment, and it is conditional on evidence.

```ascii
            VALIDATION GATE
                  │
  PHASE 0         │              PHASE 1              PHASE 2        PHASE 3
  prove demand    │         build it properly         grow it        expand
  on the old app  │                                                   
  ────────────────┼──────────────────────────────────────────────────────►
  6 weeks         │         3–6 months                ongoing       years
  ~$0             │                                                  
                  │
        5+ dealers paying anything,
        and a Zimbabwe operator found
```

---

## Phase 0 — Validate, on the existing app

**Do not start the rewrite here.** The existing v1 app, with a short list of fixes, is good enough to find out whether anyone cares.

| Work | Why |
| --- | --- |
| Close the unauthenticated write routes | Anyone can currently delete any listing |
| Stop returning contact details in public responses | The seller base is scrapable today |
| Make search work | The platform's headline advantage is currently absent |
| Add pagination | The feed stops at ten listings |
| Auto-approve listings, take down on report | Nothing goes live while the operator is away |
| Add link previews for shared listings | Every WhatsApp share is currently wasted |
| Add analytics with reveal tracking | Otherwise the test cannot be measured |
| Add the Wanted feed and dealer cards | The lead product needs somewhere to live |
| Make promotion actually affect ordering | The field exists and does nothing |

Then: recruit 10–15 dealers, list their stock by hand, drive buyers through WhatsApp, and ask for money at week four.

Full detail, with pass and fail thresholds, in [../operations/validation-test.md](../operations/validation-test.md).

**Gate:** at least five dealers paying something, and a named Zimbabwe operator. A fail here means stop or rethink — not proceed anyway.

---

## Phase 1 — Build it properly

Only after a pass.

### 1.1 Foundation

- Monorepo with shared types and validation between clients
- Relational database with the full listing model — **all four listing types defined**, even though only three ship
- Authentication with phone and one-time code, and the role hierarchy actually cascading
- One REST API with a published machine-readable contract
- Image pipeline retained as it is; object storage with no egress charges is already the right answer

### 1.2 Public marketplace

- Server-rendered browse feed, search and listing pages
- Readable slugs, link-preview tags, structured product markup, sitemap
- The four card types
- Specification search with per-category filters
- Contact reveal with recording and rate limiting

### 1.3 Accounts and posting

- Three-way posting flow
- Saved listings
- Account hub
- Verification tiers

### 1.4 Moderation

- Reporting, report queue, takedowns
- Discipline pipeline with the violation matrix and appeals
- Listing expiry with re-engagement nudges

### 1.5 Dealer console

- Mobile first: stock, leads, promote, shop profile
- Desktop: stock table with bulk import, two-pane leads
- Public shopfront

### 1.6 Billing

- Collection from dealers, initially manual
- Automated only once dealers have paid manually
- Invoices for business accounts

---

## Phase 2 — Grow it

### The Friday Drop becomes a product

Manual during Phase 0 and 1. Then: scheduled publishing, a drop slot marketplace for dealers, notifications to the campus channel.

### Auctions

**The drop is what makes auctions viable.** Once people reliably arrive at a known time, there are bidders. Before that, an auction closing with zero bids is a public notice that the place is empty.

Requirements when it happens: account required to bid, paid listing fee, append-only bid history, reliable scheduled close, anti-sniping extension, and contact-brokered settlement — no escrow. Specified in [../features/auctions.md](../features/auctions.md).

### Second campus

Harare Institute of Technology first, since it shares the dealer pool. Then Bulawayo and Gweru. Each campus is its own liquidity problem.

### Native app

Built against the same API contract. **Not before there is inventory** — nobody installs an app for an empty marketplace.

### Price guidance

Accumulated listing data supports a "typical price for this specification" signal. Since people already come online to check prices, this becomes a reason to visit independent of buying.

---

## Phase 3 — The paths that change the ceiling

Recorded so they are not forgotten, and explicitly not being built. Each is a different business, and each one runs *through* the earlier phases rather than around them.

| Path | What it becomes | What it needs |
| --- | --- | --- |
| **More categories** | The general classifieds site for Zimbabwe — vehicles, property | A land grab against Facebook. Vehicles are where classifieds money actually sits, and the swap-plus-cash mechanic is exactly how cars trade worldwide. |
| **More countries** | Regional marketplace across neighbouring markets | Liquidity restarts in each one. Needs capital. |
| **Own the transaction** | Escrow, delivery, warranty, verified refurbishment | Take rate goes from roughly zero to something meaningful. Needs operations, capital and trust. **This is the real unlock.** |
| **Device financing** | Selling gadgets on instalments to people who cannot pay upfront | The largest by far, and it matches the founding insight — people want good gadgets and cannot afford them new. It is a financial services business: capital, credit risk, collections, licensing. |

**The physical swap point** sits between Phase 2 and 3: a counter for safe meeting and device checking. Roughly 20 square metres, needs staff, and is the first step toward owning the transaction. The Waterfalls property is its eventual home, though 4,000 square metres only becomes relevant with larger goods and delivery.

---

## Deferred, with reasons

| Deferred | Why | Revisit when |
| --- | --- | --- |
| **Auctions** | Need a crowd; empty auctions signal death | The drop has a reliable audience |
| **Native app** | Nobody installs an app for an empty marketplace | There is inventory and traffic |
| **Payments between users** | Escrow, refunds, disputes, fraud — a different business | Transaction ownership is a deliberate strategy |
| **Consumer subscription tiers** | Billing complexity before knowing anyone pays | Never, probably |
| **Delivery and warehousing** | Needs staff, vehicles, capital | After a physical presence exists |
| **Vehicles** | Different dealers, trust model and regulation | The gadget category is won |
| **Brazil launch** | Saturated market, no local network, no capital | Not a Swap & Top market. See [../business/company-structure.md](../business/company-structure.md) |

---

## The scope discipline rule

Everything in Phase 0 is cheap. Everything in Phase 1 is months of work. Everything in Phase 2 and 3 is a different company.

The most likely way this project fails is not picking the wrong architecture — it is building Phase 1 or 2 features before the Phase 0 gate has been passed. The v1 history is exactly that pattern: an appeals tribunal, a violation matrix and a four-role hierarchy were built while search, pagination and analytics did not exist.

**Build the gate first.**

---

## Related documentation

- [Validation Test](../operations/validation-test.md) — Phase 0 in full
- [v1 Lessons](../reference/v1-lessons.md) — what happens without scope discipline
- [Auctions](../features/auctions.md) — specified, deferred
- [Company Structure](../business/company-structure.md) — why Phase 1 is conditional on an operator
- [Decisions Log](../reference/decisions-log.md) — every deferral with its reasoning

---

**Last Updated:** September 2026
