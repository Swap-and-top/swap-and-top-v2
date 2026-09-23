# Information Architecture

## Surfaces, navigation and the complete screen inventory

**Status:** Decided
**Read this if:** you are building screens, or mapping the wireframes to routes.

---

## Overview

Two surfaces, one API. The marketplace is for guests, students and private sellers. The dealer console is for dealers. They look and feel different on purpose — one is a browsing experience, the other is a working tool.

```ascii
SURFACE SPLIT:
┌────────────────────────────┬──────────────────────────────┐
│       MARKETPLACE          │      DEALER CONSOLE          │
├────────────────────────────┼──────────────────────────────┤
│ Guests, students, sellers   │ Dealers                      │
│ Mobile, scrollable, social  │ Mobile first; desktop for    │
│ Server-rendered for SEO     │ bulk work. No SEO needed.    │
│ Owned by Swap & Top         │ Also a Greta Works Digital   │
│                            │ product                      │
└────────────────────────────┴──────────────────────────────┘
```

---

## Marketplace navigation

Five items, bottom bar, thumb-reachable.

```ascii
┌──────────────────────────────────────────────┐
│                                              │
│                 content                      │
│                                              │
├────────┬────────┬────────┬────────┬──────────┤
│ Browse │ Wanted │  POST  │ Saved  │    Me    │
│        │        │  (+)   │        │          │
└────────┴────────┴────────┴────────┴──────────┘
                    ▲
            centre action button,
            accent colour, always available
```

| Item | Purpose |
| --- | --- |
| **Browse** | The mixed feed. The default landing surface. |
| **Wanted** | Requests and swap demand. Where dealers hunt and buyers post what they want. |
| **Post** | Centre action. Opens the three-way posting flow. |
| **Saved** | Watchlist, with availability state and price-drop flags. |
| **Me** | Own listings, requests, verification, safety guidance, settings, and the switch into the dealer console. |

**Why Wanted gets a top-level slot:** it is the dealer product and the platform's structural difference from Facebook. Burying it inside search would hide the thing that makes the business work.

---

## Screen inventory

Each row maps to a frame on the wireframe canvas. Names match exactly.

### Marketplace — 390px

| Screen | Wireframe frame | Purpose | Auth |
| --- | --- | --- | --- |
| Browse feed | `Main` | Mixed feed, category and type chips, infinite scroll | Guest |
| Search and filters | `Search` | Full-screen specification filters per category | Guest |
| Wanted feed | `Wanted` | Requests and swap demand, with "I have this" actions | Guest |
| Listing detail — dealer sale | `DetailDealer` | Photos, price, spec table, shop row, reveal, trade-in prompt | Guest |
| Listing detail — swap | `DetailSwap` | The have-⇄-wants panel, trade-in specs, offer and reveal | Guest |
| Post step 1 — type | `PostType` | Sell / Swap & top / Looking for | Account |
| Post step 2 — details | `PostDetails` | Category, photos, specifications, cash direction and amount | Account |
| Post step 3 — review | `PostReview` | Card preview, contact options, dealer-offers toggle, publish | Account |
| Dealer shopfront | `Shopfront` | Shop identity, trust stats, stock grid, reveal | Guest |
| Saved | `Saved` | Watchlist with availability and price-drop badges | Account |
| Me | `Me` | Account hub and console entry | Account |

### Reference board

| Board | Wireframe frame | Purpose |
| --- | --- | --- |
| Card system | `Cards` | All four card types with annotations |

### Dealer console — 390px

| Screen | Wireframe frame | Purpose |
| --- | --- | --- |
| Stock | `ConsoleStockM` | Stock list with status, reveals, add stock |
| Leads | `ConsoleLeadsM` | Matching requests with trade-in detail, respond actions |
| Promote | `ConsolePromoteM` | Lead alerts, sponsored slots, Friday Drop, performance |

### Dealer console — 1360px

| Screen | Wireframe frame | Purpose |
| --- | --- | --- |
| Stock | `ConsoleStockD` | Full table for bulk pricing, filters, bulk import |
| Leads | `ConsoleLeadsD` | Two-pane: request list beside request detail and offer composer |

---

## Route structure

Flat and human-readable. The v1 prefix (`/swapandtop/...`) is removed — it was an artefact of an old subpath deployment and is noise on a real domain.

| Route | Screen | Rendering |
| --- | --- | --- |
| `/` | Browse feed | Server-rendered |
| `/search` | Search and filters | Server-rendered |
| `/wanted` | Wanted feed | Server-rendered |
| `/listing/<slug>` | Listing detail, any type | Server-rendered — **SEO critical** |
| `/shop/<slug>` | Dealer shopfront | Server-rendered — SEO critical |
| `/post` | Posting flow | Client-rendered |
| `/saved` | Saved | Client-rendered |
| `/me` | Account hub | Client-rendered |
| `/console/...` | Dealer console | Client-rendered |
| `/admin/...` | Staff tools | Client-rendered |

### Slugs are required

Listing URLs must contain readable text, not an opaque identifier:

```ascii
v1:  /swapandtop/posts/viewpost/68a3f1c9d4e2b7a1f0c85d33
v2:  /listing/thinkpad-t480-i5-16gb-256gb-harare-a3f9
```

The trailing fragment keeps it unique. This is a data-model requirement, not a presentation detail — see [../architecture/data-model.md](../architecture/data-model.md).

---

## Rendering split

Driven by one question: does a search engine or a link scraper need to see it?

| Needs SEO | Does not |
| --- | --- |
| Browse feed | Posting flow |
| Search results | Saved |
| Listing detail | Account hub |
| Shopfront | Dealer console |
| Category and location landing pages (later) | Staff tools |

Public pages need no authentication at all, which means the entire SEO benefit can be delivered without solving server-side authenticated rendering. That is deliberate: it removes the hardest problem from the critical path. See [../architecture/auth-and-identity.md](../architecture/auth-and-identity.md).

---

## Categories

Filters within the single feed, not separate destinations.

| Category | Notes |
| --- | --- |
| Phones | Highest volume |
| Laptops | Richest specifications — the search showcase |
| Desktops | Includes custom builds |
| Consoles | Strong swap culture |
| Components and parts | High swap and upgrade culture, highly searchable |
| Accessories | Low value, fills the feed |

Vehicles are deferred. See [roadmap.md](./roadmap.md).

---

## Dealer console navigation

Four sections on mobile; five on desktop, where Performance earns its own space.

```ascii
MOBILE                          DESKTOP
┌────────────────────┐          ┌──────────┬────────────────────┐
│     content        │          │ Stock    │                    │
│                    │          │ Leads ●5 │     content        │
│                    │          │ Perform. │                    │
├────┬────┬────┬─────┤          │ Promote  │                    │
│Stck│Lead│Prom│Shop │          │ Shop     │                    │
└────┴────┴────┴─────┘          └──────────┴────────────────────┘
```

**Mobile is the primary build.** Most small Harare shops are run from a phone behind a counter, not from a laptop. Desktop earns its width only for bulk pricing and the two-pane Leads view.

---

## Entry and exit between surfaces

- **Into the console:** a row on the `Me` screen, visible only to dealer accounts.
- **Out of the console:** "View shop" in the console header goes to the public shopfront; "Back to marketplace" returns to the feed.

A dealer is a normal user with an extra surface, not a separate account type. They can still swap, save and request as themselves.

---

## Related documentation

- [Card System](./card-system.md) — what appears inside the feed
- [Search & Discovery](./search-and-discovery.md) — the `Search` screen in full
- [Post Flow](./post-flow.md) — the three posting screens
- [Dealer Console](./dealer-console.md) — console behaviour in detail
- [Feed & Filters](../features/feed-and-filters.md) — how the feed is composed
- [SEO & Rendering](../architecture/seo-and-rendering.md) — why the rendering split is what it is

---

**Last Updated:** September 2026
