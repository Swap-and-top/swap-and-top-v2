# Validation Test

## The six-week dealer test, with pass and fail criteria

**Status:** Decided — do this before the rewrite
**Read this if:** you are planning what happens next. This comes before everything in [../architecture/](../architecture/).

---

## Overview

A time-boxed test on the **existing v1 application**, not on a rewrite. Its purpose is to answer one question cheaply:

> Will dealers pay?

It has a hard stop, defined pass criteria written down in advance, and a second deliverable that matters as much as the answer: **finding a Zimbabwe operator**.

---

## Why on the old app

The v1 application, with a short list of fixes, is good enough to find out whether anyone cares. Starting the rewrite first would spend three to six months before learning anything — and the founder's relocation window is the same length.

**The rewrite is the reward for passing, not the preparation for trying.**

---

## Why six weeks and not ninety days

The original plan was a twelve-week campus-and-dealer test. The relocation compresses it.

The compression is achieved by dropping the campus rollout, which needs sustained physical presence, and going **dealer-only**. That works because:

- Dealers paying was always the decisive signal
- The dealer side is far less labour-intensive than a campus programme
- Buyer demand can be driven through WhatsApp groups rather than a campus base

If the relocation turns out to be six months away rather than three, add the campus programme from [../business/go-to-market.md](../business/go-to-market.md) on top.

---

## Week 1–2 — make the existing app honest

Each of these is days of work, not weeks. The security items are not optional — the application is currently live with serious holes.

### Security and privacy

| Fix | Why |
| --- | --- |
| Add authentication and ownership checks to every unprotected write route | Any anonymous caller can currently edit or delete any listing, and issue a disciplinary action against a user |
| Remove seller email and phone from the public listing response | The entire seller base is scrapable without signing in |
| Add a reveal action that records the event and rate-limits per device | Needed for both privacy and measurement |
| Fix route ordering, and make role checks respect the hierarchy | Several administrative endpoints are currently unreachable, and a super admin is refused on admin routes |

### Make the product work

| Fix | Why |
| --- | --- |
| Wire up search, and correct the backend filter to target the owned item | The search box currently does nothing, and the backend filter would return nothing even if called |
| Restore the discarded processor field | The most important laptop specification is currently thrown away on save |
| Add pagination | The feed currently stops at ten listings, permanently |
| Auto-approve listings; take down on report | Nothing goes live while nobody is available to approve |
| Add link previews for shared listings | Every WhatsApp share is currently wasted |
| Make the promotion flag actually affect ordering | The field exists and nothing reads it |

### Make it measurable

| Fix | Why |
| --- | --- |
| Add analytics that can report returning visitors | Cookieless analytics cannot answer whether people come back, which is one of the things being tested |
| Add the Wanted feed and dealer cards | The lead product needs somewhere to live |

---

## Week 3–6 — dealer visits

### Who to visit

In priority order: **computer and laptop shops**, then **repair shops**, then phone shops, then console sellers. Target 10–15 conversations.

Computer and repair shops first because the ticket value is higher, the specifications are richer, and the search advantage is widest there.

### How to open

> *"I used to sell and repair computers. People kept asking me if I'd do swap deals and I never had a good way to handle it. That's what this is."*

This is a peer conversation, not a cold pitch. Use it.

### What to do in the shop

1. **Open the Wanted feed, filtered to what they sell.** *"These people posted this week looking for what you have. Here's what each is trading in and how much cash they'll add."*
2. *"Right now they're ringing round town or scrolling Facebook. I can send them to you first."*
3. **Show their shopfront.** *"This is how your shop looks to a buyer."*
4. **Take their stock list.** *"Send it to me and I'll load it. Costs you nothing."*
5. **Show the console as a mockup**, said plainly as a mockup. Do not build it yet.

### Test both revenue hypotheses in every conversation

| Question | Tests |
| --- | --- |
| *"Would you pay to be told first when someone wants what you stock?"* | Lead alerts |
| *"Separately — how do you track your stock and trade-ins today?"* | The dealer console |

The second question is the one most likely to produce a yes, and it is the better business. Ask it every time.

### Buyer demand

Share listings into WhatsApp groups. This is the whole acquisition channel for the test, which is why link previews are on the week 1–2 list.

---

## Week 4 onward — ask for money

Do not wait until the end.

- **Week 4:** first ask. $10 a month for lead alerts, or $15–30 for the stock system.
- **Collection is manual.** Mobile money to a number, then a human flips the flag in the admin tools. No payment engineering. See [payments-and-invoicing.md](./payments-and-invoicing.md).
- **Sponsored slots stay free** during the test, while reveal data accumulates. They get sold later with evidence.

---

## Throughout — find the operator

**This is a deliverable, not a hope.**

The founder relocates within three to six months. Swap & Top's only advantage is local presence. Without someone on the ground, it stops regardless of how the test goes.

Likely candidates: one of the sharper dealers, a strong campus ambassador, or the existing API collaborator. Assess them during the test, not afterwards.

---

## The pass bar — write it down before starting

Suggested thresholds. Set your own if you prefer, but set them **before day one**, because the temptation to move the goalposts on day eighty-nine is real.

| Signal | Pass |
| --- | --- |
| Active listings from real dealers | 100+ |
| Listings that get at least one response within 7 days | 50%+ |
| Visitors returning within 7 days | 20%+ |
| Signups not personally recruited | Growing week on week |
| **Dealers who have paid anything** | **5+** |

### Which of these actually decides it

The last row. If dealers who have seen real leads for a month will not pay five dollars, the business is not there, and no rewrite, no auction feature and no amount of polish changes that.

The others tell you *why* a failure happened, which is useful, but they do not overturn the verdict.

---

## Outcomes and what each one means

| Outcome | What it means | What to do |
| --- | --- | --- |
| **5+ dealers paying, operator found** | The thesis holds | Swap & Top becomes a company. Begin the rewrite per [../product/roadmap.md](../product/roadmap.md). |
| **Dealers pay for the console, not for leads** | The software is the business; the marketplace is a feature | Build the console as a Greta Works Digital product. Better outcome than it looks — recurring business revenue, works from anywhere. |
| **Dealers pay for nothing** | The revenue thesis is dead | Shelve it. Six weeks spent, not three more years. |
| **Passes but no operator** | Cannot be run remotely | Keep it alive minimally, or shelve until an operator exists. Do not attempt to run it from abroad. |

The second row is the most likely good outcome. Treat it as a pass, not a consolation.

---

## What not to build during the test

| Not now | Why |
| --- | --- |
| The rewrite | It is the reward for passing |
| The dealer console | Show a mockup; build only if dealers ask for it |
| Auctions | They need a crowd |
| A native app | Nobody installs an app for an empty marketplace |
| Payment integration | Mobile money and a manual flag are enough |
| Subscription tiers | One price, asked for directly |

---

## Related documentation

- [Roadmap](../product/roadmap.md) — this is Phase 0
- [Go To Market](../business/go-to-market.md) — the fuller campus version
- [Monetization](../business/monetization.md) — what is being sold and at what price
- [Metrics](./metrics.md) — how each signal is measured
- [Company Structure](../business/company-structure.md) — the operator gap
- [v1 Lessons](../reference/v1-lessons.md) — details of every fix listed above

---

**Last Updated:** September 2026
