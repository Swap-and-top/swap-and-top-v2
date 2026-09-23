# Feed & Filters

## The single mixed feed, its composition and ordering rules

**Status:** Decided
**Read this if:** you are building the browse experience or the promotion mechanics.

---

## Overview

One feed carries every listing type. Category chips and type chips filter it. There are no separate destinations for sale, swap and wanted.

**Why one feed:** thin inventory split three ways produces three dead-looking feeds. One mixed feed feels alive. Mixing also creates discovery — someone browsing swaps encounters a dealer's sale.

This is reversible. The data model is identical either way, so promoting a chip to its own page later is a presentation change, not a migration.

---

## Structure

```ascii
┌──────────────────────────────────────┐
│  Swap & Top                      🔔  │
│  [ 🔍 Search phones, laptops... ]    │  ← opens the search screen
│  (All) Phones Laptops Desktops Cons  │  ← category chips
├──────────────────────────────────────┤
│  (All types) For sale  Swaps  Wanted │  ← type chips
├──────────────────────────────────────┤
│  ┌────────────────────────────────┐  │
│  │  dealer sale card              │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │  swap card                     │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │  wanted card                   │  │
│  └────────────────────────────────┘  │
│              ... infinite scroll     │
├──────────────────────────────────────┤
│ Browse  Wanted   (+)   Saved    Me   │
└──────────────────────────────────────┘
```

Wireframe frame: `Main`.

---

## Two chip rows, two jobs

| Row | Options | What it filters |
| --- | --- | --- |
| **Category** | All, Phones, Laptops, Desktops, Consoles, Parts, Accessories | What kind of thing |
| **Type** | All types, For sale, Swaps, Wanted | What kind of transaction |

Both are horizontally scrollable, single-select, and reflected in the URL so a filtered feed can be shared and indexed.

---

## Ordering

Default order is **newest first**, with promoted listings interleaved.

### The interleaving rule

```ascii
FEED COMPOSITION:
  position 1   organic (newest)
  position 2   organic
  position 3   organic
  position 4   organic
  position 5   organic
  position 6   ★ SPONSORED   ← labelled, rotated among payers
  position 7   organic
  position 8   organic
  ...
  position 12  ★ SPONSORED
  ...
```

**Roughly every sixth card is a labelled sponsored slot**, rotated among dealers who have paid.

### Why not simply sort promoted listings first

Because with five paying dealers, the first five cards are all advertisements. The feed stops feeling like a community, the student side of the platform dies, and the thing being sold loses its value.

Interleaving also means the slot price scales naturally with traffic rather than with how many dealers happen to be paying.

This is [../product/principles.md](../product/principles.md) rule 5 and it is not negotiable.

### Dealer volume limits in the organic feed

Dealers post far more than individuals. Without a limit, the feed becomes a dealer catalogue — exactly Facebook Marketplace's problem.

- No more than a small number of consecutive organic cards from the same dealer
- Sponsored slots are exempt, since they are labelled and paid

---

## Freshness

The strongest driver of return visits is having something new each time.

| Source of freshness | Notes |
| --- | --- |
| **Dealer stock** | The only realistic source of daily volume early on. Another reason dealers must be present from the start. |
| **Friday Drop** | A weekly burst of curated deals, tagged and badged |
| **New student listings** | Grows with the campus base |
| **Price drops** | A reduced price re-surfaces a listing and flags it to anyone who saved it |

---

## Pagination

**Infinite scroll, properly implemented.** In v1 the feed requested a single page and nothing ever asked for the next one, so it stopped at ten listings permanently. A ten-item feed cannot be browsed, which made the entire deal-browsing idea impossible.

Requirements:

- Cursor-based paging, stable under insertion
- The first page server-rendered for search engines and first paint
- Subsequent pages fetched as the user scrolls
- Scroll position preserved when returning from a listing

---

## What appears and what does not

**Appears:** live listings whose owner is in good standing.

**Does not appear:** drafts, expired, sold, withdrawn, removed, or listings from suspended or banned accounts.

In v1 the feed filtered on deletion and sold flags but **never checked moderation state**, so listings were public before anyone reviewed them — the approval workflow gated nothing at all. The rule now: the feed reads only live listings, and status filtering happens in the query, not in the client.

---

## Empty and thin states

A new campus or an over-filtered view will be sparse. Each state has a defined response:

| State | Response |
| --- | --- |
| No results for the filters | Show the nearest match with one filter relaxed, and offer to post the search as a request |
| No listings in a category | Show other categories, and prompt to post |
| Genuinely empty feed | Explain plainly, invite posting, link the drop |

Never an empty screen with nothing in it.

---

## Data cost

The feed is the heaviest screen and the market runs on expensive mobile data.

- Images compressed and sized for the card, never full resolution
- Lazy loading below the fold
- Small payloads — the feed response carries only what a card renders
- **No contact details in the feed payload**, ever. See [../product/contact-and-reveals.md](../product/contact-and-reveals.md)

---

## Definition of done

- [ ] One feed containing all listing types
- [ ] Category and type chips filtering, reflected in the URL
- [ ] Infinite scroll with stable paging and preserved scroll position
- [ ] First page server-rendered
- [ ] Sponsored slots interleaved and labelled, never sorted to the top
- [ ] Consecutive-dealer limit in the organic feed
- [ ] Only live listings from accounts in good standing
- [ ] Defined empty and thin states
- [ ] No contact details in any feed response

---

## Related documentation

- [Card System](../product/card-system.md) — what the feed is made of
- [Search & Discovery](../product/search-and-discovery.md) — the intent path
- [Listing Types](./listing-types.md) — what shares the stream
- [Monetization](../business/monetization.md) — sponsored slot pricing
- [Principles](../product/principles.md) — rules 3, 5 and 7

---

**Last Updated:** September 2026
