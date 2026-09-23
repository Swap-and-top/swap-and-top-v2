# Go To Market

## Campus-first seeding, dealers in parallel, and the weekly drop

**Status:** Decided
**Read this if:** you are planning launch work, or wondering why certain product features exist.

---

## Overview

A marketplace does not need a big market. It needs a **dense** one. A listing only feels alive if it gets answered, and answers come from having enough relevant people in one place.

The plan is therefore: one campus, one city, one category cluster, with dealers recruited at the same time as users — not afterwards.

---

## The sequencing mistake to avoid

The intuitive plan is: get students on first to create the atmosphere, then bring dealers in to monetise it.

**This fails**, for a structural reason.

Almost everyone on a swap platform wants to trade **up**. A student with an older laptop wants a better one and will add cash. A student-to-student match requires another student who owns the better laptop and wants to trade **down** for cash. That is a thin pool — mostly people who urgently need money.

Economists call it the double coincidence of wants. It is why money replaced barter.

The party who is happy to trade down is a **dealer**. They take the older device plus cash, hand over the better one from stock, and resell the trade-in. That is their business.

```ascii
WHY DEALERS ARE LIQUIDITY, NOT JUST REVENUE:

  Student A ──── wants to trade UP ────┐
  Student B ──── wants to trade UP ────┤
  Student C ──── wants to trade UP ────┼──► almost no matches
  Student D ──── wants to trade UP ────┘     between each other
                                              
  Dealer ──── happy to trade DOWN ────────► matches all of them
             (takes trade-in + cash,
              resells the trade-in)
```

So: **dealers and students arrive together.** Without dealers, the feed fills with unanswered trade-up requests, students conclude the place is dead within a fortnight, and they do not come back.

Note also that student-to-student **selling** has no such problem — cash clears anything. Which is why the Sell feature matters for students too, not only for dealers.

---

## The seeding plan

### Scope, ruthlessly narrow

- **One campus:** University of Zimbabwe (open question — see [../reference/decisions-log.md](../reference/decisions-log.md))
- **One city:** Harare
- **Categories:** gadgets only — phones, laptops, desktops, consoles, parts. Not furniture, not vehicles.
- **One teaching term**, avoiding exams and holidays

### Dealers — do things that do not scale

1. Walk into 10–15 shops: computer shops first, then repair shops, then phone shops, then console sellers.
2. **List their stock for them.** Do the data entry yourself. Their effort must be near zero.
3. Give the first month of lead alerts and sponsored slots away free.
4. Ask for money at around week four.
5. **Identify a potential local operator while doing this** — this is a deliverable, not a hope. See [company-structure.md](./company-structure.md).

In each conversation, test both revenue hypotheses:

- *Will you pay to be told first when someone wants what you stock?*
- *Separately — how do you track your stock and trade-ins today?*

Open as a peer: the founder sold and repaired computers and was asked about swap deals constantly. That is the opening line.

### Students — presence, not advertising

1. **A table on campus.** Help people list their gadgets on the spot. This is the student equivalent of listing a shop's stock for them.
2. **Three to five ambassadors** seeding residence and faculty WhatsApp groups, paid in data or airtime.
3. **A campus WhatsApp channel** as the announcement surface.
4. Message the old email list collected during the original concept test — it costs nothing, but expect little. It is several years old and most of those students have graduated. Its real value was proving that campus outreach works, not the addresses themselves.
5. **Collect WhatsApp numbers, not email addresses.** Students here live on WhatsApp.

Best timing: **orientation week**, when a new intake is forming networks and joining groups.

---

## The Friday Drop

A weekly event, and the most important acquisition mechanic in the plan.

### Why it exists

Habitual deal-browsing is driven by **time**, not just by content. Local auction houses get repeat visits because auctions end — there is a reason to check at a particular moment. Without that, a feed is something you visit once.

### What it is

> Every Friday at 7pm, a handful of genuinely good dealer deals are published together and announced on the campus channel.

### Why it works at low traffic

It **concentrates attention in time**. A small audience all arriving at once feels busy. A large audience spread across a week feels empty.

### What it gives each side

| Side | What they get |
| --- | --- |
| Buyers | A reason to come back at a known time |
| Dealers | An advertising slot that works before there is volume |
| Platform | A repeatable habit loop and a weekly content beat |

### It is also the bridge to auctions

Once people reliably show up at 7pm on a Friday, there are bidders. That is when a drop becomes an auction. **The drop builds the audience auctions need** — which is why auctions are deferred rather than cancelled. See [../features/auctions.md](../features/auctions.md).

### The one hard requirement

The deals must actually be good. A few weak drops kill the habit before it forms. Curating them is a human job and cannot be automated at the start.

---

## Distribution channels, in order of importance

1. **WhatsApp** — groups, statuses, the campus channel. Requires working link previews, which v1 did not have.
2. **In person** — campus table, shop visits. Slow, unscalable, and the only thing that works at the beginning.
3. **Google** — slower to arrive, compounding once it does. This is why server-side rendering and slugs are not optional. See [../architecture/seo-and-rendering.md](../architecture/seo-and-rendering.md).
4. **Ambassadors** — word of mouth inside residence and faculty groups.

---

## Expansion path

Only after a first campus works.

```ascii
CAMPUS BY CAMPUS:
  University of Zimbabwe (Harare)
        │
        ▼
  Harare Institute of Technology (same city, shared dealers)
        │
        ▼
  NUST (Bulawayo) ──► MSU (Gweru) ──► further
```

Each campus is its own liquidity pool with its own nearby dealers. The model is repeatable; the effort is not reduced by having done it once.

Category expansion (vehicles) and geographic expansion beyond Zimbabwe are separate questions, recorded in [../product/roadmap.md](../product/roadmap.md).

---

## What this plan depends on

| Dependency | Status |
| --- | --- |
| Someone physically in Harare to do shop visits and the campus table | **Open** — founder relocating |
| A local operator after relocation | **Open** — recruiting is a deliverable of the validation test |
| Working WhatsApp link previews | Required before any sharing-based distribution |
| Contact reveal tracking | Required, or none of this can be measured |
| A teaching term without exams or holidays in the middle | Scheduling constraint |

---

## Related documentation

- [Target Users](./target-users.md) — who is being acquired
- [Monetization](./monetization.md) — what dealers are eventually sold
- [Company Structure](./company-structure.md) — the operator gap
- [Validation Test](../operations/validation-test.md) — the six-week version of this plan, with pass criteria
- [Auctions](../features/auctions.md) — what the drop eventually becomes
- [SEO & Rendering](../architecture/seo-and-rendering.md) — the Google and WhatsApp channels

---

**Last Updated:** September 2026
