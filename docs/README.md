# Swap & Top v2 Documentation

> **Complete pre-build specification for the Swap & Top gadget trading marketplace — Zimbabwe**

**Status:** Living document · pre-build
**Purpose:** give a human or an AI agent everything needed to produce a build plan, then build the system, without re-deriving any decisions.

---

## 🚦 Start here

**New to the project?** Read [00-SUMMARY.md](./00-SUMMARY.md) first. It is the whole thing in plain language with no jargon and no code.

**Writing the build plan?** Read in this order, then see [How to turn these docs into a plan](#-how-to-turn-these-docs-into-a-plan) at the bottom.

1. [00-SUMMARY.md](./00-SUMMARY.md)
2. [business/the-wedge.md](./business/the-wedge.md) — why this exists and what it beats
3. [product/principles.md](./product/principles.md) — the rules every screen obeys
4. [features/listing-types.md](./features/listing-types.md) — the core data idea
5. [architecture/system-overview.md](./architecture/system-overview.md) — the technical shape
6. [reference/decisions-log.md](./reference/decisions-log.md) — every decision with its reason
7. [operations/validation-test.md](./operations/validation-test.md) — what must be proven before the full build

---

## 📋 Documentation Structure

### 💼 [Business](./business/)

Why the platform exists, who pays, and how it reaches people.

- **[The Wedge](./business/the-wedge.md)** — the problem, the competition, and what Facebook structurally cannot do
- **[Target Users](./business/target-users.md)** — buyers, private sellers, students, dealers
- **[Monetization](./business/monetization.md)** — what is free, what is paid, and when each product starts earning
- **[Go To Market](./business/go-to-market.md)** — campus-first, dealers in parallel, the weekly drop
- **[Company Structure](./business/company-structure.md)** — holding company, sister company, and the operator gap

### 🎨 [Product](./product/)

How the thing behaves and looks, independent of technology.

- **[Principles](./product/principles.md)** — non-negotiable product and design rules
- **[Information Architecture](./product/information-architecture.md)** — surfaces, navigation, screen inventory
- **[Card System](./product/card-system.md)** — the four listing cards and what distinguishes them
- **[Search & Discovery](./product/search-and-discovery.md)** — the hero feature: specification-aware search
- **[Post Flow](./product/post-flow.md)** — one posting flow with three outcomes
- **[Contact & Reveals](./product/contact-and-reveals.md)** — how people reach each other, and the metric it produces
- **[Dealer Console](./product/dealer-console.md)** — the business-facing surface
- **[Trust & Safety](./product/trust-and-safety.md)** — verification, stolen devices, safe meeting
- **[Roadmap](./product/roadmap.md)** — sequence, and what is deliberately deferred

### 🧩 [Features](./features/)

Behaviour specifications, one per feature area.

- **[Listing Types](./features/listing-types.md)** — sale, swap, request, auction as one shared model
- **[Feed & Filters](./features/feed-and-filters.md)** — the single mixed feed and how it is composed
- **[Swap & Top](./features/swap-and-top.md)** — the signature feature in detail
- **[Sell](./features/sell.md)** — straightforward sale listings
- **[Wanted & Leads](./features/wanted-and-leads.md)** — requests, matching, and the dealer lead product
- **[Moderation](./features/moderation.md)** — auto-approve, reports, takedowns, discipline
- **[Notifications](./features/notifications.md)** — alerts, lead pushes, drop announcements
- **[Auctions](./features/auctions.md)** — deferred, but specified so nothing blocks it later

### 🏛️ [Architecture](./architecture/)

Technical design and the reasoning behind each choice.

- **[System Overview](./architecture/system-overview.md)** — the whole stack and how parts talk
- **[Data Model](./architecture/data-model.md)** — entities, relationships, and modelling decisions
- **[Auth & Identity](./architecture/auth-and-identity.md)** — accounts, phone-as-identity, roles, server-side rendering
- **[Media & Images](./architecture/media-and-images.md)** — upload path, storage, data cost
- **[Background Jobs](./architecture/background-jobs.md)** — expiry, alerts, scheduled work
- **[SEO & Rendering](./architecture/seo-and-rendering.md)** — the acquisition channel, in technical terms
- **[Deployment & Hosting](./architecture/deployment-and-hosting.md)** — environments, cost, operational limits

### 🔌 [API](./api/)

The contract between every client and the system.

- **[Endpoints](./api/endpoints.md)** — every endpoint by area, with purpose, access level and behaviour

### 🛠️ [Operations](./operations/)

Running the thing once it exists.

- **[Validation Test](./operations/validation-test.md)** — the six-week dealer test, with pass and fail criteria
- **[Metrics](./operations/metrics.md)** — what gets measured, why, and what good looks like
- **[Payments & Invoicing](./operations/payments-and-invoicing.md)** — collecting from dealers, manually first

### 📚 [Reference](./reference/)

- **[v1 Lessons](./reference/v1-lessons.md)** — what the first version got wrong, and the rule each failure produced
- **[Decisions Log](./reference/decisions-log.md)** — every decision, its reasoning, and its status
- **[Glossary](./reference/glossary.md)** — shared vocabulary

---

## 🖼️ Wireframes

Interactive mobile-first wireframes for every screen described here, including the dealer console in both mobile and desktop layouts:

**https://claude.ai/artifact/JhU2rAynKjdh3n4CjcnFwz**

Private to the owner's account. It has to be shared from the page's Share menu before anyone else can open it. The screen inventory in [product/information-architecture.md](./product/information-architecture.md) matches it frame for frame.

---

## 🧱 System Shape

```ascii
SWAP & TOP v2 ARCHITECTURE:
┌──────────────────────────────────────────────────────────────────────┐
│  CLIENTS                                                             │
│  Marketplace (web, server-rendered)  │  Dealer console  │  Mobile app │
│                                      │                  │  (later)    │
├──────────────────────────────────────────────────────────────────────┤
│  API — one REST contract, published as a machine-readable spec        │
│  Every client, web or native, uses this. Nothing bypasses it.         │
├──────────────────────────────────────────────────────────────────────┤
│  DOMAIN SERVICES                                                     │
│  Listings │ Search │ Reveals │ Leads │ Moderation │ Billing │ Alerts  │
├──────────────────────────────────────────────────────────────────────┤
│  DATA                                                                │
│  Relational database (listings, users, bids, reveals, payments)       │
├──────────────────────────────────────────────────────────────────────┤
│  SUPPORTING SERVICES                                                 │
│  Object storage (images) │ Email │ Job queue │ Analytics │ Payments   │
└──────────────────────────────────────────────────────────────────────┘
```

The important rule: **the API is the system of record.** The web app renders and nothing more. See [architecture/system-overview.md](./architecture/system-overview.md) for why this is non-negotiable.

---

## 👤 Roles at a glance

```ascii
ACCESS LEVELS:
┌──────────────────┐
│   SUPER ADMIN    │  platform owner, everything
├──────────────────┤
│      ADMIN       │  full management, moderation, billing
├──────────────────┤
│    MODERATOR     │  content review, reports, discipline
├──────────────────┤
│      DEALER      │  own shopfront, stock, leads, promotion
├──────────────────┤
│       USER       │  post, swap, request, save, reveal
├──────────────────┤
│      GUEST       │  browse, search, reveal — no account
└──────────────────┘
```

Higher roles include everything below them. This was broken in v1 and is called out in [reference/v1-lessons.md](./reference/v1-lessons.md).

---

## 🗂️ Document conventions

Every document in this set follows the same shape so both people and agents can navigate predictably.

| Element | Meaning |
| --- | --- |
| `# Title` then `## one-line purpose` | what this document covers |
| **Status: Decided** | settled; build to this |
| **Status: Draft** | direction agreed, detail still moving |
| **Status: Future** | specified so it does not block anything, not being built now |
| **Status: Open question** | genuinely undecided; needs a human answer |
| **Read this if:** | who the document is for |
| `## Related documentation` | cross-links at the end of each file |
| ASCII diagrams | flows and hierarchies |

**No code anywhere in this set.** Schemas are described as fields and relationships, not as source. Implementation choices are named and justified, never written out. That is the build plan's job.

---

## 🎯 How to turn these docs into a plan

The build plan should come out of these documents in this order:

1. **Fix the scope.** [product/roadmap.md](./product/roadmap.md) says what is in the first release and what is deferred. Do not widen it.
2. **Take the data model first.** [architecture/data-model.md](./architecture/data-model.md) and [features/listing-types.md](./features/listing-types.md) describe one shared listing with per-type detail. Defining all four types up front is cheap; retrofitting is expensive — even though only three ship.
3. **Derive the API from the features.** Each document in [features/](./features/) states the behaviour; [api/endpoints.md](./api/endpoints.md) states the surface. Every endpoint is protected unless it is explicitly listed as public.
4. **Build the screens from the wireframes.** The frame names in [product/information-architecture.md](./product/information-architecture.md) map one-to-one onto the wireframe canvas.
5. **Treat the metrics as features.** [operations/metrics.md](./operations/metrics.md) lists what must be counted. Reveal tracking and analytics are not a later addition; without them the validation test cannot run.
6. **Read the lessons.** [reference/v1-lessons.md](./reference/v1-lessons.md) is a list of specific, verified failures from v1. Each one produced a rule. A plan that does not honour those rules will reproduce them.

### What the plan must not assume

- That the full rewrite starts immediately. [operations/validation-test.md](./operations/validation-test.md) comes first, on the existing app.
- That auctions, payments between users, delivery or a native app are in scope.
- That a Zimbabwe operator exists. That is an open question tracked in [business/company-structure.md](./business/company-structure.md).

---

## 📞 Open questions needing a human

These cannot be resolved from the documents and block specific decisions. Tracked in full in [reference/decisions-log.md](./reference/decisions-log.md).

| Question | Blocks |
| --- | --- |
| Exact relocation date | how much of the validation test fits in Zimbabwe |
| Who operates Zimbabwe after relocation | whether Swap & Top continues at all |
| Will dealers pay, and for which product | whether the rewrite is justified |
| First campus confirmed as University of Zimbabwe | seeding plan and verification design |

---

**Last Updated:** September 2026
**Documentation Version:** 2.0
**Platform Version:** v2 — pre-build specification
**Supersedes:** the v1 documentation set in `central-docs/`
