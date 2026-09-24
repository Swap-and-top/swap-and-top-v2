# Trust & Safety

## Verification, stolen devices, safe meeting, and making discipline mean something

**Status:** Decided
**Read this if:** you are building verification, reporting, or anything a user's safety depends on.

---

## Overview

In a contact-broker marketplace for used gadgets, **trust is the product**. Two strangers meet with a device and cash, and the platform's only contribution is having introduced them. Everything here exists to make that introduction safer and to give the platform a reason to be preferred over an anonymous Facebook listing.

Three distinct problems:

1. **Identity** — making suspension meaningful
2. **Stolen and locked devices** — the specific fraud risk in this category
3. **The meeting** — where the actual risk to a person lives

---

## 1. Identity: phone number, not email

**The problem with email:** a suspended user registers again with a fresh address in thirty seconds. Discipline becomes theatre and the moderation system is decoration.

**The decision:** phone number is the identity anchor. Verified by one-time code at registration.

**Why it works here:** SIM cards are registered against identity documents locally, and essentially everyone uses WhatsApp, so a phone number is both scarce and universal. Evading a ban costs real money and effort rather than thirty seconds.

This has a technical consequence — the authentication system must support phone and one-time code as a first-class method, not as an afterthought. See [../architecture/auth-and-identity.md](../architecture/auth-and-identity.md).

---

## 2. Verification tiers

Two tiers, not three. The governing rule: **verify businesses, not people.**

```ascii
VERIFICATION:
┌────────────────────┬───────────────┬───────────────────────────┐
│       TIER         │     COST      │      WHAT IT UNLOCKS      │
├────────────────────┼───────────────┼───────────────────────────┤
│ Phone verified     │ Free, auto    │ Posting at all            │
│                    │               │ Raises the listing cap    │
│                    │               │ NOT shown as a badge      │
├────────────────────┼───────────────┼───────────────────────────┤
│ Verified dealer    │ Paid, manual  │ Shopfront, badge, stock   │
│                    │ (business     │ count, console            │
│                    │  registration)│                           │
└────────────────────┴───────────────┴───────────────────────────┘
```

Phone verification is required but **not displayed**. A badge that everyone holds is noise.

### Why there is no "verified student" tier

An earlier version of this specification had one. It was removed, and the reasoning is worth keeping so it is not reintroduced:

- **It duplicated phone verification.** Its only structural job was making identity scarce, and the phone anchor already does that.
- **It is an occupation marker, not a trust signal.** A mechanic of forty-five selling a laptop is not less trustworthy than a student of twenty. The platform is nationwide by design, so a badge that only a small fraction of the population can ever obtain creates a two-tier system in which most legitimate users are permanently second class.
- **It created a data-protection liability for very little.** Verifying students means collecting identity documents — photograph, full name, institution, student number — and accepting the retention and protection obligations that follow under Zimbabwe's Cyber and Data Protection Act. That is a poor trade for a weak signal.
- **It arguably reduced safety.** A public listing reading *"first name · verified student · named campus · area"* narrows a young person's identity for a stranger they are about to meet in person. It sat in this document as a safety feature while working against one.

Recorded as a reversal in [../reference/decisions-log.md](../reference/decisions-log.md), decision P11.

### The badge must mean something specific

A badge that means "paid us a dollar" gets discovered and destroys the trust it was meant to create. Verified dealer is the only badge, and it asserts something checkable: a registered business stands behind this listing.

### What replaces it: trust from behaviour

Status says who someone is. Behaviour says how they have acted. The second is both fairer and more useful.

| Signal | Where it comes from |
| --- | --- |
| **Confirmed deals** | Both parties confirming a deal completed — see [../features/deal-confirmation.md](../features/deal-confirmation.md) |
| **Typical reply time** | Measured from contact to response |
| **Member since** | Account age |
| **Clean record** | No upheld reports |

Anyone can earn all four regardless of who they are, what they do, or where they study. That is the point.

### Business verification, kept realistic

Physical address verification does not scale for a small team. At launch: **business registration number plus verified phone plus a shopfront.** Site visits can become a higher tier later, once someone's afternoon is worth spending on it.

---

## 3. Stolen and locked devices

The specific fraud risk in this category. A gadget swap market on a university campus is an easy place to move a stolen phone or laptop.

### Mitigations, in order of effectiveness

| Mitigation | How |
| --- | --- |
| **Scarce identity** | Phone-anchored accounts make a seller traceable and make a ban cost something |
| **Guidance at the point of contact** | Check the device is not activation-locked before any money changes hands |
| **Reporting** | One tap on any listing, with "possibly stolen" as an explicit reason |
| **Duplicate image detection** | The same photograph appearing across accounts is a strong signal |
| **Price anomaly flags** | A device far below typical price for its specification warrants a look |
| **New account limits** | Lower listing caps and tighter review for accounts under a certain age |
| **Physical check point** | Much later — see below |

### The guidance that matters most

Displayed adjacent to every contact reveal and every swap offer, not buried in a help page:

- Meet in public, or on campus
- Check the device is not iCloud- or Google-locked before paying or swapping
- Do not send money before seeing the device

Advice at the moment of decision is a control. The same advice in a help centre is decoration.

---

## 4. The meeting

Where the real risk to a person lives, and the area where the platform will eventually have its strongest advantage.

**Now:** guidance, public and on-campus meeting suggestions, and the fact that a campus is a relatively high-trust environment with a bounded community.

**Later — the swap point:** a counter where two people meet to complete a swap safely and the device is checked for locks and theft.

This is the **only genuinely durable moat** in the plan. Facebook Marketplace structurally cannot build physical trust infrastructure. It needs roughly 20 square metres and, critically, **staff on the ground** — so it sits on the far side of finding a Zimbabwe operator. The family's Waterfalls property is the eventual home for it, though 4,000 square metres is far more space than gadgets require; that scale becomes relevant with larger goods and delivery.

See [roadmap.md](./roadmap.md).

---

## 5. Reporting and discipline

### Report, then review — not review, then publish

Listings go live immediately. Moderation is **report-driven**.

**Why:** a human gate on every post means nothing goes live whenever the operator is unavailable. With a small team and a founder relocating, pre-approval is an outage waiting to happen. Full reasoning in [../features/moderation.md](../features/moderation.md).

### The discipline pipeline

Carried over from v1, where it was the most substantial work done and remains genuinely valuable:

```ascii
Report ──► Review ──► Disciplinary action ──► Appeal
                          │
                          ├─ warning
                          ├─ listing removal
                          ├─ suspension (time-limited)
                          └─ ban
```

A violation matrix maps offence types and repetition to proportionate outcomes, so decisions are consistent and defensible. Moderators claim cases to avoid duplicated work. Every action is attributable and appealable.

### Where discipline earns its keep

The flaking problem in a contact-broker marketplace — someone agrees a deal and disappears, or a bidder later wins an auction and never pays — is handled here rather than by holding people's money. That is the whole reason the platform can stay out of payments: **accountability replaces escrow.**

This is why scarce identity matters so much. Accountability without scarce identity is nothing.

---

## 6. Listing decay

Stale listings destroy buyer trust faster than almost anything, and stale pages hurt search rankings.

- Listings **expire after 30 days**
- Before expiry, the poster gets a nudge asking whether it is still available
- The nudge doubles as a re-engagement loop
- Expired listings leave the feed and the sitemap

---

## What is deliberately not done

| Not doing | Why |
| --- | --- |
| Holding money in escrow | Different business entirely; drags in refunds, disputes, chargebacks |
| Verifying every device | Does not scale without a physical location and staff |
| Identity documents for ordinary users | Too much friction, a data-protection liability, and phone is enough |
| Verifying anyone's occupation or student status | Not the platform's business, and a poor trust signal — see above |
| Pre-approving every listing | Creates an outage whenever nobody is available to approve |
| Buying a background-check service | No budget, and phone-anchored identity covers most of the value |

---

## Related documentation

- [Target Users](../business/target-users.md) — verification tiers per group
- [Contact & Reveals](./contact-and-reveals.md) — where safety guidance appears
- [Deal Confirmation](../features/deal-confirmation.md) — the behavioural trust signal
- [Moderation](../features/moderation.md) — the reporting and discipline system in detail
- [Auth & Identity](../architecture/auth-and-identity.md) — phone-anchored accounts
- [Roadmap](./roadmap.md) — when the swap point becomes real

---

**Last Updated:** September 2026
