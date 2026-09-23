# Architecture Documentation

## Technical design, and the reasoning behind each choice

This folder explains how the system is built and why each significant technical decision was made. It contains no source code — implementation belongs in the build plan and the repository.

---

## 📋 Contents

- **[system-overview.md](./system-overview.md)** — the whole stack, how the parts talk, and the one rule that must not be broken
- **[data-model.md](./data-model.md)** — entities, relationships, and modelling decisions
- **[auth-and-identity.md](./auth-and-identity.md)** — accounts, phone-anchored identity, roles, and server-side rendering
- **[media-and-images.md](./media-and-images.md)** — upload path, storage, and data cost
- **[background-jobs.md](./background-jobs.md)** — expiry, alerts, scheduled work
- **[seo-and-rendering.md](./seo-and-rendering.md)** — the acquisition channel, in technical terms
- **[deployment-and-hosting.md](./deployment-and-hosting.md)** — environments, cost, operational limits

---

## 🎯 The choices, summarised

| Layer | Choice | Main reason |
| --- | --- | --- |
| **Database** | Relational | Bids need real transactions; the domain is relational; money wants exact types |
| **Auth** | Managed provider, phone and one-time code | Removes a whole bug class; identity must be scarce |
| **API** | REST with a published machine-readable contract | Native clients need generated clients, which rules out TypeScript-only approaches |
| **Web** | Server-rendered framework | Search engines and link previews are the acquisition channel |
| **Native** | Cross-platform, later | Shares types and the API client with web |
| **Images** | Object storage with no egress charges, uploaded directly | Already the right answer in v1; image-heavy marketplace |
| **Email** | One provider | v1 had four email libraries installed |
| **Jobs** | Database-backed durable queue | In-process scheduling loses work on restart and duplicates across instances |
| **Repo** | Monorepo with shared types and validation | One definition of a listing, used by web, native and the API |

Each is argued in full in its own document, with the rejected alternatives.

---

## 🚨 The one rule

> **The API is the system of record. The web app renders and nothing more.**

The temptation with a modern web framework is to put business logic in it because it is convenient. Resist it completely. The moment domain logic lives in the web app, the future native app can only do a subset of what the website does, and the two drift apart permanently.

Every client — the marketplace, the dealer console, staff tools, the eventual mobile app — goes through the same API. Nothing bypasses it.

---

## 🧱 The shape

```ascii
┌────────────────────────────────────────────────────────────────┐
│  CLIENTS                                                       │
│  ┌──────────────────┐ ┌──────────────┐ ┌────────────────────┐ │
│  │ Marketplace web  │ │ Dealer       │ │ Mobile app (later) │ │
│  │ server-rendered  │ │ console      │ │                    │ │
│  └────────┬─────────┘ └──────┬───────┘ └─────────┬──────────┘ │
└───────────┼──────────────────┼───────────────────┼────────────┘
            └──────────────────┼───────────────────┘
                               ▼
┌────────────────────────────────────────────────────────────────┐
│  API — one REST contract, protected by default                 │
│  schema-validated in, typed out, spec generates every client   │
├────────────────────────────────────────────────────────────────┤
│  DOMAIN SERVICES — ownership and authorisation checked here    │
│  Listings │ Search │ Reveals │ Leads │ Moderation │ Billing     │
├────────────────────────────────────────────────────────────────┤
│  RELATIONAL DATABASE                                           │
│  listings + per-type detail · users · reveals · reports · bids  │
└──────┬───────────────┬────────────────┬───────────────┬────────┘
       ▼               ▼                ▼               ▼
  ┌─────────┐   ┌────────────┐   ┌───────────┐   ┌───────────┐
  │ Object  │   │   Email    │   │ Job queue │   │ Analytics │
  │ storage │   │            │   │           │   │           │
  └─────────┘   └────────────┘   └───────────┘   └───────────┘
```

---

## 🧭 Reading order for a build plan

1. [system-overview.md](./system-overview.md) — the shape and the non-negotiables
2. [data-model.md](./data-model.md) — build this first; everything depends on it
3. [auth-and-identity.md](./auth-and-identity.md) — the second foundation
4. [../api/endpoints.md](../api/endpoints.md) — the surface
5. [seo-and-rendering.md](./seo-and-rendering.md) — why the web app is shaped as it is
6. The rest as needed

---

## 🔗 Related documentation

- [Features](../features/) — the behaviour this supports
- [v1 Lessons](../reference/v1-lessons.md) — the specific failures these choices avoid
- [Decisions Log](../reference/decisions-log.md) — every decision with its status

---

**Last Updated:** September 2026
