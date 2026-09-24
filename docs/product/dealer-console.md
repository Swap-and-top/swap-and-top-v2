# Dealer Console

## The surface dealers pay for

**Status:** Decided — build after validation confirms demand
**Read this if:** you are building the business-facing side, or you need to understand the commercial centre of the plan.

---

## Overview

A separate surface from the marketplace, with a different character: a working tool rather than a browsing experience. Dark header, dense lists, action-oriented.

It is two things at once:

1. **Swap & Top's dealer interface** — stock, leads, promotion
2. **A Greta Works Digital product** — a system for running a small gadget shop, with standalone value

That dual identity is intentional and is the bridge between the two companies. See [../business/company-structure.md](../business/company-structure.md).

Wireframe frames: `ConsoleStockM`, `ConsoleLeadsM`, `ConsolePromoteM`, `ConsoleStockD`, `ConsoleLeadsD`.

---

## Why it matters more than it looks

Three properties, each commercially significant:

| Property | Why it matters |
| --- | --- |
| **Standalone value** | Worth paying for even if the marketplace never reaches liquidity. Most shops run on paper and WhatsApp. |
| **Inverts the cold-start problem** | Dealer stock is already in the system because they run their shop on it. Publishing to the marketplace is one action, not a recruitment exercise. |
| **Supportable remotely** | Survives the founder's relocation, unlike campus seeding. |

The most likely good outcome of validation is that dealers pay for **software** before they pay for **leads**. That outcome is better than it first appears — recurring business revenue beats advertising slots, and it works from anywhere.

---

## Mobile first, decisively

Most small Harare shops are run from a phone behind a counter. A dealer will never open a laptop to add one item.

| | Mobile | Desktop |
| --- | --- | --- |
| Priority | **Primary build** | Second |
| Earns its place by | Being usable one-handed, behind a counter, mid-conversation | Bulk work — pricing a dozen machines, imports, two-pane leads |
| Sections | Stock, Leads, Promote, Shop | Adds Performance as its own section |

---

## Sections

### 1. Stock

The dealer's inventory.

**List row shows:** thumbnail, item name with key specifications, price, status badge, reveal count.

**Status values:** `LIVE`, `SPONSORED`, `SOLD`, `DRAFT`.

**Primary action:** a single thumb-reachable **Add stock** button.

**Reveal count per item is the point.** It is the dealer's evidence that the platform delivers, visible every time they open the app.

**Desktop adds:** a real table with sortable columns — item, specifications, price, status, views, reveals, actions — plus filters and **bulk import**. Bulk import matters because the fastest way to onboard a dealer is to take their existing list and load it.

---

### 2. Leads — the sales pitch

The screen that sells the platform. When demonstrating to a dealer, this is what to open twenty seconds into the conversation.

Each lead shows:

- What the person wants, in their words
- **The trade-in**: the device coming back and the cash on offer
- Whether it **matches something in this dealer's stock**, named explicitly
- How long ago, and the area
- Actions: **Send an offer**, **Show number**

```ascii
A LEAD AS THE DEALER SEES IT:
┌────────────────────────────────────────────────┐
│ NEW · 12 minutes ago · UZ area                 │
│ Wants any i7 laptop, 16GB, SSD                 │
│ ┌────────────────────────────────────────────┐ │
│ │ TRADING IN                                 │ │
│ │ MacBook Air 2017 i5 8GB          +$240     │ │
│ └────────────────────────────────────────────┘ │
│ ✓ Matches your Dell Latitude 7490              │
│ [ Send an offer ]                      [ 📞 ]  │
└────────────────────────────────────────────────┘
```

**The match line is what makes it feel like a tool rather than a notification.** It closes the gap between "someone wants something" and "here is what you should offer them."

**Tabs:** matching requests, number reveals, offers sent.

The requester's own record is shown on the lead — confirmed deals, account age, clean report history — so a dealer can judge who they are dealing with. No occupation or status markers; see [trust-and-safety.md](./trust-and-safety.md).

**When nothing matches**, say so plainly and offer "I can source this" — dealers routinely source to order, and that is still a lead.

**Desktop version is two-pane:** the request list on the left, the selected request's detail on the right with the trade-in, the matching stock item, and an offer composer — price plus a short message. Reviewing a queue of leads is much faster this way.

---

### 3. Promote

Where money is spent. Four blocks:

| Block | Content |
| --- | --- |
| **Lead alerts** | Status, price, renewal date. The subscription that earns first. |
| **Sponsored slots** | What it does, price per item per week, how many are running, action to sponsor an item |
| **Friday Drop** | Next drop time, slots remaining, price, action to apply |
| **Best performer** | The dealer's top item this week by reveals, and whether it was sponsored |

The header carries three numbers: **reveals this week**, **confirmed deals**, and **sponsored versus normal performance**.

The middle one is the renewal argument. *"At least twelve confirmed deals last month"* is a far stronger reason to keep paying than a count of people who saw a phone number. The third is the argument for buying promotion, shown continuously rather than in a sales conversation. See [../features/deal-confirmation.md](../features/deal-confirmation.md).

---

### 4. Shop profile

Shop name, logo, location, opening hours, description, verification status. Feeds the public shopfront at `/shop/<slug>`.

---

### 5. Performance — desktop only

Reveals over time, views-to-reveals ratio per item, which categories attract attention, which price bands move. Deliberately not on mobile, where the summary numbers in Promote are enough.

---

## The shop / marketplace relationship

A dealer is a normal user with an extra surface, not a separate account type. They can swap, save and request as themselves.

- **Into the console:** a row on the `Me` screen, visible only to dealer accounts
- **Out of it:** "View shop" in the header goes to the public shopfront; "Back to marketplace" returns to the feed

---

## Public shopfront

The dealer's outward face, at `/shop/<slug>`. Server-rendered and indexable — a dealer's shopfront ranking in Google is a reason for them to value the account.

Contains: shop identity and verified badge, a short description, location and hours, trust statistics (items in stock, **confirmed deals**, typical reply time), a **Show number** action, a follow action, and a stock grid with category tabs.

Wireframe frame: `Shopfront`.

---

## Build sequencing

**Do not build the console before dealers ask for it.**

During validation, the console is a clickable mockup shown honestly as a mockup, and the stock data entry is done by hand on the dealer's behalf. That is the whole point of the test — find out whether they want it before building it.

If validation shows dealers will pay for the stock system, the console becomes the first real engineering project after the rewrite foundation.

---

## Definition of done — first real version

- [ ] Stock list with add, edit, mark sold, and per-item reveal counts
- [ ] Confirmed deal count in the header and on the shopfront
- [ ] Leads feed with trade-in detail and explicit stock matching
- [ ] Offer sending against a lead
- [ ] Promote screen with subscription state and sponsored slot purchase
- [ ] Shop profile feeding a server-rendered public shopfront
- [ ] Fully usable one-handed at 390px
- [ ] Desktop table and two-pane leads view
- [ ] Bulk import from a dealer's existing list

---

## Related documentation

- [Monetization](../business/monetization.md) — what is sold here and when it earns
- [Company Structure](../business/company-structure.md) — the dual-company role
- [Wanted & Leads](../features/wanted-and-leads.md) — where leads come from
- [Information Architecture](./information-architecture.md) — navigation and routes
- [Validation Test](../operations/validation-test.md) — why this is built second, not first

---

**Last Updated:** September 2026
