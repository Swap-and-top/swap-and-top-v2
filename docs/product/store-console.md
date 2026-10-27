# Store Console

## The surface stores pay for

**Status:** Decided — build after validation confirms demand
**Read this if:** you are building the business-facing side, or you need to understand the commercial centre of the plan.

> **Updated 2026-10-27:** the console is the **Store console**, and "dealer" is "store" in everything people see (P37). It opens with a store pass ($1 a day, $5 a week, $15 a month), run by an owner and staff; see [accounts-and-stores.md](./accounts-and-stores.md).

---

## Overview

A separate surface from the marketplace, with a different character: a working tool rather than a browsing experience. Dark header, dense lists, action-oriented.

It is two things at once:

1. **Swap & Top's dealer interface** — stock, leads, swap offers, promotion
2. **A Greta Works Digital product** — a system for running a small gadget shop, with standalone value

That dual identity is intentional and is the bridge between the two companies. See [../business/company-structure.md](../business/company-structure.md).

Wireframe frames: `ConsoleStockM`, `ConsoleLeadsM`, `ConsolePromoteM` (now Stats), `ConsoleStockD`, `ConsoleLeadsD`.

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
| Sections | Stock, Leads, Offers, Stats, Shop | The same, with more room for the graph |

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
- **What they swap**: the device coming back and the cash on offer
- Whether it **matches something in this dealer's stock**, named explicitly
- How long ago, and the area
- Actions: **Send an offer**, **Show number**

```ascii
A LEAD AS THE DEALER SEES IT:
┌────────────────────────────────────────────────┐
│ NEW · 12 minutes ago · UZ area                 │
│ Wants any i7 laptop, 16GB, SSD                 │
│ ┌────────────────────────────────────────────┐ │
│ │ THEY SWAP                                  │ │
│ │ MacBook Air 2017 i5 8GB          +$240     │ │
│ └────────────────────────────────────────────┘ │
│ ✓ Matches your Dell Latitude 7490              │
│ [ Send an offer ]                      [ 📞 ]  │
└────────────────────────────────────────────────┘
```

**The match line is what makes it feel like a tool rather than a notification.** It closes the gap between "someone wants something" and "here is what you should offer them."

**Tabs:** matching requests, number reveals. The shop's own offers are on the Offers page, under Sent. On a phone each row of the table is a compact card; between a tablet and a wide screen, two to a row; from a wide screen, the table.

| Tab | What it shows |
| --- | --- |
| **Matching requests** | Requests and swaps that match the shop's stock (or its lead alert categories), newest first. Each says how the dealer was told of it, e.g. *"Alerted by WhatsApp · 10:42"*. |
| **Number reveals** | A table set as Stock's: who revealed the shop's number, how they made contact (WhatsApp or call), the listing and its price, when, their confirmed deals, and a badge for where the deal check stands (*Asking them in 3 days*, *Answer needed* once they say yes, *Deal confirmed*, *No deal*). Until the person says a deal went through, the row shows only *Someone in* their area, with no name or deal count; the shop never learns who merely looked. Only a row marked *Answer needed* opens anything: its deal check, where the shop answers and comes back to Leads. Other rows do nothing, since there is nothing to do on them. Shape: `NumberReveal` in `packages/core/src/types/lead.ts`. |

**Lead alerts** sit above the tabs: a chip that shows whether they are on, paused or need setting up, and opens their settings. See [../features/notifications.md](../features/notifications.md).

The requester's own record is shown on the lead — confirmed deals, account age, clean report history — so a dealer can judge who they are dealing with. No occupation or status markers; see [trust-and-safety.md](./trust-and-safety.md).

**When nothing matches**, say so plainly and offer "I can source this" — dealers routinely source to order, and that is still a lead.

**Desktop version is two-pane:** the request list on the left, the selected request's detail on the right with what they swap, the matching stock item, and an offer composer — price plus a short message. Reviewing a queue of leads is much faster this way.

---

### 3. Offers

Everything the shop has going in offers, laid out exactly as the profile's Offers page is for a person (the shared `OfferGroups` component): each listing in brief, its offers hung under it on a thread line. Two tabs:

| Tab | Content |
| --- | --- |
| **Received** | Offers on the shop's stock, cash or a swap (see [../features/swap-and-top.md](../features/swap-and-top.md#one-kind-of-offer)). Accept or decline; accepting shows the buyer's contact ways, and a decline can be undone |
| **Sent** | The offers the shop made on Wanted listings from Leads, with what became of each. *See it*, on the message after sending one, opens this tab |

The section's count in the navigation is the offers received still waiting for a reply. Route and code names stay `/console/trade-ins`.

### One home per account

A private seller manages everything in their profile; a dealer manages everything for their shop in the console, so nobody hunts between two places. **Still to do, with the API:** in a dealer's own profile, shop matters (My listings, Offers, Deals to confirm on shop stock) should point to the console instead of repeating it, leaving only personal things (Saved, Settings) in the profile. In the mock the profile belongs to Tarisai, a private seller, and the console to Kopje Computers, so there is nothing to show yet.

### 4. Stats

The shop's numbers over time, to decide what to do next, and at the foot the ways to grow them. It replaced Promote (`/console/promote` forwards to `/console/stats`), so the menu stays at five sections.

| Block | Content |
| --- | --- |
| **Stretch of time** | One switch: Today, Week, Month, Year, All time. Today's graph goes by the hour, a week or month by the day, a year or all time by the month |
| **Four numbers** | Listing views, Number reveals (the leads), Offers received, Confirmed deals, each with its change on the stretch before, in words ("Up 18% on last week") |
| **The graph** | One bar chart, of whichever number is tapped (Number reveals to start). Tap or hover a bar for its figure |
| **Your best items** | The shop's items, most reveals first, each with its views, reveals, offers and deals |
| **Where leads come from** | WhatsApp against calls, and sponsored against normal listings |
| **Grow these numbers** | Sponsored slots, from $1 a day, paid through Paynow: how many run now and at what a day, *Boost a listing*, and *Boosted listings*, which opens Stock on its **Boosted** tab: each boosted listing with until when, its daily budget and reveals since, extended or stopped from its menu, then **Worth boosting**, the three live items with the most reveals, each with a Boost button (*Extend boost*, *Stop boost*) (see [../business/monetization.md](../business/monetization.md)). Lead alerts live on Leads, their price and renewal at the top of their settings. The Friday Drop is paused for now (decision P30) |

Confirmed deals is the renewal argument: *"at least twelve confirmed deals last month"* is a far stronger reason to keep paying than a count of people who saw a phone number. The page says it is a floor, since a deal counts only when both sides answer. Sponsored against normal is the argument for buying promotion, shown continuously rather than in a sales conversation. See [../features/deal-confirmation.md](../features/deal-confirmation.md).

The figures are mock data for now (`packages/core/src/mock/stats.ts`), the same on every load. Real ones come from the reveal, offer and deal records.

---

### 5. Shop profile

Shop name, logo, location, opening hours, description, verification status. Feeds the public shopfront at `/store/<slug>`.

---

## The shop / marketplace relationship

A dealer is a normal user with an extra surface, not a separate account type. They can swap, save and request as themselves.

- **Into the console:** a row on the `Me` screen, visible only to dealer accounts
- **Out of it:** "Back to marketplace" returns to the feed: at the foot of the sidebar on a laptop, and in the header on a phone. The shop as buyers see it is under Shop profile ("View as a buyer")

---

## Public shopfront

The dealer's outward face, at `/store/<slug>`. Server-rendered and indexable — a dealer's shopfront ranking in Google is a reason for them to value the account.

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
- [ ] Leads feed with swap detail and explicit stock matching
- [ ] Offer sending against a lead
- [ ] Stats screen: the four numbers over time, the graph, best items, lead sources, and promotion (subscription state and sponsored slot purchase) at its foot
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
