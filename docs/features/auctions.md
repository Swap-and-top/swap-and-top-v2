# Auctions

## Specified so nothing blocks it later — not being built now

**Status:** Future — deferred deliberately
**Read this if:** you are designing the data model or the roadmap. Do not build this yet.

---

## Why this document exists

Auctions are deferred, not cancelled. The reason for writing the specification now is that the **shared listing model must be able to accommodate it without a migration.** Defining the auction satellite costs an hour of thinking. Discovering later that the core cannot hold it costs a rebuild.

Nothing here should be implemented in the first release.

---

## Why auctions are deferred

### They need a crowd, and a crowd is what we do not have

An auction that closes with zero bids is a public announcement that nobody is here. At low traffic, auctions actively damage the platform rather than enlivening it. They are a feature *for* liquidity, not a way *to* liquidity.

### But the observation behind wanting them is correct

People do visit local auction sites habitually, just to scroll for deals. That habit is driven by **time**: auctions end, so there is a reason to check at a particular moment. That insight is right and it is being used — just without the auction mechanics.

### The Friday Drop is the bridge

```ascii
THE SEQUENCE:

  Friday Drop            →    Habit forms          →    Auctions
  ─────────────               ──────────────            ─────────
  curated deals               people reliably           now there are
  published together          arrive at 7pm             bidders
  at a set time               on Fridays                
  
  works at LOW traffic        builds the audience       needs the audience
```

**The drop builds the audience auctions need.** Once people show up at a known time, turning the drop into an auction is natural, and the bidders are already there. Detail in [../business/go-to-market.md](../business/go-to-market.md).

---

## The model when it happens

### Auction detail, attached to the shared listing

| Field | Notes |
| --- | --- |
| Starting price | Required |
| Reserve price | Optional, hidden from bidders |
| Closing time | Required |
| Current high bid | Derived from the bid records |
| Bid count | Derived |
| Extension count | How many times anti-sniping has extended it |

### Bids — append-only, always

A bid is **never updated and never deleted.** Auction disputes are resolved by reading history, and an immutable log is the only version of that which survives an angry user.

Each bid records: which auction, which bidder, the amount, and the exact time.

---

## Rules that must be right from the first version

### 1. Account required to bid

Not optional. The entire integrity model rests on being able to hold a bidder accountable, and you cannot suspend an anonymous bidder.

### 2. Identity must be scarce

If a suspended bidder registers again in thirty seconds with a fresh email, accountability is theatre. Phone-anchored identity is what makes suspension cost something. See [../product/trust-and-safety.md](../product/trust-and-safety.md).

### 3. Paid listing fee

Auctions carry genuine marginal cost — live updates, scheduled closing, dispute handling. A listing fee also filters non-serious sellers, which matters enormously for auction quality.

**Flat fee only.** Since the platform is a contact broker and cannot observe whether a sale completed, a success fee would be uncollectible. See [../business/monetization.md](../business/monetization.md).

### 4. Anti-sniping extension

A bid placed inside the final two minutes extends the close by two minutes.

Ten lines of logic. Retrofitting it after users have learned to snipe is a fight nobody wants, so it goes in the first version.

### 5. Reliable scheduled close

An auction must close at its stated time even if nothing happens to be running. This requires **durable scheduled work** — a job that survives a restart and does not fire twice if two instances are running.

The v1 approach — an in-process scheduler — cannot do this. Restart the process and pending jobs vanish; run two copies and everything happens twice. See [../architecture/background-jobs.md](../architecture/background-jobs.md).

### 6. Strict correctness on concurrent bids

Two people bidding the same amount at the same moment must produce exactly one winner. This needs real transactional guarantees and a database-level constraint that a bid must exceed the current high bid — not an application-level check that can race.

This is one of the main reasons v2 moves to a relational database. See [../architecture/data-model.md](../architecture/data-model.md).

### 7. Contact-brokered settlement

No escrow, no payment capture, no platform-held funds. The winner gets the seller's contact details and they settle it themselves, exactly like every other listing type.

**Non-payment is handled by discipline, not by holding money.** A winner who does not pay gets reported, warned, and eventually suspended. This is precisely what the discipline pipeline exists for. See [../features/moderation.md](./moderation.md).

---

## Live updates

Bidding without live updates is broken. Watchers must see the current price change without reloading.

Two viable approaches when the time comes — a database-backed realtime subscription, or a single-threaded per-auction process holding the connections. The second is a strong fit because it also gives strong consistency and built-in timers, but it is more machinery than the first release of auctions needs.

Recorded as a decision to make later, not now. See [../reference/decisions-log.md](../reference/decisions-log.md).

---

## Presentation

The auction card reuses the sale card with two additions: a **current bid** replacing the price, and a **countdown**. The detail screen adds a bid panel and the bid history.

Nothing in the existing card system blocks this. See [../product/card-system.md](../product/card-system.md).

---

## What has to be true before building this

A checklist, not a date:

- [ ] The Friday Drop runs weekly with a reliable audience
- [ ] Return visits are measurably clustered around drop time
- [ ] Phone-anchored identity is live and suspensions actually stick
- [ ] Durable scheduled jobs are in place and proven
- [ ] The database provides real transactional guarantees
- [ ] There is enough traffic that a typical auction would attract several bidders

If the last point is not true, do not build it. An empty auction is worse than no auction.

---

## Related documentation

- [Listing Types](./listing-types.md) — where the auction satellite attaches
- [Roadmap](../product/roadmap.md) — when this is revisited
- [Go To Market](../business/go-to-market.md) — the drop that precedes it
- [Background Jobs](../architecture/background-jobs.md) — durable scheduled close
- [Data Model](../architecture/data-model.md) — transactional requirements
- [Moderation](./moderation.md) — non-payment handling

---

**Last Updated:** September 2026
