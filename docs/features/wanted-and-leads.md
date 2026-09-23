# Wanted & Leads

## Requests, matching, and the dealer lead product

**Status:** Decided
**Read this if:** you are building the Wanted feed, dealer matching, or anything revenue-related. This is where the business model lives.

---

## Overview

Two things described together because they are the same object seen from two sides.

| Side | What it is |
| --- | --- |
| **User side** | "Wanted" — say what you are looking for, and offers come to you |
| **Dealer side** | "Leads" — see who is actively looking for what you stock, and respond first |

This is the platform's structural difference from Facebook Marketplace. Facebook is a **supply board**: people post what they have and wait. Demand is invisible, or it disappears into a group chat.

Here, demand is a first-class object — and it is what dealers pay for.

---

## What counts as demand

Two listing types produce demand, and both feed the same pipeline:

```ascii
SOURCES OF DEMAND:

┌──────────────────────┐        ┌──────────────────────┐
│  REQUEST             │        │  SWAP LISTING        │
│  "want RTX 3060,     │        │  "have MacBook Air,  │
│   budget $260"       │        │   want i7 16GB,      │
│                      │        │   will add $240"     │
└──────────┬───────────┘        └──────────┬───────────┘
           │                                │
           │        both are demand         │
           └────────────────┬───────────────┘
                            ▼
                  ┌───────────────────┐
                  │   WANTED FEED     │  public
                  │   DEALER LEADS    │  paid alerts
                  └───────────────────┘
```

**The swap listing is the higher-value lead**, because it carries a trade-in and a cash figure. A dealer learns what the person wants, what is coming back to them, and how much money is on the table.

**No cold start.** The lead list fills itself from the first day, because every swap post is already a request. This is the single neatest property of the whole design.

---

## The Wanted feed

Wireframe frame: `Wanted`. Top-level navigation, not hidden inside search.

**Why it deserves a navigation slot:** it is the dealer product and the platform's differentiator. Burying it would hide the thing that makes the business work.

Contents:

- Requests, newest first
- Swap listings shown as demand, with their trade-in strip
- Category filter chips
- A prominent action: **post what you are looking for**

Each card carries one primary button — **"I have this"** — which is the action a dealer pays to be alerted about. Full card specification in [../product/card-system.md](../product/card-system.md).

**Response counts** — "4 dealers responded" — appear once there is activity. They signal liveness to buyers and competition to dealers.

---

## A request listing

| Field | Notes |
| --- | --- |
| What they want | Plain words, plus whichever specifications matter |
| Category | Determines the specification set |
| Budget | Required — it is what makes the lead qualified |
| Location | Area |
| Trade-in | Optional. Present, it becomes swap demand. |
| Dealer-offers consent | Default on |
| Photos | None — they do not own the thing |

Requests are the cheapest thing to post on the platform: one screen, under thirty seconds. That is deliberate, because volume of demand is what makes the dealer product worth buying.

---

## The dealer lead product

### What dealers pay for: speed

In trade-in and second-hand deals, **the first credible offer usually wins.** A dealer who learns about a request an hour late has lost it. So the product is not access to the information — browsing the Wanted feed is free for everyone — it is **being told immediately**.

| Free for everyone | Paid for dealers |
| --- | --- |
| Browsing the Wanted feed | Immediate alerts on matching demand |
| Revealing a number, rate-limited | Unlimited reveals |
| Responding to a request | Match highlighting against their own stock |

This structure matters: the paid product does not take anything away from free users. It adds speed and tooling for people whose time is worth money.

### Why it earns before there is traffic

The value of a lead comes from the quality of that single lead, not from how many visitors the platform has. A dealer who closes one deal a month from it is well ahead on a ten-dollar subscription. This is why lead alerts are the first product to test — unlike sponsored slots, which need volume.

See [../business/monetization.md](../business/monetization.md).

---

## Matching

A dealer's stock matches demand when:

- The category matches
- Every stated minimum is met or exceeded — "16GB" means 16 or more
- Where a model is named, the item is that model or a stated equivalent
- The dealer's price is within reach of the budget, or of the trade-in value plus offered cash

**Be slightly generous rather than strict.** A dealer would rather dismiss a marginal lead than never see a real one. Precision can improve as listing data accumulates.

### What the dealer sees

```ascii
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

**The match line is what turns a notification into a tool.** It closes the gap between "somebody wants something" and "here is what you should offer them." When nothing matches, say so plainly and offer "I can source this" — dealers routinely source to order, and that is still a lead.

---

## Consent — the thing that keeps this honest

Every listing carries a **dealer-offers** toggle, set during posting and changeable afterwards. Default on.

| Setting | Effect |
| --- | --- |
| **On** | The listing may appear in dealer lead feeds; dealers may send offers |
| **Off** | The listing stays fully public and contactable but never enters a dealer lead feed |

**Why it exists:** it stops the student side of the platform from feeling like a dealer channel, it turns dealer contact into a choice rather than a surprise, and it makes the paid product defensible — dealers are only ever approaching people who agreed to it.

Consent is checked at the point leads are generated, not filtered later in the client.

---

## Offers

An offer against demand carries: the item being offered, the cash proposed, and a short message.

**Not binding, not escrowed.** A structured way to start a conversation, after which the two parties settle it themselves. Consistent with the contact-broker model.

The requester sees offers on their listing and in their account hub. Offer counts appear publicly as a liveness signal.

---

## The balance problem

Dealers respond far more than individuals do. Left unmanaged, the Wanted feed becomes a place where students are approached by shops rather than a two-sided market.

Mitigations:

- The consent toggle, defaulting on but visible and easy to change
- A cap on how many offers a single dealer can send against one request
- Response counts shown, so a requester can see they are not being swarmed
- Offers are surfaced as a list the requester reviews, not as a stream of messages

---

## Definition of done

- [ ] Request listings postable in one screen
- [ ] Swap listings appearing as demand with their trade-in strip
- [ ] Wanted feed at top-level navigation with category filters
- [ ] "I have this" as the single primary action on every demand card
- [ ] Matching against dealer stock with explicit match naming
- [ ] Immediate alerts to matching dealers with an active subscription
- [ ] Dealer-offers consent respected at generation time
- [ ] Offers sendable, visible to the requester, counted publicly
- [ ] Per-dealer offer cap per request
- [ ] "I can source this" path when nothing matches

---

## Related documentation

- [Swap & Top](./swap-and-top.md) — the higher-value source of demand
- [Card System](../product/card-system.md) — the Wanted card
- [Dealer Console](../product/dealer-console.md) — where leads are worked
- [Notifications](./notifications.md) — how alerts are delivered
- [Monetization](../business/monetization.md) — pricing and earning timeline
- [The Wedge](../business/the-wedge.md) — why this is the structural difference

---

**Last Updated:** September 2026
