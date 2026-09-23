# Moderation

## Reporting, takedowns, discipline and appeals

**Status:** Decided
**Read this if:** you are building staff tools, reporting, or anything involving account standing.

---

## Overview

The central decision: **listings go live immediately and are moderated on report.** There is no approval queue.

```ascii
v1 MODEL (rejected)              v2 MODEL (adopted)
──────────────────              ──────────────────
 user posts                      user posts
     │                               │
     ▼                               ▼
 PENDING ──── waits for         LIVE immediately
     │        a human               │
     ▼                              │ someone reports it
 approved / rejected                ▼
     │                          reviewed, removed if wrong
     ▼                              │
   live                              ▼
                                 discipline if warranted
```

---

## Why report-driven and not pre-approval

Four reasons, each sufficient on its own.

1. **A human gate is an outage.** With a small team and a founder relocating, pre-approval means nothing goes live whenever nobody is available. During a quiet stretch, every new listing sits invisible and every new seller concludes the platform is broken.

2. **It did not work in v1 anyway.** Listings defaulted to pending, but the public feed never checked moderation state, so everything was visible regardless. The approval workflow gated nothing while still creating the impression of a queue.

3. **Volume is the goal.** Every listing is inventory, an indexable page and a shareable link. Delay is a direct cost.

4. **The real risks are not caught by pre-approval anyway.** Stolen devices and misrepresented condition do not announce themselves in a form. They surface when a buyer meets a seller, which is a report, not a review.

**What makes this safe:** scarce identity. Phone-anchored accounts and student verification mean a bad actor cannot simply reappear. Accountability after the fact substitutes for permission before it. See [../product/trust-and-safety.md](../product/trust-and-safety.md).

---

## Reporting

Available on every listing and every user profile, to any signed-in user. One tap, then a reason.

| Reason | Typical outcome |
| --- | --- |
| Possibly stolen | Urgent review, likely removal and suspension |
| Not as described | Review, warning, possible removal |
| Fake or misleading listing | Removal, warning |
| Duplicate listing | Removal of the duplicate |
| Offensive content | Removal, warning or ban |
| Wrong category | Recategorised, no discipline |
| Did not show up or refused agreed deal | Review against the reporter's account too |
| Other | Free text, triaged manually |

A report records the reporter, the target, the reason, free text, and the time. Reports are not anonymous to staff, and reporters are themselves accountable — malicious reporting is a violation.

### Automatic signals

Not verdicts, just things that raise a listing's priority in the queue:

- The same photograph appearing across multiple accounts
- A price far below typical for the specification
- A high volume of listings from a very new account
- Several reports against the same account in a short window

---

## The review queue

Staff work a single queue, ordered by severity and age. Wireframe-equivalent screens live in the admin surface.

**Claiming.** A moderator claims a case before working it, so two people never review the same report. Claims expire if left idle.

**Every action is attributable.** Who did what, when, and why. This is what makes appeals possible.

**Outcomes available:**

| Outcome | Effect |
| --- | --- |
| No action | Report closed, recorded |
| Recategorise or edit | Listing corrected, no discipline |
| Remove listing | Listing removed with a reason, owner notified, appealable |
| Warning | Recorded against the account, owner notified |
| Suspension | Time-limited, listings hidden, cannot post |
| Ban | Permanent, all listings removed |

---

## Discipline pipeline

Carried over from v1, where it was the most substantial and genuinely valuable work done.

```ascii
Report ──► Review ──► Disciplinary action ──► Appeal
                            │                    │
                            ├─ warning           ├─ upheld
                            ├─ listing removal   └─ overturned
                            ├─ suspension              │
                            └─ ban                     ▼
                                              action reversed,
                                              record annotated
```

### The violation matrix

Offence type crossed with repetition produces a proportionate outcome. Its purpose is **consistency** — the same behaviour gets the same response regardless of which moderator handled it, which is what makes an appeals process defensible.

A first "not as described" is a warning. A third is a suspension. A confirmed stolen device is immediate, regardless of history.

### Appeals

Any disciplinary action can be appealed once. An appeal is reviewed by someone other than the person who issued the action where staffing allows. Outcomes are upheld or overturned, with a reason recorded either way.

**Why this matters more than it seems:** the flaking problem in a contact-broker marketplace — someone agrees a deal and vanishes, or later wins an auction and never pays — is handled here rather than by holding people's money. Accountability replaces escrow. It is the reason the platform can stay out of payments entirely.

---

## Account standing

Every account has a standing that affects what it can do.

| Standing | Effects |
| --- | --- |
| **Good** | Normal |
| **Warned** | Normal, with a recorded warning |
| **Limited** | Reduced listing cap, tighter review — for very new or repeatedly reported accounts |
| **Suspended** | Listings hidden, cannot post, time-limited |
| **Banned** | Listings removed, cannot post |

Listings from suspended and banned accounts never appear in the feed, in search, or in the sitemap. This is enforced in the query, not filtered in the client.

---

## Role hierarchy

```ascii
SUPER ADMIN  ─── everything
     │
   ADMIN      ─── full management, moderation, billing, verification
     │
 MODERATOR    ─── report queue, listing removal, warnings, suspensions
     │
  DEALER      ─── own stock, leads, promotion
     │
   USER       ─── post, swap, request, save, report
     │
  GUEST       ─── browse, search, reveal
```

**Higher roles include everything below them.** This must genuinely cascade.

In v1 the role check was an exact string comparison, so a super admin was refused on every route restricted to admin — the platform owner could load the dashboard and then be denied by the API behind it. There was also a route restricted to a role with no authentication check in front of it, which crashed rather than refusing. See [../reference/v1-lessons.md](../reference/v1-lessons.md).

---

## Listing expiry

Not moderation exactly, but it serves the same purpose — keeping the catalogue honest.

- Listings expire after **30 days**
- A nudge goes to the owner before expiry: *is this still available?*
- The nudge doubles as re-engagement
- Expired listings leave the feed, search and the sitemap
- Nothing is hard-deleted; state changes and records persist

---

## Staff tooling requirements

Because the team is one or two people, possibly remote:

- **Mobile-usable.** A report queue that requires a laptop will not be worked.
- **Fast.** Claim, read, decide, next. No more than a few taps per case.
- **Bulk actions** for obvious cases — several duplicate listings from one account.
- **Notification when the queue grows** past a threshold, rather than requiring someone to check.

---

## Definition of done

- [ ] Listings publish straight to live
- [ ] Feed, search and sitemap read only live listings from accounts in good standing
- [ ] Reporting on listings and users, with reasons
- [ ] A single prioritised review queue with claiming
- [ ] All six outcomes available, every action attributed
- [ ] Violation matrix producing consistent outcomes
- [ ] Appeals, reviewed separately where possible
- [ ] Account standing enforced in queries
- [ ] Role hierarchy that cascades
- [ ] Automatic priority signals feeding the queue
- [ ] Listing expiry with re-engagement nudge
- [ ] Staff tools usable on a phone

---

## Related documentation

- [Trust & Safety](../product/trust-and-safety.md) — identity, verification, stolen devices
- [Auth & Identity](../architecture/auth-and-identity.md) — roles and enforcement
- [Listing Types](./listing-types.md) — the status lifecycle
- [Notifications](./notifications.md) — how outcomes reach users
- [v1 Lessons](../reference/v1-lessons.md) — the role and moderation failures this replaces

---

**Last Updated:** September 2026
