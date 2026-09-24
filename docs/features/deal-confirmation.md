# Deal Confirmation

## Mutual confirmation that a deal completed — the platform's only window into settlement

**Status:** Decided
**Read this if:** you are building trust signals, metrics, or the dealer sales story. This replaced student verification.

---

## Overview

A few days after someone reveals a seller's number, both parties are asked one question:

> **Did the deal go through?**

When both say yes, it counts as a **confirmed deal**. That count becomes a public trust signal on the seller's profile and shopfront.

It is deliberately small: one question, three answers, no free text, no stars.

---

## Why it exists

Two jobs, both of which the removed student badge was failing to do.

### 1. A trust signal anyone can earn

The platform previously proposed a "verified student" badge as its trust signal for private sellers. That was a status marker: it described who someone was rather than how they had behaved, it only reached a small fraction of a nationwide user base, and it carried a data-protection cost for a weak signal. See [../product/trust-and-safety.md](../product/trust-and-safety.md).

Confirmed deals are earnable by anyone — any age, any occupation, anywhere in the country.

### 2. The first view of whether anything actually happens

This is the bigger gain, and it closes a real hole.

As a contact broker the platform cannot see settlement. Money changes hands off-platform, so the contact reveal has been the last observable event — which means the honest answer to *"does this marketplace produce sales?"* has been **we do not know**.

```ascii
WHAT THE PLATFORM CAN SEE:

  listing → view → reveal │ ??? │
  ────────────────────────┴─────┴──────────
   observable              invisible
                           (meeting, negotiation,
                            money, handover)

WITH DEAL CONFIRMATION:

  listing → view → reveal → [both confirm] → confirmed deal
  ─────────────────────────────────────────────────────────
   observable                    partially observable
```

It is partial and self-reported, but it is the difference between no signal and a directional one.

### 3. A much better dealer pitch

> *"47 people saw your number"* — interesting.
> *"We produced 12 confirmed deals for you last month"* — a renewal.

The whole dealer revenue argument rests on demonstrating value. This is the strongest number available for that, and it comes almost free. See [../business/monetization.md](../business/monetization.md).

---

## The flow

```ascii
Reveal happens
     │
     │  wait 3 days
     ▼
Both parties prompted (in-app + WhatsApp)
     │
     ├──► Buyer:  Yes / No / Not yet
     └──► Seller: Yes / No / Not yet
            │
            ▼
   ┌────────────────────────────────────┐
   │ BOTH YES   → confirmed deal counted │
   │ ONE YES    → nothing counted, waits  │
   │ ANY NO     → nothing counted, closed │
   │ NO REPLY   → lapses after 14 days    │
   └────────────────────────────────────┘
```

### Timing

| Event | When |
| --- | --- |
| Prompt sent | 3 days after the reveal |
| "Not yet" defers | Re-asks once after a further 4 days |
| Lapses | 14 days after the reveal, silently |

Three days is early enough that the deal is still memorable and late enough that it has probably concluded.

### Answers

Three options only:

| Answer | Meaning |
| --- | --- |
| **Yes, we completed it** | Counts, once the other side agrees |
| **No, it did not happen** | Closes the prompt. No count, no consequence. |
| **Not yet** | Defers once |

---

## It is not a complaint channel

Important, and easy to get wrong.

A "no" means **no deal happened**. It does not mean anyone behaved badly — the buyer may simply have changed their mind, or bought elsewhere. So a "no" carries **no disciplinary consequence whatsoever.**

If something actually went wrong, that is a **report**, which is a separate mechanism with reasons, review and appeal. The confirmation screen links to it:

> *Something go wrong? Report this listing.*

Keeping these apart matters. A prompt that can punish people becomes something they avoid answering, and the response rate is the whole value.

---

## It is not a review system

Deliberately not built:

| Not built | Why |
| --- | --- |
| Star ratings | Need volume to mean anything; this platform will not have it for a long time |
| Written reviews | Need moderation, invite retaliation, and become a dispute surface |
| Public per-deal detail | Nobody needs to know what you bought |
| Seller replies to feedback | An argument surface |

A binary count is robust, cheap, needs no moderation, and cannot be review-bombed. When there is enough volume for ratings to be meaningful, revisit — recorded in [../product/roadmap.md](../product/roadmap.md).

---

## Privacy

- **Nobody sees an answer unless both parties confirm.** A "no" is never shown to the other side.
- Only the **aggregate count** is public. Never which listings, never who with, never when.
- A user can see their own confirmation history.

The screen states the first of those plainly, because otherwise people answer strategically rather than honestly.

---

## Where confirmed deals appear

| Surface | Display |
| --- | --- |
| Feed card footer | `Tarisai M. · 3 deals · 5h ago` |
| Listing detail, poster row | `3 confirmed deals · usually replies within 2h · joined Aug 2026` |
| Dealer shopfront | A trust statistic beside stock count and reply time |
| Account hub | Own count, in the statistics row |
| Dealer console | Per item and in total — the number that justifies renewal |
| Lead detail in the console | On the requester, so a dealer can see who they are dealing with |

New accounts show nothing rather than a zero. A zero reads as a warning; an absence reads as new, which is accurate.

---

## Anti-gaming

Low stakes, so proportionate measures rather than elaborate ones.

| Measure | Purpose |
| --- | --- |
| Both sides must confirm | Removes unilateral inflation |
| One confirmation per reveal pair per listing | No repeat counting of the same deal |
| Velocity limit per account per week | Blunts bulk fabrication |
| Repeat-pair detection | Two accounts confirming each other repeatedly is flagged for review |
| Confirmations require phone-verified accounts | Ties fabrication to a scarce identity |

Collusion between two real accounts is possible and largely pointless — the reward is a small number on a profile. If it ever becomes worth gaming, that is a good problem.

---

## Honest limits

Stated so nobody over-reads the number:

- **Response rates will be mediocre.** Many prompts will lapse. Expect a minority of reveals to produce a confirmation.
- **It only captures deals that went well enough** for both parties to bother answering.
- **It undercounts systematically.** A confirmed-deal count is a floor, not a total.
- **It is not accounting.** Use it as a directional signal and as a trust display, never as revenue or volume truth.

The right framing for dealers is *"at least 12 confirmed deals"*, not *"12 deals"*.

---

## Definition of done

- [ ] A prompt queued 3 days after every reveal, to both parties
- [ ] Delivered in-app and over WhatsApp, respecting notification preferences
- [ ] Three answers only; "not yet" defers once; lapses at 14 days
- [ ] Counted only when both sides confirm
- [ ] A "no" carries no disciplinary consequence and is never shown to the other party
- [ ] A visible link to the reporting flow for anything that went wrong
- [ ] Aggregate count public; per-deal detail never public
- [ ] Displayed on cards, listing detail, shopfront, account hub and console
- [ ] Absence rather than zero for new accounts
- [ ] Velocity limits and repeat-pair detection
- [ ] Confirmed deals available as a metric, per seller and per dealer

---

## Related documentation

- [Trust & Safety](../product/trust-and-safety.md) — why this replaced student verification
- [Contact & Reveals](../product/contact-and-reveals.md) — the reveal that triggers it
- [Notifications](./notifications.md) — the prompt
- [Metrics](../operations/metrics.md) — confirmed deals as a measure
- [Dealer Console](../product/dealer-console.md) — where dealers see it
- [Card System](../product/card-system.md) — the card footer
- [Decisions Log](../reference/decisions-log.md) — decisions P11 and P20

---

**Last Updated:** September 2026
