# Background Jobs

## Expiry, alerts, and scheduled work

**Status:** Decided
**Read this if:** you are building anything that happens on a timer or outside a request.

---

## Overview

A number of things must happen reliably without anyone being present: listings expire, lead alerts go out, digests are sent, drops publish, and eventually auctions close.

The requirement is **durability**. A job must survive a process restart, must not run twice if two instances are running, and must be retried if it fails.

---

## Why the v1 approach cannot work

v1 used an in-process scheduler for a recurring user-deletion task. That approach has two fatal properties:

1. **Restart the process and pending work vanishes.** Nothing is stored anywhere, so nothing can be recovered.
2. **Run two instances and everything happens twice.** Each copy has its own timers and neither knows about the other.

For deleting stale user records, the consequences are recoverable. For closing an auction at a stated time, or charging a dealer, they are not.

---

## The approach

**A durable queue backed by the database.**

| Property | Why it matters |
| --- | --- |
| Jobs are stored as rows | They survive restarts |
| Work is claimed atomically | No duplicate execution across instances |
| Retries with backoff | Transient failures recover on their own |
| Scheduled and recurring jobs | Both patterns needed |
| No extra infrastructure | Uses the database that already exists |

Using the existing database rather than a separate queue service is deliberate: one less service to operate, one less thing to pay for, and one less thing to go wrong. The scale here does not justify a dedicated queue.

---

## The jobs

### Recurring

| Job | Frequency | What it does |
| --- | --- | --- |
| **Expiry sweep** | Hourly | Moves listings past 30 days to expired; clears them from feed, search and sitemap |
| **Expiry nudge** | Daily | Asks owners of listings expiring in three days whether they are still available |
| **Reveal digest** | Weekly | Sends sellers with activity their reveal summary |
| **Orphan sweep** | Daily | Removes uploaded images belonging to abandoned drafts |
| **Queue threshold check** | Hourly | Alerts staff when the report queue exceeds a threshold |
| **Subscription renewal check** | Daily | Flags dealer subscriptions expiring within three days |
| **Trust statistic refresh** | Daily | Recomputes shop reply times and stock counts |

### Triggered

| Job | Trigger | What it does |
| --- | --- | --- |
| **Dealer matching** | New request or swap published | Finds dealers whose stock matches, respecting consent, and queues alerts |
| **Lead alert delivery** | Matching complete | Sends in-app and WhatsApp alerts |
| **Cache revalidation** | Listing state change | Signals the web app to clear affected pages |
| **Price drop notification** | Price reduced | Notifies everyone who saved the listing |
| **Moderation notification** | Disciplinary action | Sends the outcome with reason and appeal route |
| **Payment reconciliation** | Provider callback received | Advances the payment state machine idempotently |
| **Search keyword rebuild** | Listing created or edited | Normalises specifications into searchable keywords |

### Scheduled — future

| Job | What it does |
| --- | --- |
| **Drop publish** | Publishes the week's drop listings together at the appointed time |
| **Auction close** | Closes an auction at its stated time, determines the winner, notifies both parties |

The auction close is the job with the least tolerance for failure, which is the main reason durability is settled now rather than when auctions are built. See [../features/auctions.md](../features/auctions.md).

---

## Rules

### 1. Never send inline

A notification is queued, never sent during the request that triggered it. A messaging provider being slow or down must not make posting a listing fail.

```ascii
WRONG                          RIGHT
─────                          ─────
publish listing                publish listing
  → send alerts                  → queue a matching job
  → wait                         → respond immediately
  → respond (or fail)                    │
                                         └─► matching job
                                               └─► queue alert jobs
                                                     └─► send, retry on failure
```

### 2. Idempotent

Every job may run more than once — a retry after a timeout, a duplicate provider callback. Running twice must produce the same result as running once. This matters most for payments, where the consequence of getting it wrong is charging a dealer twice.

### 3. Recorded

What ran, when, whether it succeeded, and what it did. Needed for debugging "I never got told", and for appeals.

### 4. Bounded

A retry limit, and a dead-letter state for jobs that keep failing, with staff notification. A job retrying forever is worse than one that fails loudly.

### 5. Observable

Queue depth and failure counts visible somewhere a human will actually look. A silently growing queue is how a platform stops working without anyone noticing.

---

## Cache revalidation deserves attention

The coupling most often forgotten, and the one whose failure is most visible to the outside world.

Public pages are cached for speed and cost. Listings change constantly. Every state change must invalidate the pages that show it:

| Change | Invalidates |
| --- | --- |
| Listing published | Feed, category pages, sitemap |
| Price changed | The listing page, feed, category pages |
| Sold, expired, withdrawn, removed | The listing page, feed, category pages, sitemap |
| Shop profile edited | Shopfront, the shop's listing pages |

Get this wrong and a sold listing keeps ranking in Google and keeps appearing in the feed — which is exactly the staleness problem the 30-day expiry exists to prevent. See [seo-and-rendering.md](./seo-and-rendering.md).

---

## Definition of done

- [ ] Durable database-backed queue, surviving restart, safe across instances
- [ ] Every recurring job scheduled and observable
- [ ] Every triggered job queued rather than run inline
- [ ] All jobs idempotent, especially payment reconciliation
- [ ] Retries with backoff, a bounded limit, and a dead-letter state with staff notification
- [ ] Execution recorded
- [ ] Queue depth and failure counts visible
- [ ] Cache revalidation wired to every listing state change

---

## Related documentation

- [System Overview](./system-overview.md) — where the queue sits
- [Notifications](../features/notifications.md) — what gets sent
- [Wanted & Leads](../features/wanted-and-leads.md) — the matching job
- [SEO & Rendering](./seo-and-rendering.md) — why revalidation matters
- [Payments & Invoicing](../operations/payments-and-invoicing.md) — idempotent reconciliation
- [Auctions](../features/auctions.md) — the close job

---

**Last Updated:** September 2026
