# Data Model

## Entities, relationships, and modelling decisions

**Status:** Decided
**Read this if:** you are designing the schema. Build this before anything else — everything depends on it.

---

## Overview

A relational model built around one shared listing entity with per-type detail attached. No code here; entities are described as their fields, relationships and constraints.

---

## Why relational, and not a document database

v1 used a document database and then modelled relationships by hand — references everywhere, manual population in every service. That produces the costs of both approaches and the benefits of neither.

Four reasons the choice changes for v2:

| Reason | Detail |
| --- | --- |
| **Bidding needs real transactions** | Two simultaneous bids of the same amount must produce exactly one winner. This needs row-level locking and a database-level constraint that a bid exceeds the current high bid — not an application check that can race. |
| **Money wants an exact type** | Prices, top-up amounts and bids need exact decimal arithmetic, not floating point. |
| **The domain is relational** | Listings belong to users, reports belong to listings and users, appeals belong to actions, bids belong to auctions. This is a graph of relations. |
| **Constraints belong in the database** | A bid must exceed the current high. A listing must have an owner. A swap must have both items. Enforced once, in the database, rather than hopefully in every code path. |

---

## Core entities

### Listing — the shared core

Every listing of every type carries these.

| Field group | Contents |
| --- | --- |
| **Identity** | Identifier, readable slug, type (sale, swap, request, auction) |
| **Ownership** | Owner reference |
| **Classification** | Category, specification values |
| **Description** | Title, free text, condition, defects, accessories |
| **Location** | Area, city, optionally campus |
| **Media** | Ordered image references |
| **State** | Status, published time, expiry time, sold time |
| **Moderation** | Moderation state, report references |
| **Contact** | Accepted channels, dealer-offers consent |
| **Metrics** | View count, reveal count |
| **Promotion** | Promotion state, slot type, promotion expiry |
| **Search** | Normalised keywords |
| **Timestamps** | Created, updated |

**The slug is required, not optional.** It is what makes URLs readable and rankable — see [seo-and-rendering.md](./seo-and-rendering.md). Generated from the title and key specifications plus a short unique suffix, and immutable once published so links never break.

### Per-type detail

| Type | Detail carried |
| --- | --- |
| **Sale** | Price, negotiable flag |
| **Swap** | Reference to the offered item, reference to the wanted item specification, cash direction, cash amount |
| **Request** | Wanted item specification, budget, optional trade-in item reference |
| **Auction** | Starting price, reserve, closing time, current high bid, bid count, extension count |

### Item

A described device. Referenced by listings rather than embedded, because a swap references two of them and a request may reference one as a trade-in.

| Field group | Contents |
| --- | --- |
| **Identity** | Identifier, category |
| **Naming** | Name, brand, model |
| **Specifications** | Per-category structured values — processor, memory, storage, graphics, screen, battery, capacity, form factor |
| **Condition** | Condition rating, defects, accessories |
| **Media** | Image references, where the item is owned |
| **Role** | Whether this item is owned by the poster or merely desired |

**Every specification shown as a filter must exist here and be persisted.** In v1 the processor field was collected in the form, passed to the database layer, and silently discarded because it was commented out of the schema — so the most important laptop specification was thrown away and any filter on it matched nothing. Any field the posting form collects must be stored, or the field should be removed from the form.

**Specifications are normalised on save** so equivalent values filter together.

### User

| Field group | Contents |
| --- | --- |
| **Identity** | Identifier, phone number (the anchor), optional email, display name |
| **Verification** | Phone verified, dealer verified, with timestamps. No occupation or student status is collected or stored. |
| **Reputation** | Confirmed deal count, median reply time, both derived rather than stored raw |
| **Role** | Role, which cascades — see [auth-and-identity.md](./auth-and-identity.md) |
| **Standing** | Account standing, suspension end, violation count, last violation |
| **Profile** | Image, location, campus, joined date, last seen |
| **Preferences** | Notification preferences per category and channel |
| **Dealer** | Shop reference, where applicable |

### Shop

A dealer's public identity and console scope. Name, slug, logo, description, location, hours, verification state, and aggregate trust statistics.

### Reveal event

The platform's most important record.

| Field | Notes |
| --- | --- |
| Listing reference | Which listing |
| Device hash | **Not an identity.** A hash used for rate limiting. |
| Viewer reference | Only if signed in |
| Viewer role | For analysis |
| Slot type at reveal | Organic, sponsored, or drop — this is what makes promotion sellable with evidence |
| Timestamp | |

### Offer

Made against a swap or a request. References the demand listing, the offering user, optionally an offered item, the proposed cash amount, a message, and a state.

**Not binding and not escrowed.** A structured way to start a conversation.

### Deal confirmation

One record per reveal that is followed up. References the reveal event, the listing, both parties, each side's answer with its timestamp, and an overall state.

| Field group | Contents |
| --- | --- |
| **Subject** | Reveal event reference, listing reference |
| **Parties** | Buyer reference, seller reference |
| **Answers** | Buyer answer and time, seller answer and time — each yes, no, not yet, or unanswered |
| **State** | Pending, confirmed, closed, lapsed |
| **Timing** | Prompted at, deferred at, resolved at, lapses at |

**Counted only when both sides answer yes.** A "no" is never shown to the other party and never carries a disciplinary consequence.

The **confirmed deal count** on a user or shop is derived from these records, not stored as a mutable counter — the same reasoning as reveal events. A count can be recomputed and audited; a counter can only be trusted.

See [../features/deal-confirmation.md](../features/deal-confirmation.md).

### Report, disciplinary action, appeal

The moderation chain. Reports reference a target listing or user, a reporter, a reason and free text. Actions reference the report, the issuing moderator, the type, the reason and a duration. Appeals reference the action, the appellant, their statement, the reviewer and the outcome.

Every one of these is attributable and retained. See [../features/moderation.md](../features/moderation.md).

### Bid — future

References the auction and the bidder, with an amount and a timestamp.

**Append-only. Never updated, never deleted.** Auction disputes are settled by reading history.

### Payment

Dealer payments for subscriptions and slots. References the payer, the product, an amount with an **explicit currency**, a state, an external reference, and an event history.

**Currency is always explicit, never inferred.** Zimbabwe runs United States dollars and a local currency side by side, and the local currency has been reset repeatedly — most recently to the ZiG in 2024, whose code is ZWG. Pricing is in United States dollars because that is what people quote, but the currency field is never assumed.

### Payment event

Append-only record of every callback received from the payment provider. Providers send duplicates and out-of-order updates, so the payment state machine reads this log and every write is idempotent on the provider's reference. Getting this wrong means double-charging, which in a trust-based marketplace is fatal.

---

## Relationships

```ascii
     User ──────────┬──────► Listing ──────┬──► SaleDetail
       │            │           │          ├──► SwapDetail ──► Item (has)
       │            │           │          │                └► Item (wants)
       │            │           │          ├──► RequestDetail ──► Item (wanted)
       │            │           │          │                  └► Item (trade-in)
       │            │           │          └──► AuctionDetail ──► Bid (many)
       │            │           │
       │            │           ├──► RevealEvent (many) ──► DealConfirmation
       │            │           ├──► Offer (many)
       │            │           └──► Report (many)
       │            │
       ├──► Shop ───┘  (a dealer's listings belong to their shop)
       │
       ├──► SavedListing (many) ──► Listing
       ├──► Report (as reporter)
       ├──► DisciplinaryAction (many) ──► Appeal
       ├──► Payment (many) ──► PaymentEvent (many)
       └──► NotificationPreference
```

---

## Modelling decisions

### 1. Shared core with per-type satellites

Rejected alternatives and why:

| Alternative | Problem |
| --- | --- |
| One table with a type flag and nullable columns | Unmanageable as types diverge; every query must know which columns are meaningless for which type |
| Four independent entities | Duplicates moderation, reporting, images, search and expiry four times |

The chosen shape means moderation, reports, images, search, expiry and reveals are written once and work for every type, while auction fields never pollute swap listings. It is also what makes a single mixed feed query possible.

### 2. All four types defined now, three built now

Defining the auction satellite costs an hour. Discovering later that the core cannot hold it costs a migration. See [../features/auctions.md](../features/auctions.md).

### 3. Items referenced, not embedded

A swap references two items; a request may reference a trade-in. Embedding would mean duplicating the item shape in several places and would make specification search harder.

### 4. Nothing is hard-deleted

State changes; records persist. Needed for appeals, for honest metrics, and for auction dispute history. Feed and search queries filter on state — they never rely on absence.

### 5. Reveal events are records, not a counter

A counter tells you a number. Events tell you when, by what kind of viewer, and whether the listing was promoted at the time. The last of those is what lets promotion be sold on evidence.

### 6. Device hashes, not identities

Rate limiting needs to recognise a device. It does not need to know who it is. Hashes only, no cross-site tracking.

---

## Indexing

Driven by the actual queries, not added speculatively.

| Query | What it needs |
| --- | --- |
| The feed | Status, type, category, published time |
| Specification search | Composite indexes on category plus the filtered specification fields |
| A listing by slug | Unique index on slug |
| A user's own listings | Owner plus status |
| A dealer's stock | Shop plus status |
| Dealer matching | Category plus specification ranges on live sale listings |
| Report queue | Moderation state plus severity plus age |
| Reveal analytics | Listing plus time; device hash plus time for rate limiting |
| Confirmed deal counts | Seller plus state; buyer plus state for repeat-pair detection |
| Confirmation prompt sweep | State plus prompt time, and state plus lapse time |
| Expiry sweep | Status plus expiry time |

---

## Migration from v1

There is no automated migration path, and none is needed. v1 has no meaningful production data, and the schema changes substantially. Whatever listings exist can be re-entered by hand.

This is one of the few genuine advantages of not having launched.

---

## Related documentation

- [Listing Types](../features/listing-types.md) — the same model from a behaviour angle
- [Auth & Identity](./auth-and-identity.md) — users, roles, verification
- [Search & Discovery](../product/search-and-discovery.md) — what the specification fields must support
- [Contact & Reveals](../product/contact-and-reveals.md) — the reveal event's purpose
- [Deal Confirmation](../features/deal-confirmation.md) — the confirmation record
- [Payments & Invoicing](../operations/payments-and-invoicing.md) — payment state and idempotency
- [v1 Lessons](../reference/v1-lessons.md) — the discarded-field failure

---

**Last Updated:** September 2026
