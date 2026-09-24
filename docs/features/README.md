# Features Documentation

## Behaviour specifications, one per feature area

This folder says what each feature does, in enough detail to build from. [../product/](../product/) covers how things look and the rules they obey; this folder covers how they behave.

---

## 📋 Contents

### Foundation

- **[listing-types.md](./listing-types.md)** — sale, swap, request and auction as one shared model. **Read this first** — everything else depends on it.

### Core features

- **[feed-and-filters.md](./feed-and-filters.md)** — the single mixed feed, its composition and ordering rules
- **[swap-and-top.md](./swap-and-top.md)** — the signature feature in detail
- **[sell.md](./sell.md)** — straightforward sale listings
- **[wanted-and-leads.md](./wanted-and-leads.md)** — requests, matching, and the dealer lead product

### Protective and supporting

- **[deal-confirmation.md](./deal-confirmation.md)** — mutual confirmation that a deal completed; the trust signal and the only view of settlement
- **[moderation.md](./moderation.md)** — reporting, takedowns, discipline and appeals
- **[notifications.md](./notifications.md)** — lead alerts, drop announcements, listing lifecycle

### Deferred

- **[auctions.md](./auctions.md)** — specified so nothing blocks it later, not being built now

---

## 🎯 How the features relate

```ascii
                    ┌──────────────────┐
                    │     LISTING      │
                    │  shared core:    │
                    │  owner, photos,  │
                    │  location,       │
                    │  moderation,     │
                    │  reports, search │
                    └────────┬─────────┘
                             │
        ┌──────────┬─────────┼─────────┬──────────┐
        ▼          ▼         ▼         ▼          ▼
   ┌────────┐ ┌────────┐ ┌───────┐ ┌────────┐ ┌────────┐
   │  SALE  │ │  SWAP  │ │REQUEST│ │AUCTION │ │  ...   │
   │        │ │        │ │       │ │(later) │ │        │
   └────┬───┘ └───┬────┘ └───┬───┘ └────────┘ └────────┘
        │         │          │
        │         └────┬─────┘
        │              ▼
        │      ┌───────────────┐
        │      │ DEALER LEADS  │  ← swaps and requests are
        │      │ (the revenue) │     both structured demand
        │      └───────────────┘
        ▼
   ┌───────────────┐
   │  THE FEED     │  ← all types, one stream
   └───────────────┘
```

The important structural point: **moderation, reporting, images, search and expiry attach to the shared listing**, so they work identically for every type and require no per-type work.

---

## 🧭 The revenue path through the features

1. A user posts a **swap** or a **request** → [swap-and-top.md](./swap-and-top.md), [wanted-and-leads.md](./wanted-and-leads.md)
2. That post is structured demand → it becomes a **lead**
3. Matching dealers are **alerted** → [notifications.md](./notifications.md)
4. Dealers pay for the alert and for **promotion** in the feed → [feed-and-filters.md](./feed-and-filters.md)

Every feature in this folder either produces leads, protects the platform, or makes the feed worth returning to.

---

## 🔗 Related documentation

- [Product Principles](../product/principles.md) — the rules all of this obeys
- [Data Model](../architecture/data-model.md) — how the shared listing is stored
- [API Endpoints](../api/endpoints.md) — the surface these features expose
- [Roadmap](../product/roadmap.md) — what ships when

---

**Last Updated:** September 2026
