# Contact & Reveals

## How people reach each other, and the metric it produces

**Status:** Decided
**Read this if:** you are building contact, privacy, rate limiting, or analytics. This mechanic is small and disproportionately important.

---

## Overview

The platform is a contact broker. Introducing two people **is** the product, so the moment of contact is the single most important event in the system.

It is deliberately designed as a **button, not printed text**.

```ascii
THE REVEAL:
┌───────────────────────────────────────┐
│  Listing detail                       │
│  ...                                  │
├───────────────────────────────────────┤
│  [ 📞 Show number ]          [ 💬 ]   │  ← primary action
│  No account needed · meet in public   │
└───────────────────────────────────────┘
              │
              │  tap
              ▼
   ┌──────────────────────────────┐
   │ Number shown                  │
   │ Event recorded:               │
   │   • which listing             │
   │   • which device (hashed)     │
   │   • when                      │
   └──────────────────────────────┘
```

---

## Why a button and not text on the page

Three reasons, each independently sufficient.

### 1. Attribution — the reveal is the product metric

Without it we cannot know whether the platform works, and neither can the seller. Printing a number on a page produces no signal at all.

### 2. Seller retention

> *"Your listing got 47 contacts this week."*

This is the single most effective reason a seller returns, keeps posting, and eventually pays for promotion. **You cannot monetise what you cannot measure**, and you cannot sell a dealer a sponsored slot without being able to say what it delivered.

### 3. Scraper defence

Without a gate, every seller's phone number is harvested in an afternoon and becomes someone else's lead list.

---

## The rule it must not break

**A guest can reveal a number without an account.** One tap, no sign-up, no email capture, no interstitial.

This is [principles.md](./principles.md) rule 1, and it is the rule most likely to be eroded by reasonable-sounding requests. The reveal gate exists for measurement and abuse control, never as a growth tactic.

---

## Rate limiting

Per device, not per account, since most revealers have no account.

| Viewer | Limit |
| --- | --- |
| Guest | A modest daily allowance — generous enough that a normal buyer never notices |
| Signed-in user | Higher allowance |
| Dealer with lead alerts | Unlimited |

**Why unlimited for paying dealers:** a dealer working volume will hit the cap that exists to stop scraping. Lifting it is a genuine benefit of the paid product, which is neat — the abuse control and the upsell are the same mechanism.

When a limit is reached, the message explains it as abuse prevention and offers sign-in as the remedy. It never pretends the listing is unavailable.

---

## Where contact details live

**Not in the listing payload.** This was a real v1 defect: the public listing endpoint returned every seller's email address and phone number, unauthenticated, so the entire seller base could be scraped without logging in.

The rule: contact details are served by a **separate, rate-limited action** that records the event. They never appear in feed or listing responses, no matter how convenient that would be for the client.

---

## Contact channels

Set by the poster during the posting flow. At least one required.

| Channel | Notes |
| --- | --- |
| WhatsApp | The default and by far the most used |
| Phone call | Common |
| SMS | Less common, kept for completeness |

The listing detail screen shows a primary **Show number** action plus a secondary message action where the poster has enabled a messaging channel.

---

## Dealer offers

A separate consent, set at posting time and changeable later:

> **Let dealers send me offers** — default on

When enabled, the listing may be surfaced to dealers as a lead and dealers may send offers against it. When disabled, the listing is still public and contactable, but it does not appear in dealer lead feeds.

**Why it exists:** it keeps the student side of the platform from feeling like a dealer channel, and it gives the user a decision rather than a surprise. It also makes the lead product honest — dealers are only contacting people who accepted that.

---

## What gets recorded

Every reveal writes an event containing:

- Which listing
- Which device, as a hash — not an identity
- Whether the viewer was signed in, and their role
- Timestamp
- Whether the listing was in a sponsored or drop slot at the time

That last field is what makes it possible to say "sponsored listings got three times the contacts," which is how promotion gets sold with evidence rather than on a promise. See [../operations/metrics.md](../operations/metrics.md).

**Privacy stance:** device hashes, not identities. No cross-site tracking. Reveal counts shown to sellers are aggregate only — a seller never learns who looked.

### The reveal also starts the deal confirmation clock

Three days after a reveal, both parties are asked whether the deal went through. When both say yes it becomes a **confirmed deal**, which is the public trust signal for private sellers and the platform's only view of settlement.

This is why the reveal is worth recording as an event rather than incrementing a counter: it is the hook everything downstream hangs on. See [../features/deal-confirmation.md](../features/deal-confirmation.md).

---

## What sellers see

On their own listing, and in the account hub:

- Number of reveals, total and this week
- Views, for context — the ratio of views to reveals tells a seller whether the price is wrong
- For dealers, the same per item in the console stock list

This is the feedback loop that makes the platform feel worth using.

---

## Safety copy at the point of contact

Every reveal sits directly above a short line of guidance:

- Meet in public, or on campus
- Check the device is not locked before paying or swapping
- No account needed — stated to reassure, not to upsell

The placement matters. Safety advice buried in a help page is decoration; advice at the moment of decision is a control. See [trust-and-safety.md](./trust-and-safety.md).

---

## Definition of done

- [ ] A guest can reveal a number with one tap, no account
- [ ] Contact details never appear in any feed or listing response
- [ ] Every reveal is recorded with listing, hashed device, role, timestamp and slot type
- [ ] Rate limits apply per device, with a clear message and a sign-in remedy
- [ ] Paying dealers are exempt from the cap
- [ ] Sellers can see their own reveal counts
- [ ] Safety guidance appears immediately adjacent to the reveal action
- [ ] The dealer-offers consent is respected everywhere leads are generated

---

## Related documentation

- [Principles](./principles.md) — rules 1 and 6
- [Post Flow](./post-flow.md) — where contact preferences are set
- [Trust & Safety](./trust-and-safety.md) — the guidance shown at contact
- [Wanted & Leads](../features/wanted-and-leads.md) — how consent shapes the lead product
- [Deal Confirmation](../features/deal-confirmation.md) — what a reveal triggers three days later
- [Metrics](../operations/metrics.md) — what reveal data is used for
- [v1 Lessons](../reference/v1-lessons.md) — the contact leak this replaces

---

**Last Updated:** September 2026
