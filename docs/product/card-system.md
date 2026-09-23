# Card System

## The four listing cards and what makes each one recognisable

**Status:** Decided
**Read this if:** you are building the feed, or designing any listing summary.

---

## Overview

Four card types share one feed. A user must be able to tell them apart in under a second, while scrolling. Each card carries only what is needed to decide whether to tap.

```ascii
THE FOUR CARDS:
┌────────────────────┬──────────────────────────────────────────────┐
│ 1. USER SALE       │ Plainest. Photo, price, condition, spec line. │
│                    │ No badge — clearly a private seller.          │
├────────────────────┼──────────────────────────────────────────────┤
│ 2. DEALER SALE     │ Adds a shop row: logo, name, verified badge,  │
│                    │ stock count. Reads as commercial.             │
├────────────────────┼──────────────────────────────────────────────┤
│ 3. SWAP            │ THE SIGNATURE. have ⇄ wants, cash in the      │
│                    │ middle. Nothing else looks like this.          │
├────────────────────┼──────────────────────────────────────────────┤
│ 4. WANTED          │ No photo — they do not own the thing.          │
│                    │ Text first, budget, one button: "I have this". │
└────────────────────┴──────────────────────────────────────────────┘
```

Wireframe reference board: frame `Cards`.

---

## 1. User sale card

The baseline. Everything else is a variation on it.

**Contains:** one photo, price, condition, a single specification line, seller first name, area, age of listing.

**Deliberately omits:** any badge or shop identity. The absence of a shop row is itself the signal — a buyer can tell instantly this is a private seller, which changes their expectations about price and negotiation.

---

## 2. Dealer sale card

**Adds to the baseline:** a shop row separated by a divider, containing shop initial or logo, shop name, verified dealer badge, and stock count for that model.

**Purpose of each addition:**

| Element | What it communicates |
| --- | --- |
| Shop name and logo | This is a business with a reputation to protect |
| Verified badge | Someone checked who they are |
| "4 in stock" | Availability, and that this is not a one-off |

**Sponsored variant:** when a dealer has paid for placement, a small dark `SPONSORED` label sits on the image. Always visible, never hidden or softened. See [principles.md](./principles.md) rule 5.

---

## 3. Swap card — the signature

The most important visual element in the product.

```ascii
┌─────────────────────────────────────────────────┐
│  ⇄  SWAP & TOP                                  │  ← tinted strip
├─────────────────────────────────────────────────┤
│  ┌─────────┐      ┌────┐      ┌ ─ ─ ─ ─ ┐      │
│  │  photo  │      │ ⇄  │      │  photo  │      │  ← dashed = not owned
│  │         │      │+$240│      │ or icon │      │
│  └─────────┘      └────┘      └ ─ ─ ─ ─ ┘      │
│  HAS                          WANTS             │
│  MacBook Air 2017             Any i7, 16GB, SSD │
├─────────────────────────────────────────────────┤
│  Tarisai M. · Verified student · UZ · 5h ago     │
└─────────────────────────────────────────────────┘
```

**The three things that make it unmistakable:**

1. **The split.** Two tiles side by side, not one image.
2. **The cash amount in the middle.** Large, in the accent colour, with the direction implied by position.
3. **The dashed border on the right tile.** Instantly communicates "they do not own this yet." Small detail, disproportionate clarity.

**Why this matters commercially:** this is the card people screenshot into WhatsApp. It has to survive being seen small, out of context, without the surrounding app. It is the brand.

**Cash direction:** the amount is always stated from the poster's perspective — either they add cash or they receive it. Both directions are supported, and the ratio between them is a metric worth watching. See [../features/swap-and-top.md](../features/swap-and-top.md).

---

## 4. Wanted card — the dealer product

The only card with no photograph, because the poster does not have the item.

**Contains:** a `WANTED` label, what they want in plain words, budget, area, age, and one primary button — **"I have this"**.

**When the request has a trade-in attached** (a swap posted as demand), the card gains a compact trade-in strip showing the device coming back and the cash on offer. That variant is the highest-value lead on the platform.

**That button is the business.** Tapping it is the action a dealer pays to be alerted about. Everything about the card is arranged to make it the obvious next step.

**Response count** — "4 dealers responded" — appears once there is activity. It signals liveness to buyers and competition to dealers.

---

## Shared rules

### What every card carries

- Age of the listing, always
- Location, always
- Poster identity at whatever level of verification exists
- A single tap target covering the whole card

### What no card carries

- A phone number. Contact is behind the reveal action on the detail screen. See [contact-and-reveals.md](./contact-and-reveals.md).
- Truncated specification soup. One line at most, chosen for the category.
- More than one call to action, except the Wanted card's "I have this".

### Compact variants

Saved lists and shopfront grids use reduced versions of the same cards — smaller thumbnail, price, one line, state badge. The type must remain identifiable even at the smallest size, which is why the swap card's cash chip survives into the compact form.

### State badges

| Badge | Meaning |
| --- | --- |
| `SPONSORED` | Paid placement |
| `DROPPED $20` | Price reduced since the viewer saved it |
| `GONE` | Sold or withdrawn; card dimmed |
| `LIVE` / `SOLD` / `DRAFT` | Console-only states |

---

## Why these four and not more

Each card corresponds to one listing type in the shared data model. Adding a card means adding a listing type, which is a data decision, not a design one.

The fifth type — **auction** — is specified in [../features/auctions.md](../features/auctions.md) and will reuse the sale card with a bid panel and a countdown added. Nothing in the current card system blocks it.

---

## Related documentation

- [Feed & Filters](../features/feed-and-filters.md) — how cards are ordered and interleaved
- [Listing Types](../features/listing-types.md) — the data behind each card
- [Swap & Top](../features/swap-and-top.md) — the signature card's feature in depth
- [Wanted & Leads](../features/wanted-and-leads.md) — the fourth card as a revenue product
- [Principles](./principles.md) — rules 3 and 5

---

**Last Updated:** September 2026
