# Search & Discovery

## Specification-aware search — the platform's main advantage

**Status:** Decided
**Read this if:** you are building search, filters, or the browse experience. This is the highest-priority feature in the product.

---

## Overview

The positioning is *"the place to find gadgets easily."* Search is that promise. It is also the single thing Facebook Marketplace cannot do, and the thing a dealer will judge in the first few seconds of a demonstration.

Two distinct behaviours have to be served:

| Behaviour | What the user is doing | What serves it |
| --- | --- | --- |
| **Intent** | "I need a 16GB i7 laptop under $400" | Search with specification filters |
| **Browse** | "Show me something good" | The mixed feed, freshness, the Friday Drop |

Intent converts. Browse builds the habit that brings people back. Both are required; neither substitutes for the other.

---

## Why specifications matter more than keywords

A phone is roughly: model, storage, condition. Three dimensions, and the model name carries most of the meaning — "iPhone 13 128GB" is almost a complete description.

A laptop is: processor, memory, storage, graphics, screen size, battery health, condition. Seven dimensions, and the model name tells you almost nothing about whether it suits you. Two machines with the same model name can differ by a factor of three in price.

```ascii
WHERE THE ADVANTAGE LIVES:

  specification dimensions        our advantage over
  in the category                 a plain title search
  ────────────────────────────────────────────────────
  Accessories        1–2          ▏
  Phones             3–4          ▍
  Consoles           3–4          ▍
  Parts              3–5          ▋
  Laptops            6–8          ████████
  Desktops           6–9          █████████
```

**This is why computers lead the product** even though phones bring more traffic. Phones bring the volume; computers bring the margin and the demonstrable advantage.

---

## The search screen

A dedicated full-screen experience, not a bar with a dropdown. Wireframe frame: `Search`.

```ascii
┌──────────────────────────────────────┐
│ ←  [ thinkpad                     ]  │  ← query, persistent
├──────────────────────────────────────┤
│ (Laptops) Desktops  Phones  Parts    │  ← category selects the filter set
├──────────────────────────────────────┤
│ PROCESSOR                            │
│ [Core i5] [Core i7] Ryzen 5 Ryzen 7  │  ← multi-select chips
│ RAM                                  │
│ 8GB [16GB] 32GB 64GB+                │
│ STORAGE                              │
│ 128GB [256GB SSD] 512GB 1TB          │
│ GRAPHICS                             │
│ Integrated  GTX  RTX  Radeon         │
│ CONDITION                            │
│ Like new [Good] Fair  For parts      │
│ MIN PRICE          MAX PRICE         │
│ [$150]             [$400]            │
├──────────────────────────────────────┤
│ Clear          [ Show 24 results ]   │  ← live count
└──────────────────────────────────────┘
```

### Behaviour requirements

- **Category drives the filter set.** Choosing Laptops shows processor and graphics; choosing Phones shows battery health instead. Filters are never generic.
- **Chips are multi-select.** "i5 or i7" is a normal request.
- **The result count updates live** as filters change, before submitting. It tells the user whether they are over-constraining, and it makes the filters feel responsive.
- **Filters survive** into the results view and remain visible and editable.
- **Filter state belongs in the URL.** A filtered search must be shareable and indexable — this is how category and location landing pages get built later.
- **Empty results offer a way out** — the nearest match with one filter relaxed, and an offer to post the search as a Wanted request. That last one converts a dead end into a lead.

---

## Filter sets by category

| Category | Filters |
| --- | --- |
| **Laptops** | Processor, RAM, storage, graphics, screen size, battery health, condition, price |
| **Desktops** | Processor, RAM, storage, graphics, form factor, condition, price |
| **Phones** | Model, storage, RAM, battery health, condition, price |
| **Consoles** | Model, storage, controllers included, condition, price |
| **Parts** | Part type, model, capacity or rating, condition, price |
| **Accessories** | Type, condition, price |

Shared across all: **location** and **listing type** (sale, swap, wanted).

---

## Specification data has to be clean

Filters are only as good as the data behind them, which creates obligations on the posting flow.

- **Structured fields, not free text**, wherever a filter depends on it. A processor typed freehand cannot be filtered reliably.
- **Guided entry with suggestions** — the user picks from known values where possible, with an "other" escape.
- **Every collected specification must be stored.** In v1 the processor field was collected in the form, passed to the database layer, and silently discarded because the field was commented out of the schema. The most important laptop specification was thrown away, and any filter on it matched nothing.
- **Normalisation on save.** "i5 8250U", "Core i5-8250U" and "intel i5 8250u" are the same processor and must filter together.

---

## Browse discovery

Search serves intent. The feed serves the habit. Four things make a feed worth returning to:

### 1. Something to scroll

Infinite scroll, real pagination. In v1 the feed requested a single page and nothing ever asked for the next one, so it stopped at ten listings. A ten-item feed cannot be browsed.

### 2. Something new each visit

Freshness is the main driver of return visits. Dealers are the only realistic source of daily volume early on — another reason they must be present from the start.

### 3. Deals that are actually deals

A feed of dealer stock at retail prices is a catalogue, not a deals feed. Early on, good deals are curated by hand through the Friday Drop. Later, accumulated listing data supports a "below typical price" signal — and because people already come online to check prices, that price intelligence becomes a reason to visit on its own.

### 4. A reason to come back at a set time

The Friday Drop. See [../business/go-to-market.md](../business/go-to-market.md).

---

## Discovery surfaces, in priority order

| Surface | Serves | Built when |
| --- | --- | --- |
| Browse feed with chips | Browse | First release |
| Specification search | Intent | First release |
| Wanted feed | Dealers hunting, buyers declaring | First release |
| Friday Drop | Habit | First release, run manually |
| Saved with price drops | Return visits | First release |
| Category and location landing pages | Search engines | After validation |
| Price guidance | Price-checking behaviour | Later, needs data volume |
| Saved search alerts | Intent, repeated | Later |

---

## Search engine considerations

Search and SEO are the same problem approached from two sides. A filtered search URL is a landing page. Requirements:

- Filter state in the URL, in readable form
- Server-rendered results
- Listing pages with readable slugs and structured product markup
- A sitemap that includes live listings and expires dead ones

Full detail in [../architecture/seo-and-rendering.md](../architecture/seo-and-rendering.md).

---

## Definition of done for search

Search is finished when all of these are true:

- [ ] A guest can filter laptops by processor, RAM, storage, graphics and condition and get correct results
- [ ] The result count is live and accurate before submitting
- [ ] Filters appear in the URL and the URL can be shared
- [ ] Results are server-rendered and indexable
- [ ] Every specification shown as a filter is genuinely stored on every listing
- [ ] Equivalent specification values filter together
- [ ] Empty results offer a relaxed match and a "post this as a request" action
- [ ] The whole screen is usable one-handed at 390px on mobile data

---

## Related documentation

- [Principles](./principles.md) — rule 2
- [Post Flow](./post-flow.md) — where specification data is captured
- [Feed & Filters](../features/feed-and-filters.md) — browse behaviour and feed composition
- [Data Model](../architecture/data-model.md) — how specifications are stored
- [SEO & Rendering](../architecture/seo-and-rendering.md) — indexable search
- [v1 Lessons](../reference/v1-lessons.md) — the search failures this replaces

---

**Last Updated:** September 2026
