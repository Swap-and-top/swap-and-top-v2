# Listing Types

## Sale, swap, request and auction as one shared model

**Status:** Decided — all four defined now, three built now
**Read this if:** you are building anything at all. This is the structural decision everything else rests on.

---

## Overview

Four kinds of listing, one shared core. Not four parallel systems.

```ascii
SHARED CORE + PER-TYPE DETAIL:

┌──────────────────────────────────────────────────────────┐
│  LISTING  (shared by every type)                         │
│  ─────────────────────────────────────────────────────── │
│  owner · category · location · photos · status           │
│  slug · created / updated / expires                      │
│  moderation state · reports · view and reveal counts     │
│  contact preferences · dealer-offers consent             │
│  search keywords · promotion state                       │
└────────┬─────────────┬──────────────┬────────────────────┘
         │             │              │
    ┌────▼────┐   ┌────▼─────┐   ┌───▼──────┐   ┌──────────┐
    │  SALE   │   │   SWAP   │   │ REQUEST  │   │ AUCTION  │
    │ detail  │   │  detail  │   │  detail  │   │  detail  │
    ├─────────┤   ├──────────┤   ├──────────┤   ├──────────┤
    │ price   │   │ has-item │   │ wanted   │   │ start    │
    │ negoti- │   │ wants-   │   │  spec    │   │ reserve  │
    │  able   │   │  item    │   │ budget   │   │ closes   │
    │         │   │ cash dir │   │ optional │   │ current  │
    │         │   │ cash amt │   │  trade-in│   │  bid     │
    └─────────┘   └──────────┘   └──────────┘   └────┬─────┘
                                                      │
                                                 ┌────▼─────┐
                                                 │   BIDS   │
                                                 │append-only│
                                                 └──────────┘
```

---

## Why this structure

### What the shared core buys

Moderation, reporting, images, search, expiry, view counting, reveal counting and promotion are written **once** and work for every type. A report against an auction uses the same pipeline as a report against a sale. Adding a type does not mean re-implementing any of it.

### What the per-type detail buys

Auction-specific fields do not pollute swap listings. A sale listing has no reserve price and no closing time, and nothing has to pretend otherwise.

### Why one feed query can return all four

Because they share a core with a common shape, the feed reads listings and joins the detail it needs. This is what makes the single mixed feed possible — see [feed-and-filters.md](./feed-and-filters.md).

### Why all four are defined before three are built

The shared shape is cheap to design once and expensive to retrofit. Defining the auction satellite now costs an hour of thinking; discovering later that the core cannot accommodate it costs a migration.

Rejected alternatives:

| Alternative | Why not |
| --- | --- |
| One table with a type flag and nullable columns | Becomes unmanageable as types diverge; every query has to know which columns are meaningless |
| Four independent entities | Duplicates moderation, reporting, images, search and expiry four times |

---

## 1. Sale

The simplest type. Someone owns a thing and wants money for it.

**Detail carried:** price, whether the price is negotiable.

**Who posts these:** private sellers and dealers. A dealer's sale listing renders differently — see [../product/card-system.md](../product/card-system.md) — but the data is the same.

**Photos:** required, 2 to 8.

Detail in [sell.md](./sell.md).

---

## 2. Swap

The signature type. Someone owns a thing, wants a different thing, and cash makes up the difference in one direction or the other.

**Detail carried:**

- **The item they have** — full specifications, photos, condition, defects
- **The item they want** — specification, no photos, since they do not own it
- **Cash direction** — they add, they receive, or straight swap
- **Cash amount**

**Crucially: a swap listing is simultaneously supply and demand.** It appears in the browse feed as a swap, and in the Wanted feed as demand with a trade-in attached. That dual nature is what makes it the platform's most valuable object.

Detail in [swap-and-top.md](./swap-and-top.md).

---

## 3. Request

Someone wants a thing and does not have it yet.

**Detail carried:** what they want as specification, budget, and optionally a trade-in — which effectively makes it swap demand.

**Photos:** none. They do not own the thing.

**Why this is a first-class type rather than a saved search:** it is visible, it is answerable, and it is the object dealers pay to be told about. A saved search is private and produces no lead.

Detail in [wanted-and-leads.md](./wanted-and-leads.md).

---

## 4. Auction — defined, not built

Someone owns a thing and lets a price be discovered by bidding.

**Detail carried:** starting price, reserve, closing time, current high bid, bid count.

**Separate child records:** bids, **append-only**. A bid is never updated or deleted. Auction disputes are resolved by reading history, and an immutable log is the only version of that which survives an angry user.

Specified in [auctions.md](./auctions.md). Deferred per [../product/roadmap.md](../product/roadmap.md).

---

## Status lifecycle

Shared by every type.

```ascii
            ┌─────────┐
            │  DRAFT  │  incomplete, only the owner sees it
            └────┬────┘
                 │ publish
                 ▼
            ┌─────────┐
            │  LIVE   │  public, indexable, in the feed
            └────┬────┘
                 │
      ┌──────────┼──────────┬───────────┐
      ▼          ▼          ▼           ▼
  ┌───────┐ ┌────────┐ ┌─────────┐ ┌─────────┐
  │ SOLD  │ │EXPIRED │ │WITHDRAWN│ │ REMOVED │
  │       │ │30 days │ │by owner │ │by staff │
  └───────┘ └────────┘ └─────────┘ └─────────┘
```

Rules:

- Listings publish straight to **live**. There is no approval queue — see [moderation.md](./moderation.md).
- **Expired** after 30 days, with a nudge to the owner beforehand.
- **Removed** carries a reason and is appealable.
- Only **live** listings appear in the feed, in search, or in the sitemap.
- Nothing is hard-deleted. State changes, records persist — needed for appeals and for honest metrics.

---

## Categories

Every listing has one category, which determines its specification set.

| Category | Specification set |
| --- | --- |
| Phones | Model, storage, RAM, battery health, condition |
| Laptops | Processor, RAM, storage, graphics, screen size, battery health, condition |
| Desktops | Processor, RAM, storage, graphics, form factor, condition |
| Consoles | Model, storage, controllers, condition |
| Parts | Part type, model, capacity or rating, condition |
| Accessories | Type, condition |

Specifications are **structured, stored and normalised**. Anything offered as a filter must genuinely exist on the listing — see [../product/search-and-discovery.md](../product/search-and-discovery.md).

---

## What every listing must carry

Requirements that apply regardless of type, each traceable to a rule or a v1 failure:

| Requirement | Reason |
| --- | --- |
| A readable slug | URLs and search rankings |
| Owner reference | Attribution and ownership checks |
| Contact preferences | Which channels the poster accepts |
| Dealer-offers consent | Whether it may be surfaced as a lead |
| View count and reveal count | The seller's feedback loop and the platform's core metric |
| Promotion state | Whether it currently occupies a sponsored or drop slot |
| Expiry timestamp | Listing decay |
| Moderation state and report references | The report-driven pipeline |

---

## Related documentation

- [Data Model](../architecture/data-model.md) — how this is stored, with relationships and indexing
- [Feed & Filters](./feed-and-filters.md) — how the types share one stream
- [Card System](../product/card-system.md) — how each type renders
- [Post Flow](../product/post-flow.md) — how each type is created
- [Auctions](./auctions.md) — the fourth type in full

---

**Last Updated:** September 2026
