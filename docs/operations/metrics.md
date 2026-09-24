# Metrics

## What gets measured, why, and what good looks like

**Status:** Decided
**Read this if:** you are building analytics, or deciding whether the platform is working.

---

## Overview

Measurement is a feature, not a later addition. v1 had **no analytics of any kind** after three years of building, which meant there was no way to know whether anything worked — and no way to sell promotion, since there was no evidence of what it delivered.

Every metric below has a named purpose. Nothing is collected out of habit.

---

## The four questions

Everything reduces to four questions, in order of importance.

```ascii
1. WILL DEALERS PAY?          ← decides whether there is a business
        │
2. DO LISTINGS GET ANSWERED?  ← decides whether the marketplace is alive
        │
3. DO PEOPLE COME BACK?       ← decides whether it can grow without spend
        │
4. IS SUPPLY GROWING?         ← decides whether it compounds
```

---

## 1. Will dealers pay?

The only metric that decides the business.

| Metric | Definition | Good |
| --- | --- | --- |
| **Paying dealers** | Dealers who have paid anything, ever | 5+ at the end of validation |
| Paying dealer retention | Paid in consecutive months | Above half after three months |
| Revenue per dealer | Monthly, per paying dealer | Rising as products stack |
| Which product they chose | Lead alerts, console, sponsored slots, drop slots | Tells you what the business actually is |

That last one matters more than the totals. If dealers pay for the console rather than for leads, the business is a software business with a marketplace attached, and the roadmap changes accordingly. See [validation-test.md](./validation-test.md).

---

## 2. Do listings get answered?

The clearest measure of whether the marketplace is alive. A feed of unanswered posts empties out within a fortnight.

| Metric | Definition | Good |
| --- | --- | --- |
| **Response rate** | Share of listings receiving at least one reveal or offer within 7 days | 50%+ |
| Time to first response | Median hours from publish to first contact | Under 24 hours |
| Reveals per listing | Distribution, not just the average | A long tail is fine; a floor of zero is not |
| Offers per swap listing | Offers received on swap posts | Rising |
| Unanswered swap rate | Swap posts with no response after 7 days | Falling |

### Confirmed deals — the closest thing to settlement

As a contact broker the platform cannot see money change hands, so reveals were previously the last observable event. Mutual deal confirmation opens a partial window. See [../features/deal-confirmation.md](../features/deal-confirmation.md).

| Metric | Definition | Good |
| --- | --- | --- |
| **Confirmed deals** | Deals both parties confirmed completed | Growing; treat the number as a floor |
| Confirmation rate | Share of reveals producing a mutual confirmation | A minority is expected. Watch the trend, not the level. |
| Prompt response rate | Share of prompts answered at all | If very low, the prompt's timing or wording is wrong |
| Confirmed deals per dealer | Per paying dealer, per month | **The renewal number.** Far stronger than reveals alone. |

**Read these as a floor, never a total.** Prompts lapse, and only deals that went well enough for both parties to bother answering get counted. The honest phrasing to a dealer is *"at least twelve confirmed deals"*.

### The trade-up ratio — a diagnostic

| Metric | Why |
| --- | --- |
| **Trade-up versus trade-down posts** | Almost everyone wants to trade up. Every unanswered trade-up post is one only a dealer can fill. |

This number tells you directly how much dealer capacity is needed. If trade-ups dominate heavily and the unanswered rate is high, the answer is not more students — it is more dealers. See [../features/swap-and-top.md](../features/swap-and-top.md).

---

## 3. Do people come back?

Whether deal-browsing has become a habit.

| Metric | Definition | Good |
| --- | --- | --- |
| **7-day return rate** | Share of visitors returning within a week | 20%+, adjust once a baseline exists |
| Visits per returning visitor per week | Frequency | 2+ |
| Return rate on drop days | Compared with ordinary days | Visibly higher — this is what proves the drop works |
| Sessions per week | Overall volume | Growing |

**Important tooling consequence:** measuring return visits requires analytics that can recognise a returning visitor. Fully cookieless analytics cannot answer this. Since "do people come back" is one of the four questions being tested, the analytics choice must support retention analysis. Disclose it in the privacy policy.

---

## 4. Is supply growing?

Whether the catalogue compounds without being pushed.

| Metric | Definition | Good |
| --- | --- | --- |
| **Organic signups** | Accounts not personally recruited | Growing week on week |
| Active listings | Live listings at any moment | Growing |
| Listings per active seller | Depth per seller | 2+ |
| Repeat posting rate | Sellers posting again within 30 days | 30%+ |
| Dealer stock coverage | Live listings from dealers | Enough to answer the trade-up demand |

The first row is the one that distinguishes real growth from hand-cranked growth. Everything else can be faked by the founder doing data entry.

---

## The reveal event — the metric that does the most work

One event, recorded on every contact reveal, serves four purposes at once:

```ascii
        ┌──────────────────────┐
        │   REVEAL EVENT       │
        │  listing · device    │
        │  role · time · slot  │
        └──────────┬───────────┘
                   │
    ┌──────────┬───┴────┬────────────┐
    ▼          ▼        ▼            ▼
 SELLER     PROOF    RESPONSE    ABUSE
RETENTION   FOR      RATE        CONTROL
            PROMOTION
"your       "sponsored  "did this   rate
 listing     got 3x     listing    limiting
 got 47"     the        get any     by device
             contacts"  answer?"
```

The **slot type at the moment of reveal** — organic, sponsored, or drop — is the field that makes promotion sellable with evidence rather than on a promise. Without it, a sponsored slot can only be sold as a hope.

See [../product/contact-and-reveals.md](../product/contact-and-reveals.md).

---

## Supporting metrics

Useful, but they do not decide anything.

| Area | Metrics |
| --- | --- |
| **Search** | Searches per session, share producing results, share of zero-result searches, most-used filters |
| **Sharing** | Listings shared, visits arriving from a shared link — the WhatsApp channel's real size |
| **Search engines** | Indexed listing count, organic entries, queries landing on listings |
| **Moderation** | Reports per hundred listings, time to resolve, share of reports upheld, appeal overturn rate |
| **Performance** | Feed load time on mobile data, image payload per feed page |
| **Operations** | Job queue depth, failure count, report queue depth |

---

## Vanity metrics to ignore

Stated explicitly, because they are tempting and they mislead.

| Ignore | Why |
| --- | --- |
| Total registered accounts | Inflated by anyone who signed up once and never returned |
| Page views | A guest scrolling twice is not twice the value |
| Total listings ever created | Only live listings matter |
| Followers on a shop | No relationship to sales |
| App downloads, later | Installation is not usage |

---

## What must be instrumented from day one

Not negotiable, because the validation test cannot run without them.

- [ ] Reveal events with listing, device hash, role, timestamp and slot type
- [ ] Deal confirmations, with each side's answer and the resulting state
- [ ] Listing views
- [ ] Response rate — derivable from reveals and offers per listing
- [ ] Returning visitors, which requires retention-capable analytics
- [ ] Listing creation, with the recruitment source recorded
- [ ] Trade-up versus trade-down direction on every swap
- [ ] Payments, with which product was bought

Everything else can follow.

---

## Reporting cadence

| Frequency | Audience | Contents |
| --- | --- | --- |
| **Weekly** | Founder | The four questions, one number each |
| **Weekly** | Sellers with activity | Their reveal summary |
| **Continuous** | Dealers | Reveals per item, and confirmed deals, in the console |
| **Monthly** | Partners | Revenue, paying dealers, growth |

The weekly four-number check is the discipline that matters. If it takes more than a glance, it will not get done.

---

## Related documentation

- [Validation Test](./validation-test.md) — the pass thresholds these feed
- [Contact & Reveals](../product/contact-and-reveals.md) — the reveal event
- [Deal Confirmation](../features/deal-confirmation.md) — the settlement window
- [Monetization](../business/monetization.md) — selling promotion with evidence
- [Swap & Top](../features/swap-and-top.md) — the trade-up ratio
- [Deployment & Hosting](../architecture/deployment-and-hosting.md) — analytics and monitoring setup

---

**Last Updated:** September 2026
