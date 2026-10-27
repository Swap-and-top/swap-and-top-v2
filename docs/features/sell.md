# Sell

## Straightforward sale listings

**Status:** Decided — nearly free to build
**Read this if:** you are building sale listings or the dealer stock path.

---

## Overview

The simplest listing type: someone owns a thing and wants money for it.

It is also the type that does the most work for the platform, for three reasons:

1. **It clears easily.** Cash resolves anything, so sale listings have none of the matching difficulty that swaps do.
2. **It fills the feed.** Dealer stock is the only realistic source of daily volume early on, and dealer stock is almost entirely sale listings.
3. **It is where dealers already live.** They understand it, they have inventory for it, and it needs no explanation.

---

## Why students need it too

The original assumption was that Sell is for dealers and Swap is for students. That is only half right.

Student-to-student **selling** works fine, because it has no double-coincidence problem — there is always someone who wants cash and someone who wants a device. Student-to-student **swapping** rarely matches without a dealer in the middle.

So Sell is not the dealer feature. It is the type that works for everyone, and swaps are the differentiator layered on top.

---

## What a sale listing contains

| Field | Notes |
| --- | --- |
| Item name | Required |
| Category | Determines the specification set |
| Specifications | Structured, per category |
| Condition | Like new, good, fair, for parts |
| Defects | Optional but encouraged; hiding them produces failed meetings |
| Accessories | Optional — charger, box, controllers |
| **Price** | Required |
| Negotiable | Whether the price is open to discussion |
| Photos | 2 to 8, required |
| Location | Area within the city |
| Contact preferences | Which channels the seller accepts |

---

## Private seller versus dealer

Same data, different presentation and different affordances.

| | Private seller | Dealer |
| --- | --- | --- |
| Card | No shop row, no badge | Shop row with logo, name, verified badge, stock count |
| Detail screen | Seller name and verification level | Shop card linking to the shopfront |
| Stock count | Not applicable | "4 in stock" where several of a model are held |
| Listing cap | Soft cap, lifted by phone verification | Effectively uncapped |
| Bulk entry | Not applicable | Bulk import in the console |
| Promotion | Not available | Sponsored slots, drop slots |

The absence of a shop row on a private listing is itself a signal — a buyer immediately knows what kind of transaction they are entering.

---

## Price drops

A reduced price does three things:

1. Re-surfaces the listing in the feed
2. Adds a `DROPPED $20` badge for anyone who has saved it
3. Triggers a notification to savers

This is a well-established re-engagement mechanic and costs almost nothing to build. See [notifications.md](./notifications.md).

---

## Swaps accepted and swap offers

A seller can mark a sale listing **Swaps accepted**: they will take something in part-exchange, with cash on top. Dealers will use it most, but any seller can set it.

- The listing says so, first in its line of facts: `✓ Swaps accepted · Harare CBD · 2 hours ago · Negotiable`.
- Beside **Show contacts** the buyer gets **Offer a swap**. It opens the same offer sheet used on swaps and wanted posts, headed with the item for sale and its price: what they are offering (one of their listings, or described), any cash they add, a message, and how they can be reached.
- The offer goes straight to the seller. A dealer sees it under **Swap offers** in the console; a private seller sees it under their listing and in Offers, like any offer. Accepting shows each the other's contact ways; the deal is finished in person.

This replaces an earlier idea, a prompt reading *"Got a laptop to swap? Ask for a swap price"* that opened the posting flow. Once the listing says swaps are accepted, a buyer can simply ask the seller, and posting a public swap never reached the seller at all. The swap offer reaches them directly and still turns purchase intent into swap demand.

Wireframe frame: `DetailDealer`.

---

## The sale detail screen

```ascii
┌──────────────────────────────────────┐
│ ←                        ♡      ↗    │
├──────────────────────────────────────┤
│         photo carousel               │
│         • ○ ○ ○                      │
├──────────────────────────────────────┤
│  $285   Good condition               │
│  Lenovo ThinkPad T480                │
│  Harare CBD · 2 hours ago            │
├──────────────────────────────────────┤
│  Processor    │ RAM                  │
│  Storage      │ Graphics             │
│  Screen       │ Battery              │
├──────────────────────────────────────┤
│  🏪 Kopje Computers ✓ Verified       │
│  42 listings · replies within an hour │
├──────────────────────────────────────┤
│ [ Offer a swap ]     [ Show contacts ]│
│  No account needed · meet in public  │
└──────────────────────────────────────┘
```

The specification table is a grid rather than prose. It is the part a buyer actually reads, and it is what the search filters were built against — showing them in the same shape reinforces the platform's one real advantage.

---

## Dealer stock relationship

For a dealer, a sale listing and a stock item are the same record seen from two sides:

- In the **console**, it is stock: price, status, reveals, actions
- In the **marketplace**, it is a listing: photos, specifications, contact

When the dealer console exists, adding stock publishes a listing in one action. That is the mechanic that inverts the cold-start problem. See [../product/store-console.md](../product/store-console.md).

---

## Marking sold

- The owner marks it sold from their own listing or the console stock list
- It leaves the feed, search and the sitemap immediately
- It remains visible to the owner, and relistable
- Savers see it as `GONE`

**Prompt to mark sold.** Sellers forget, and stale listings damage trust faster than almost anything. The 30-day expiry nudge asks directly whether the item is still available, which catches most of it.

---

## Definition of done

- [ ] Sale listings with per-category specifications, condition, defects and price
- [ ] Private and dealer variants rendering correctly
- [ ] Photo carousel with 2–8 images
- [ ] Specification grid on the detail screen
- [ ] Price drop re-surfacing, badging and saver notification
- [ ] Swaps accepted on a sale, with swap offers to the seller (console Swap offers for dealers)
- [ ] Mark sold, with removal from feed, search and sitemap
- [ ] Stock count shown where a dealer holds several of a model

---

## Related documentation

- [Listing Types](./listing-types.md) — the shared model
- [Swap & Top](./swap-and-top.md) — the differentiated type
- [Card System](../product/card-system.md) — the two sale cards
- [Dealer Console](../product/store-console.md) — stock as the other side of a listing
- [Notifications](./notifications.md) — price drop alerts

---

**Last Updated:** September 2026
