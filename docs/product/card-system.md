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
│ 3. SWAP            │ THE SIGNATURE. Blue "has" tile with the cash, │
│                    │ green "looking for" tile. Nothing else looks  │
│                    │ like this.                                     │
├────────────────────┼──────────────────────────────────────────────┤
│ 4. WANTED          │ No photo — they do not own the thing.          │
│                    │ Text first, budget, one button: "I have this". │
└────────────────────┴──────────────────────────────────────────────┘
```

Wireframe reference board: frame `Cards`. The visual treatment — colours, sizes, spacing — follows `Swap & Top v2 Design.pdf`; see [visual-design.md](./visual-design.md).

---

## 1. User sale card

The baseline. Everything else is a variation on it.

**Contains:** one photo, price, condition, a single specification line, seller first name, area, age of listing.

**Deliberately omits:** any badge or shop identity. The absence of a shop row is itself the signal — a buyer can tell instantly this is a private seller, which changes their expectations about price and negotiation.

---

## 2. Dealer sale card

**Adds to the baseline:** a shop row separated by a divider, containing shop initial or logo, shop name, the "Verified Seller" badge, and stock count for that model ("4 in Stock").

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
│  ┌───────────────────┐  ┌───────────────────┐  │
│  │       photo       │  │       photo       │  │
│  ├───────────────────┤  ├───────────────────┤  │
│  │ Has         +$240 │  │ Looking for       │  │
│  │ Macbook Air 2017  │  │ Any Core i7       │  │
│  │ Core i5 · 16GB RAM│  │ 16GB RAM · 500GB  │  │
│  └─── brand blue ────┘  └─── brand green ───┘  │
│  Tarisai M. ✔ 3 deals · Mt Pleasant · 5h ago    │
└─────────────────────────────────────────────────┘
```

**The two things that make it unmistakable:**

1. **The split.** Two tiles side by side, not one image — what they have on the left, what they are looking for on the right.
2. **The two brand colours.** The "has" tile is blue and carries the cash amount; the "looking for" tile is green. "This, plus cash, for that" reads in one glance, even small and out of context.

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
- Poster's first name, and their **confirmed deal count** where they have one
- A single tap target covering the whole card

**No status or occupation markers.** A card never says what someone does for a living or where they study. Trust is shown as behaviour — confirmed deals — which anyone can earn. The only badge on the platform is verified dealer, which asserts a checkable fact about a business. New accounts show no deal count rather than a zero, because a zero reads as a warning while an absence reads as new. See [../features/deal-confirmation.md](../features/deal-confirmation.md).

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
| `DROPPED $20` | Price reduced since the viewer saved it (Saved list). On a feed card a drop shows instead as the old price struck through beside the new one |
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
