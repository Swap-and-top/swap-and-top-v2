# The Wedge

## The problem, the competition, and what Facebook structurally cannot do

**Status:** Decided
**Read this if:** you need to know why this platform should exist at all, or you are writing marketing or sales copy.

---

## Overview

The platform starts from a concrete, observed problem, not a hypothesis.

A seller of used computers and laptops, advertising stock online, was repeatedly asked the same question by prospective buyers: *"do you do swap and top deals?"* People wanted to hand over the gadget they already owned, add some cash, and walk away with something better. There was no dedicated place to do that — you had to go into town, find dealers one at a time, or sell your device first and then start shopping all over again.

That question, asked over and over by people with money in hand, is the strongest demand signal the project has.

---

## The competition, honestly

### WhatsApp groups and broadcast lists

Probably the **largest competitor**, and the one most often overlooked. Dealers already run groups and broadcast lists. It is free, it is where their customers already are, and they own the relationship completely.

Implication: our pitch to a dealer cannot be "reach your customers." It has to be **"reach buyers you cannot reach yourself."** That is only true once we have buyer traffic, which is the chicken-and-egg problem the go-to-market plan exists to solve.

### Facebook Marketplace

Where most people in Zimbabwe currently go to check prices and buy things. Free to post, enormous network effect, and impossible to beat head-on.

### Local classifieds sites

Have existed for years and have not displaced either of the above.

---

## What Facebook structurally cannot do

Being cleaner or less distracting than Facebook is **not a wedge.** Nobody abandons a network effect for a tidier interface. These four things are different, because they are structural rather than cosmetic.

### 1. Demand as a first-class object

Facebook Marketplace is a **supply board**. People post what they have and wait. If you want something, you scroll, or you post in a group where the request disappears within hours.

Swap & Top treats demand as a real entity. Every swap post is a precise statement of demand with a trade-in attached:

```ascii
A SWAP POST IS A STRUCTURED LEAD:
┌───────────────────────────────────────────────────────────┐
│  "I have a MacBook Air 2017 (i5, 8GB, 128GB SSD)"         │  ← the trade-in
│  "I want any i7 with 16GB and an SSD"                     │  ← the demand
│  "I will add $240"                                        │  ← the cash
└───────────────────────────────────────────────────────────┘
        │
        ▼
  A dealer holding an i7 16GB laptop now knows:
  what this person wants, what is coming back in trade,
  and how much money is on the table.
```

This is the central insight of the whole product. **The feature that attracts ordinary users and the product dealers pay for are the same object.** It also solves the cold-start problem for the lead list: it fills itself from day one, because every swap post is already a request.

### 2. Specification-aware search

A phone is roughly model, storage, condition. A laptop is processor, memory, storage, graphics card, screen size, battery health and condition. Searching Facebook Marketplace for a 16GB i7 laptop is close to useless — there is only a title and a photo.

Our advantage widens with the number of specification dimensions, which is why **computers lead the product** even though phones bring more volume. See [../product/search-and-discovery.md](../product/search-and-discovery.md).

### 3. Search engine and link-preview presence

Facebook Marketplace listings are largely invisible to Google. Someone searching *"i7 laptop for sale Harare"* can land on us instead — which means **intercepting demand before it reaches Facebook**, rather than beating Facebook's network effect.

Separately, and more immediately: link scrapers for WhatsApp, Facebook and X do not run JavaScript. A listing shared into WhatsApp must show a photo, a title and a price. In v1 it showed nothing, which threw away every share. See [../architecture/seo-and-rendering.md](../architecture/seo-and-rendering.md).

### 4. Physical trust infrastructure

Eventually: a counter where two people meet to complete a swap safely and a device gets checked for locks and theft. Facebook cannot build that. It is the only genuinely durable moat in the plan, and it is deliberately far out. See [../product/trust-and-safety.md](../product/trust-and-safety.md).

---

## The swap mechanic generalises

Trade-in-plus-cash is not a novelty invented for gadgets. It is **how cars are traded everywhere in the world**. That matters for two reasons:

- It confirms the primitive is sound rather than gimmicky.
- It points at the natural category expansion — vehicles, where classifieds money actually sits.

Vehicles are explicitly deferred. Different dealers, different trust requirements, different regulation. Recorded in [../product/roadmap.md](../product/roadmap.md).

---

## Positioning statement

> **The place to find gadgets easily in Zimbabwe — and to trade the one you have towards the one you want.**

Note what this is and is not:

- It is a **discovery and trading** positioning, not a social one.
- "Swap & Top" is the name and the hook, but it describes one of three things the platform does. Copy should lead with finding and trading, not with swapping alone.
- Categories at launch: phones, laptops, desktops, consoles, components and parts, accessories.

---

## What would falsify this

Stated plainly so it can be checked rather than assumed:

| Claim | How it fails |
| --- | --- |
| Swap demand is real and repeated | Swap posts get made but never answered, and users stop posting |
| Dealers value structured leads | Dealers see leads for a month and will not pay anything for them |
| Specification search is a real advantage | Nobody uses the filters; everyone just scrolls |
| Deal-browsing becomes a habit | Visitors come once and never return |

Each one has a measurement and a threshold in [../operations/validation-test.md](../operations/validation-test.md).

---

## Related documentation

- [Target Users](./target-users.md) — who each of these groups actually is
- [Monetization](./monetization.md) — turning the lead insight into revenue
- [Go To Market](./go-to-market.md) — solving the chicken-and-egg problem
- [Wanted & Leads](../features/wanted-and-leads.md) — the lead product in behavioural detail
- [Search & Discovery](../product/search-and-discovery.md) — the specification advantage in product terms

---

**Last Updated:** September 2026
