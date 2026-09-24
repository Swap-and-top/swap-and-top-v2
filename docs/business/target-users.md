# Target Users

## The four groups the platform serves, and what each one actually wants

**Status:** Decided
**Read this if:** you are designing a screen, writing copy, or deciding who a feature is for.

---

## Overview

Four groups, with very different needs and very different willingness to pay. The design tension throughout is that the group who pays is not the group who creates the atmosphere.

```ascii
WHO DOES WHAT:
┌──────────────┬──────────────────┬──────────────────┬─────────────┐
│    GROUP     │  WHAT THEY GIVE  │  WHAT THEY WANT  │  DO THEY PAY│
├──────────────┼──────────────────┼──────────────────┼─────────────┤
│ Guest buyer  │ Traffic, demand  │ Find a thing fast│     No      │
│ Student      │ Swap posts,      │ Better gadget,   │     No      │
│  / private   │ sale posts,      │ no cash to spare │             │
│   seller     │ requests         │                  │             │
│ Dealer       │ Stock, liquidity,│ Qualified leads,  │    YES      │
│              │ the answer to    │ visibility, a    │             │
│              │ most swap posts  │ way to run stock │             │
│ Staff        │ Moderation,      │ Tools that are   │     n/a     │
│ (mod/admin)  │ verification     │ fast to use      │             │
└──────────────┴──────────────────┴──────────────────┴─────────────┘
```

---

## 1. 🟢 Guest buyer — no account

The largest group by headcount and the one with the least patience.

**What they want:** to find a specific thing, see what it costs, and contact the seller. Nothing else.

**What they get without an account:**

- Browse the full feed
- Use search and all specification filters
- Open any listing
- Reveal a seller's phone number (rate-limited per device)
- Share a listing

**What requires an account:** posting, saving, making offers, bidding later on.

**Design consequence:** no sign-up wall anywhere on the browsing or contact path. This is the single hardest rule in the product and the one most likely to be eroded by well-meaning feature requests. See [../product/principles.md](../product/principles.md).

---

## 2. 🟡 Student / private seller

The first user base, and the source of the platform's character.

**Who they are:** university students to begin with, starting at the University of Zimbabwe. Young enough to care about having good gadgets, without the cash to buy new. Trading up is precisely their situation.

**Why a campus:** a marketplace does not need a big market, it needs a dense one. Thousands of people in a few square kilometres who already share WhatsApp groups, can meet in person the same day, and mostly want a better phone or laptop than they can afford.

**What they want:**

- Trade the thing they own towards the thing they want
- Sell something quickly for cash
- Say what they are looking for and have offers come to them
- Not get scammed, and not meet a stranger somewhere unsafe

**What they will pay:** effectively nothing. Spending power is thin and Facebook is free. Plan revenue as if this group contributes zero.

**Important structural limit:** students cannot fill each other's swaps. Almost everyone wants to trade **up**. A student-to-student match needs someone willing to trade **down** for cash, which is a much smaller group. This is why dealers must be present from day one — see [Dealers](#3--dealer) below and [../features/swap-and-top.md](../features/swap-and-top.md).

**Seasonality:** campus activity follows the academic calendar. Holidays and exam periods flatten it. Any test or launch should sit inside a single teaching term.

**Churn by design:** students graduate, so roughly a quarter of the base turns over each year. The other side of that is a fresh intake every year who need gadgets, which makes orientation week the best-timed acquisition moment available.

---

## 3. 🟠 Dealer

The only group that pays, and simultaneously the thing that makes swaps actually work.

**Who they are, in priority order:**

| Type | Why they matter |
| --- | --- |
| **Computer and laptop shops** | Highest ticket value, richest specifications, where our search advantage is widest |
| **Repair shops** | See devices constantly, already take trade-ins, sit on parts stock |
| **Phone shops** | Highest volume, most numerous |
| **Console and gaming sellers** | Smaller but passionate niche with real swap culture |

**What they want:**

- Buyers they cannot reach through their own WhatsApp list
- To be first to a trade-in opportunity, because the first credible offer usually wins
- A way to keep stock straight without paper
- To look trustworthy to a stranger

**Why they are the liquidity, not just the revenue:** a dealer is happy to trade *down*. They take the older device plus cash, hand over the better one from stock, and resell the trade-in. That is their business model, and it makes them the natural counterparty to the dominant direction of swap demand. Without them, a campus feed fills with trade-up requests nobody answers.

**What they will pay for:** see [monetization.md](./monetization.md). Briefly — lead alerts and a stock console earn immediately; sponsored placement only earns once traffic exists.

**Credibility note for sales:** the founder sold and repaired computers, and fielded swap requests directly. Dealer conversations are peer conversations, not cold pitches. Open with that.

---

## 4. 🔴 Staff — moderator, admin, super admin

Small internal group, but their tools decide whether the platform stays clean.

**What they want:** to clear a queue quickly on whatever device is to hand, and to not have to think about permissions.

**Key requirements:**

- Role hierarchy that actually cascades — a super admin must be able to do everything an admin can. This was broken in v1.
- Report-driven work, not pre-approval of everything. A human gate on every post means nothing goes live whenever the operator is unavailable.
- Every action attributable, for appeals.

See [../features/moderation.md](../features/moderation.md).

---

## Verification tiers

Identity is what makes suspension meaningful. If a banned user can register again with a fresh email in thirty seconds, discipline is theatre.

| Tier | How | Cost to user | What it unlocks |
| --- | --- | --- | --- |
| **Phone verified** | One-time code | Free, automatic | Posting at all; raises the soft listing cap. Not shown as a badge. |
| **Verified dealer** | Business registration plus verified phone | Paid | Shopfront, badge, stock count, console |

**Verify businesses, not people.** There is no student or occupation verification. A private seller's trust comes from behaviour instead — confirmed deals, reply time, account age, clean record. See [../features/deal-confirmation.md](../features/deal-confirmation.md).

Phone number is the identity anchor rather than email: SIMs are registered against ID locally, and everyone uses WhatsApp. See [../architecture/auth-and-identity.md](../architecture/auth-and-identity.md).

---

## Related documentation

- [The Wedge](./the-wedge.md) — why these groups would choose this over Facebook
- [Monetization](./monetization.md) — who pays and for what
- [Go To Market](./go-to-market.md) — how each group is acquired
- [Trust & Safety](../product/trust-and-safety.md) — verification and safe meeting
- [Dealer Console](../product/dealer-console.md) — the dealer-facing surface

---

**Last Updated:** September 2026
