# Notifications

## Lead alerts, drop announcements, and listing lifecycle messages

**Status:** Decided — deliberately minimal
**Read this if:** you are building any outbound message.

---

## Overview

Notifications in v1 were documented in great detail and never built — the service and routes existed but were never connected to anything. v2 takes the opposite approach: a short list of messages that each do a specific job, and nothing else.

Two questions govern every notification:

1. **Does it cause an action, or is it just news?** News does not get sent.
2. **Which channel is it worth interrupting on?** WhatsApp and push are expensive; in-app is cheap.

---

## Channels

| Channel | Used for | Notes |
| --- | --- | --- |
| **In-app** | Everything | The complete record. Nothing is sent that is not also here. |
| **WhatsApp** | High-value, time-sensitive | The dominant channel locally. Requires opt-in and a template. |
| **Email** | Receipts, invoices, verification, appeals outcomes | Low urgency, needs a record |
| **Push** | Lead alerts, once a native app exists | Deferred with the app |

**No SMS.** Costly, and WhatsApp reaches the same people better.

---

## The notification list

### Dealer — revenue-critical

| Notification | Trigger | Channels | Why |
| --- | --- | --- | --- |
| **Matching demand alert** | A request or swap matching the dealer's stock is posted | In-app, WhatsApp | **This is the paid product.** Speed is what they bought. |
| **Number revealed** | Someone revealed the dealer's number | In-app, daily digest | Evidence the platform delivers |
| **Offer replied to** | A user responds to the dealer's offer | In-app, WhatsApp | Keeps a live deal moving |
| **Subscription expiring** | Three days before renewal | In-app, email | Retention |
| **Drop slot confirmed** | Application accepted | In-app, email | Operational |

The matching demand alert is the one that must be fast and reliable. If it is late, the paid product has failed.

### Seller — retention

| Notification | Trigger | Channels | Why |
| --- | --- | --- | --- |
| **Weekly reveal summary** | Weekly, if there was activity | In-app, WhatsApp | *"Your listing got 12 contacts"* — the strongest reason a seller returns |
| **Offer received** | Someone offers on their swap or request | In-app, WhatsApp | Requires a decision |
| **Listing expiring** | Three days before the 30-day expiry | In-app, WhatsApp | *"Is this still available?"* — doubles as re-engagement |
| **Listing expired** | On expiry | In-app | With a one-tap relist |

### Buyer — habit

| Notification | Trigger | Channels | Why |
| --- | --- | --- | --- |
| **Price dropped** | A saved listing is reduced | In-app, WhatsApp | Well-proven re-engagement |
| **Saved listing gone** | A saved listing is sold or withdrawn | In-app | Prevents wasted contact |
| **Friday Drop live** | Weekly, at drop time | Campus channel, in-app | The habit loop |

The Friday Drop announcement goes to the **campus WhatsApp channel** rather than to individuals — a broadcast, not a notification, and far cheaper to run.

### Moderation — obligation

| Notification | Trigger | Channels | Why |
| --- | --- | --- | --- |
| **Listing removed** | Staff removal | In-app, email | Must state the reason and the appeal route |
| **Warning issued** | Disciplinary action | In-app, email | Must be recorded and acknowledgeable |
| **Suspension or ban** | Disciplinary action | In-app, email | Must state duration and appeal route |
| **Appeal outcome** | Appeal decided | In-app, email | Closes the loop |
| **Queue threshold** | Report queue exceeds a threshold | Staff in-app, email | So nobody has to keep checking |

Every disciplinary message states what happened, why, and how to appeal. This is not optional — an appeals process that people cannot find does not exist.

### Verification — operational

Verification submitted, approved or rejected. In-app and email.

---

## What is deliberately not sent

| Not sent | Why |
| --- | --- |
| "Someone viewed your listing" | Not actionable, and noisy at volume |
| "New listings in your area" | Becomes spam fast; the feed already does this |
| "Complete your profile" | Nagging, and profile completeness is not a goal |
| Re-engagement campaigns to dormant users | Not until there is evidence anyone wants them |
| Anything to guests | They have no account and no relationship |

---

## Frequency rules

- **Digest by default.** Reveals and views are summarised, never sent individually.
- **Immediate only where speed is the value.** Lead alerts and offers.
- **One WhatsApp message per user per day maximum**, except lead alerts for paying dealers, whose whole purchase is immediacy.
- **Every category individually switchable.** A dealer who wants leads but no digests must be able to say so.

---

## Delivery requirements

- **Queued, not sent inline.** A notification failure must never fail the action that triggered it. See [../architecture/background-jobs.md](../architecture/background-jobs.md).
- **Retried on failure**, with a limit.
- **Recorded either way** — what was sent, when, over which channel, and whether it succeeded. Needed for appeals and for debugging "I never got told."
- **Idempotent.** A retried job must not send twice.

---

## In-app notification surface

A simple list on the account hub and in the console: each entry has a type, a short line, a time, and a tap target that goes to the relevant thing. Unread count on the bell icon.

No separate messaging system. Users contact each other on WhatsApp or by phone — the platform brokers the introduction and stops there. Building an inbox would mean becoming responsible for conversations, which contradicts the contact-broker model.

---

## Definition of done

- [ ] In-app notification list with unread state for every notification sent
- [ ] Matching demand alerts delivered immediately to subscribed dealers over in-app and WhatsApp
- [ ] Weekly reveal summaries to sellers with activity
- [ ] Listing expiry nudge with one-tap relist
- [ ] Price drop alerts to savers
- [ ] All disciplinary messages carrying reason and appeal route
- [ ] Per-category preferences
- [ ] Frequency caps enforced
- [ ] All sending queued, retried, recorded and idempotent
- [ ] Friday Drop announced to the campus channel

---

## Related documentation

- [Wanted & Leads](./wanted-and-leads.md) — what the lead alert delivers
- [Moderation](./moderation.md) — the disciplinary messages
- [Contact & Reveals](../product/contact-and-reveals.md) — the reveal data behind summaries
- [Background Jobs](../architecture/background-jobs.md) — queueing and retries
- [Go To Market](../business/go-to-market.md) — the campus channel and the drop

---

**Last Updated:** September 2026
