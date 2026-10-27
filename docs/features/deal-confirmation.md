# Deal Confirmation

## Mutual confirmation that a deal completed — the platform's only window into settlement

**Status:** Decided
**Read this if:** you are building trust signals, metrics, or the dealer sales story. This replaced student verification.

---

## Overview

A few days after an offer is accepted, or after a signed in user reveals someone's number, the people involved are asked one question:

> **Did the deal go through?**

When both say yes, it counts as a **confirmed deal**. That count becomes a public trust signal on both people's profiles, and on a shopfront.

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

Two events start a deal check. Both are about one listing and two people the platform knows.

### What starts it, and who is asked

| Trigger | Who is asked first | Who is asked next |
| --- | --- | --- |
| **An offer is accepted** | Both: the person who made the offer and the listing's owner | Nobody else |
| **A signed in user reveals a number** | Only the person who revealed it | The listing's owner, and only if the revealer says yes |
| **A guest reveals a number** | Nobody | Nobody. It still counts as a reveal |

A listing whose poster keeps their details back until they accept an offer has no reveals, so its deal checks come only from accepted offers.

```ascii
ACCEPTED OFFER:

  Offer accepted
       │  wait 3 days
       ▼
  Both asked ──► Offerer: Yes / No / Not yet
             └─► Owner:   Yes / No / Not yet


NUMBER REVEAL (signed in):

  Reveal
     │  wait 3 days
     ▼
  Revealer asked: "You got Kopje Computers' number for the
                   ThinkPad T480. Did the deal go through?"
     │
     ├── No / no reply ──► closed or lapsed. The owner never hears of it.
     │
     └── Yes ──► Owner asked: "Tarisai M. got your number and says
                               the deal went through. Is that right?"
```

### Why it works this way

- **A reveal is weak intent.** Most people who reveal a number never call, or call and walk away. Asking the owner after every reveal would bury a busy seller in questions about strangers, and people stop answering prompts that are mostly noise. The response rate is the whole value, so the owner is asked only once the other person says a deal happened.
- **The owner never learns who merely looked.** A seller is told nothing about a reveal ([contact-and-reveals.md](../product/contact-and-reveals.md)). They hear a name only when that person says they did a deal with them, by which point the two have been in contact anyway.
- **A guest cannot be asked.** Guests reveal without an account, so there is nobody to prompt. Asking them to sign in first would break the rule that a reveal needs no account.
- **An accepted offer is the strongest signal.** Both people are known, both agreed terms, and the acceptance gave each the other's contact details. So both are asked at once.

### One check per person per listing

Two people get at most one deal check per listing between them, however many times one revealed the other's number, and whether or not there was also an offer. An accepted offer takes priority: if a reveal check is already open for the same pair and listing, it becomes the offer's check, and both are asked.

### Who is who

The two sides are **the person who reached out** (made the offer, or revealed the number) and **the listing's owner**, rather than buyer and seller. On a Wanted listing the owner is the one buying; on a swap both are. The screens word each case from the reader's side: "You got their number", "They accepted your offer", "You accepted their offer", "They got your number and say the deal went through".

### Outcomes

```ascii
   ┌──────────────────────────────────────┐
   │ BOTH YES   → confirmed deal counted   │
   │ ONE YES    → nothing counted, waits   │
   │ ANY NO     → nothing counted, closed  │
   │ NO REPLY   → lapses after 14 days     │
   └──────────────────────────────────────┘
```

### Timing

| Event | When |
| --- | --- |
| First prompt | 3 days after the offer was accepted, or after the reveal |
| Owner's prompt, after a reveal | As soon as the revealer says yes |
| "Not yet" defers | Re-asks once after a further 4 days |
| Lapses | 14 days after the acceptance or reveal, silently. An owner asked late still has at least 4 days |

Three days is early enough that the deal is still memorable and late enough that it has probably concluded.

### Answers

Three options only:

| Answer | Meaning |
| --- | --- |
| **Yes, we completed it** | Counts, once the other side agrees |
| **No, it did not happen** | Closes the check. No count, no consequence. |
| **Not yet** | Defers once |

### Where they are answered

Each prompt links to its own deal check (`/deals/<id>/confirm`). All of a user's open checks are listed under **Deals to confirm** in the account hub (`/me/deals`), in two tabs: those waiting on them, and those they have answered. A user only sees checks they have been asked about: an owner sees nothing of a reveal until the revealer says yes.

---

## It is not a complaint channel

Important, and easy to get wrong.

A "no" means **no deal happened**. It does not mean anyone behaved badly — the buyer may simply have changed their mind, or bought elsewhere. So a "no" carries **no disciplinary consequence whatsoever.**

If something actually went wrong, that is a **report**, which is a separate mechanism with reasons, review and appeal. The confirmation screen links to it:

> *Something go wrong? Report this listing.* (or *Report this person*, for the listing's owner)

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
- **An owner never learns who revealed their number** unless that person says a deal happened.
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
| One confirmation per pair per listing, across reveals and offers | No repeat counting of the same deal |
| Velocity limit per account per week | Blunts bulk fabrication |
| Repeat-pair detection | Two accounts confirming each other repeatedly is flagged for review |
| Confirmations require phone-verified accounts | Ties fabrication to a scarce identity |

Collusion between two real accounts is possible and largely pointless — the reward is a small number on a profile. If it ever becomes worth gaming, that is a good problem.

---

## Honest limits

Stated so nobody over-reads the number:

- **Response rates will be mediocre.** Many prompts will lapse. Expect a minority of reveals to produce a confirmation.
- **It only captures deals that went well enough** for both parties to bother answering.
- **Guest reveals are never followed up.** A deal that started with a guest reveal is invisible.
- **It undercounts systematically.** A confirmed-deal count is a floor, not a total.
- **It is not accounting.** Use it as a directional signal and as a trust display, never as revenue or volume truth.

The right framing for dealers is *"at least 12 confirmed deals"*, not *"12 deals"*.

---

## Definition of done

- [ ] A prompt queued 3 days after every accepted offer, to both parties
- [ ] A prompt queued 3 days after every signed in reveal, to the revealer only
- [ ] The owner prompted only after the revealer says yes
- [ ] Guest reveals never prompt anyone
- [ ] One check per pair per listing; an accepted offer takes over an open reveal check
- [ ] Open checks listed under Deals to confirm, each opening its own deal check
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
- [Contact & Reveals](../product/contact-and-reveals.md) — the reveal that can trigger it
- [Swap & Top](./swap-and-top.md) — offers, whose acceptance triggers it
- [Notifications](./notifications.md) — the prompt
- [Metrics](../operations/metrics.md) — confirmed deals as a measure
- [Dealer Console](../product/store-console.md) — where dealers see it
- [Card System](../product/card-system.md) — the card footer
- [Decisions Log](../reference/decisions-log.md) — decisions P11 and P20

---

**Last Updated:** October 2026
