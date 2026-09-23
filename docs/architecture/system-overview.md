# System Overview

## The whole stack, how the parts talk, and the one rule that must not be broken

**Status:** Decided
**Read this if:** you are about to write the build plan. This is the highest-level technical document.

---

## Overview

One API, several clients, a relational database, and a small number of supporting services. Deliberately conventional — there is no novel infrastructure in this design, because the difficulty in this project is commercial rather than technical.

---

## The non-negotiable rule

> **The API is the system of record. The web app renders and nothing more.**

### Why this needs stating so firmly

Modern web frameworks make it easy and pleasant to put logic directly in the web layer. It starts with one convenient shortcut, then another, and within a year the domain rules live in two places.

The consequence is specific and severe: **the future native app can only do a subset of what the website does.** Feature parity becomes a permanent project, and every new capability has to be built twice or refactored first.

### What this means in practice

| Belongs in the API | Belongs in the web app |
| --- | --- |
| Creating, editing, expiring listings | Rendering pages |
| Matching demand to stock | Caching and revalidation |
| Authorisation and ownership checks | Session cookie handling |
| Reveal recording and rate limiting | Form presentation and client-side validation feedback |
| Moderation decisions and discipline | Navigation and layout |
| Billing state | Nothing else |

The web app may hold a thin data-fetching layer for its own convenience. It may not hold a rule.

---

## Components

### Clients

| Client | Rendering | Audience |
| --- | --- | --- |
| **Marketplace web** | Server-rendered for public pages, client-rendered for account pages | Guests, students, private sellers |
| **Dealer console** | Client-rendered | Dealers |
| **Staff tools** | Client-rendered | Moderators, admins |
| **Mobile app** | Native, later | Everyone, once there is inventory |

All four use the same API. The mobile app is deferred but its existence is why the API contract is shaped as it is.

### API

REST, with a published machine-readable contract generated from the same schema definitions used for validation.

**Why REST and not a TypeScript-only approach:** a TypeScript-to-TypeScript layer gives excellent ergonomics for a web-only product and produces no usable contract for a Swift or Kotlin client. Choosing it would mean trading away the native path that is explicitly wanted. A published contract generates typed clients for every language.

**Two structural requirements**, both from specific v1 failures:

1. **Protected by default.** Every endpoint requires authentication unless explicitly listed as public. In v1, listings could be edited and deleted by unauthenticated callers because middleware was forgotten on some routes. Inverting the default makes that impossible to introduce by omission.
2. **Ownership checked in the service layer.** Not only at the route. A service function that mutates a listing takes the acting user and refuses to act for the wrong one.

### Domain services

Where the rules live. Listings, search, reveals, leads, moderation, billing, notifications.

### Database

Relational. The reasoning is in [data-model.md](./data-model.md); briefly:

- Bids need real transactions and database-level constraints
- Money wants an exact numeric type
- The domain is genuinely relational — v1 used a document database and then modelled relations by hand, getting the costs of both and the benefits of neither

### Supporting services

| Service | Purpose | Note |
| --- | --- | --- |
| **Object storage** | Listing and profile images | No egress charges. Already correct in v1 — keep it. |
| **Email** | Verification, receipts, invoices, moderation outcomes | One provider. v1 had four email libraries installed. |
| **Job queue** | Expiry, alerts, digests, scheduled publishing | Database-backed and durable |
| **Analytics** | Reveals, views, retention | Must support returning-visitor analysis |
| **Payments** | Dealer subscriptions and slots | Manual first; automated later |

---

## Request paths

### A guest browsing

```ascii
Guest → Web app (server-rendered) → API → Database
                    │
                    └─ cached page, revalidated when listings change
```

The first page of the feed and every listing page are rendered on the server so search engines and link scrapers see real content. No authentication is involved, which means the entire search-engine benefit is delivered without solving authenticated server-side rendering — deliberately keeping the hardest problem off the critical path.

### A signed-in user posting

```ascii
User → Web app (client-rendered) → API → Database
                                    │
                                    ├─ image uploaded directly to object storage
                                    └─ listing published → cache revalidation triggered
```

### A dealer receiving a lead

```ascii
New demand posted → API → Database
                            │
                            └─ job queued: find matching dealers
                                            │
                                            └─ alerts sent (in-app, WhatsApp)
```

Matching and sending happen in the background. A notification failure must never fail the posting.

---

## Cache invalidation

The one piece of genuine coupling in the design, and the piece most often forgotten.

Public pages are cached and served statically for speed and cost. But listings change state constantly — published, price-dropped, sold, expired, removed. Each of those must invalidate the affected cached pages.

```ascii
Listing state changes
        │
        ▼
API emits a revalidation signal
        │
        ▼
Web app clears: the listing page, the feed,
                affected category pages, the sitemap
```

**Design this in from the start.** Retrofitting it produces exactly the failure it is meant to prevent: a sold listing still ranking in Google and still shown in the feed.

---

## Monorepo

One repository with shared packages.

| Package | Contents |
| --- | --- |
| **api** | The API service and domain logic |
| **web** | The marketplace and console front end |
| **mobile** | Later |
| **shared** | Type definitions, validation schemas, the generated API client |

**Why:** a listing is defined once. Validation rules are written once and used by the API, the web forms and eventually the app. It also makes the "API is the system of record" rule easier to hold, because the shared package is obviously not a place for domain logic.

---

## What is deliberately simple

Worth stating, because the temptation to over-engineer is real:

- **No microservices.** One API service.
- **No event bus.** A job queue is enough.
- **No search engine service.** Database queries with good indexing handle this scale. Revisit only if measurement says otherwise.
- **No caching layer of its own.** Page-level caching plus database indexing.
- **No custom analytics.** Use a hosted product.

The scale here is a city-sized marketplace. The correct architecture is a well-built conventional one.

---

## Environments

| Environment | Purpose |
| --- | --- |
| **Local** | Development |
| **Staging** | Pre-release verification, with its own database |
| **Production** | Live |

Configuration by environment, secrets never committed. v1 got this right and it should carry over unchanged.

---

## Related documentation

- [Data Model](./data-model.md) — build this first
- [Auth & Identity](./auth-and-identity.md) — the second foundation
- [SEO & Rendering](./seo-and-rendering.md) — why public pages are server-rendered
- [Background Jobs](./background-jobs.md) — the queue
- [API Endpoints](../api/endpoints.md) — the surface
- [v1 Lessons](../reference/v1-lessons.md) — the failures behind the two structural requirements

---

**Last Updated:** September 2026
