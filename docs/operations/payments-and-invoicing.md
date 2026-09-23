# Payments & Invoicing

## Collecting from dealers, manually first

**Status:** Decided — manual during validation, automated afterwards
**Read this if:** you are building billing, or working out how money is collected.

---

## Overview

One thing to hold onto throughout: **the only money in this system is our own.**

No funds pass between buyers and sellers. There is no escrow, no held balance, no refund of a third-party sale, and no chargeback on someone else's transaction. This makes billing dramatically simpler than it would be for a transactional marketplace, and it is a deliberate consequence of the contact-broker model.

We are collecting subscription and advertising fees from business customers. That is all.

---

## Phase 1 — manual collection

During validation, and for as long afterwards as it remains workable.

```ascii
Dealer agrees to pay
        │
        ▼
Pays by mobile money to a number
        │
        ▼
Admin marks the payment received in the admin tools
        │
        ▼
Flag set: lead alerts active, or promotion applied
```

### Why manual first

| Reason | Detail |
| --- | --- |
| **Zero engineering** | No integration, no callbacks, no state machine, no reconciliation |
| **Tests the real question** | Whether a dealer will hand over money, which is what matters |
| **Fast to change** | Prices and packages can move weekly while being figured out |
| **Small numbers** | Five to fifteen dealers is a spreadsheet, not a system |

### What is needed to support it

- An admin action to mark a payment received against a dealer and a product
- An admin action to set the promotion flag on a listing
- A record of who paid what, when, for which product and which period
- A reminder when a manually-set period is about to lapse

All three exist as administration endpoints in [../api/endpoints.md](../api/endpoints.md) for exactly this purpose.

**Do not build automated billing before dealers have paid manually.** If nobody pays, the integration was wasted work.

---

## Phase 2 — automated collection

Only once manual collection is proven and the volume makes it tedious.

### Provider

A local payment gateway covering mobile money, bank switch and card. That coverage is what matters — a dealer must be able to pay the way they already pay for everything else.

### Three things that will bite

#### 1. Subscriptions are hard on local rails

Recurring billing is not a first-class feature the way it is on international card processors. This is a second, independent argument against subscription tiers for ordinary users.

**Sell one-time purchases instead:**

| Product | Shape |
| --- | --- |
| Lead alerts | A month purchased at a time, with a reminder before it lapses |
| Sponsored slot | A week per item |
| Drop slot | One slot, one drop |
| Verification | One-off |

No recurring mandates, no failed-renewal handling, no proration. A reminder plus a one-tap repurchase achieves the same commercial result with far less machinery.

#### 2. Callbacks arrive more than once, and out of order

Payment providers send duplicate notifications and sometimes deliver them out of sequence.

**The requirements:**

- An append-only log of every callback received
- A payment state machine that reads that log rather than being mutated directly
- **Idempotency keyed on the provider's own reference**, so the same callback processed twice has the same effect as once
- Signature verification on every callback

Getting this wrong means double-charging a dealer. In a business built on trust with fifteen customers, that is not a bug, it is the end of the relationship.

See [../architecture/background-jobs.md](../architecture/background-jobs.md) — reconciliation runs as a job.

#### 3. Currency must be explicit, always

Zimbabwe operates United States dollars and a local currency side by side, and the local currency has been reset repeatedly — most recently to the ZiG in 2024, whose international code is ZWG.

**Rules:**

- Every amount is stored with an explicit currency code. Never an amount alone.
- Prices are quoted in United States dollars, because that is what people quote.
- Settlement in local currency is recorded at the amount and currency actually received, with the rate used.
- No arithmetic across currencies without an explicit conversion record.

An unstated currency assumption is the kind of thing that is invisible for a year and then very expensive.

---

## Payment states

```ascii
  PENDING ──────► PAID ──────► ACTIVE ──────► LAPSED
     │                             │
     ├──► FAILED                   └──► CANCELLED
     └──► ABANDONED
```

| State | Meaning |
| --- | --- |
| Pending | Purchase created, awaiting confirmation |
| Paid | Funds confirmed |
| Active | The purchased benefit is running |
| Lapsed | The period ended without renewal |
| Failed | The provider reported a failure |
| Abandoned | Never completed, timed out |
| Cancelled | Ended early, by us or the dealer |

Every transition is recorded with its cause. A dealer asking "why did my alerts stop" must get a precise answer.

---

## Invoicing

Matters mainly for business accounts, which need records for tax.

| Requirement | Detail |
| --- | --- |
| Generated per payment | Not per month — purchases are one-off |
| Contains | Business name, registration number, our details, line items, amount, currency, date, reference |
| Delivered | By email, and downloadable from the console |
| Stored | In object storage, retained |
| Numbered | Sequentially, without gaps |

Manual during phase 1 is acceptable — a template filled in and emailed. Automated once payments are.

---

## What is explicitly not built

| Not built | Why |
| --- | --- |
| Escrow or held balances | Contact-broker model; a different business entirely |
| Buyer-side payments | No transactions pass through the platform |
| Success fees | Uncollectible — we cannot observe whether a sale happened |
| Refunds of third-party sales | Not our transaction |
| Multi-currency wallets | Far beyond need |
| Consumer subscriptions | Recurring billing on local rails, for people who will not pay anyway |

---

## Revenue recognition, kept simple

A purchase covers a period. Recognise it across that period rather than all at once, so monthly revenue reflects service delivered. With fifteen dealers this is a spreadsheet column; the point is to start with the habit so the numbers stay meaningful as it grows.

---

## Definition of done — phase 1

- [ ] Admin action to record a payment against a dealer, product and period
- [ ] Admin action to set a promotion flag on a listing
- [ ] Payment records with explicit currency
- [ ] Reminder before a manually-set period lapses
- [ ] Invoice template, filled and emailed by hand

## Definition of done — phase 2

- [ ] One-time purchases only, no recurring mandates
- [ ] Signature-verified callbacks
- [ ] Append-only callback log
- [ ] Idempotent state machine keyed on the provider reference
- [ ] Explicit currency on every amount, with conversion recorded where it happens
- [ ] Automated invoice generation, sequentially numbered
- [ ] Reconciliation as a durable, retried job

---

## Related documentation

- [Monetization](../business/monetization.md) — what is sold and at what price
- [Validation Test](./validation-test.md) — why manual comes first
- [Data Model](../architecture/data-model.md) — payment and payment event entities
- [Background Jobs](../architecture/background-jobs.md) — reconciliation
- [API Endpoints](../api/endpoints.md) — the billing and administration surfaces
- [Dealer Console](../product/dealer-console.md) — where dealers see and buy

---

**Last Updated:** September 2026
