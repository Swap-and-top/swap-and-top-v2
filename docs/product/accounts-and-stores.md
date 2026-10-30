# Accounts and stores

## People, stores, what each can do, what a store pays, and how each is verified

**Status:** Decided 2026-10-27, not built yet. Decisions B16 to B19 and P31
to P37 in [../reference/decisions-log.md](../reference/decisions-log.md).
**Read this if:** you are building sign up, posting limits, stores, store
payments, verification or settings.

---

## The model in one line

**An account is always a person. A store is something a person opens and
runs from their account.** A person never turns into a store, and a store is
never a login of its own.

---

## Words

- **Store**, everywhere people can see it. Nobody is called a dealer: not in
  the app, not in help text, not in docs written from now on. The console is
  the **Store console**, the badge is **Verified store**, and settings say
  "Let stores see my contact details", "Accepts offers from stores".
- Code names say store too (`Store`, `storeId`, `currentStore`,
  `allowStoreOffers`, `VerifiedStoreBadge`). Only the names of frames in the
  design file (`Shopfront`, `DetailDealer`) keep the old words, so they can
  still be found there.
- A store's public page lives at `/store/<slug>`, its console page at
  `/console/store` (moved from `/shop` on 2026-10-27; the old addresses
  redirect).

---

## The three levels

| | Person | Free store | Paid store |
|---|---|---|---|
| Costs | Nothing, always | Nothing | A prepaid pass (below) |
| Live listings for sale or swap | **5** | **15** | No limit |
| Wanted listings | Not counted | Not counted | Not counted |
| Store page (`/store/<slug>`) | No | Yes | Yes |
| Boosts | Yes, paid per boost | Yes, paid per boost | Yes, paid per boost |
| Store console, lead alerts, stats | No | No | Yes |
| Verified store badge | Never | Only once checked | Only once checked |

**What counts toward a limit:** live listings for sale or swap only. Sold,
paused, expired and deleted listings do not count, and neither do Wanted
listings: people asking for things are the demand stores pay to hear about,
so asking is never limited.

**The limits are spam control, not a paywall.** At a person's limit the app
says so plainly and offers the free store first:

> You have 5 live listings, the most for a personal account. Open a store to
> post more, or mark one as sold.
>
> **Open a store** · **My listings**

There is **no paid plan for people.** A person who sells a lot is a store,
and the upgrade leads there. People can still pay per boost on any listing.

---

## Paying for a store: prepaid passes

A paid store is bought as a **pass**, the way people here buy data and
airtime bundles. One payment through Paynow, **never renewing by itself**.

| Pass | Price | Per day |
|---|---|---|
| Day | **$1** | $1.00 |
| Week | **$5** | $0.71 |
| Month | **$15** | $0.50 |

Each longer pass costs less a day than the shorter one, so the month is the
cheapest way to stay paid and the day is the cheapest way to try it.

**A pass includes everything a store pays for:** the Store console,
unlimited listings, and lead alerts (no longer sold on their own). Boosts
stay separate, because they are about one listing, not the store.

**Extending** tops up from the pass's current end, so no days are lost.

**A reminder, never an automatic charge.** The day before a pass ends:

> Your store pass ends tomorrow. Extend it to keep all 40 listings live.

### When a pass ends

The store becomes a free store, gently:

- Its **15 most recently updated** listings stay live; the rest are
  **paused**, never deleted. The owner can choose which 15 stay live
  instead.
- The moment a new pass is bought, everything paused by the lapse goes live
  again.
- The Store console closes until the next pass; stock and history are kept
  there, untouched. Meanwhile the free store manages its listings on its
  own page under My stores (2026-10-30).
- Lead alerts stop until the next pass.

**A store's listings are the store's** (Hillary, 2026-10-30): posted by
its owner or a staff member, they are managed only by the store's current
owner and staff, and are not in the poster's My listings, which holds only
their personal listings.

Nothing is ever lost, so letting a pass lapse is never frightening. Worth
watching once real stores pay: a store buying only single days, on the days
it posts. The pause at lapse mostly answers it.

---

## A person opens a store

1. **The way in:** "Open a store", from the limit message, the profile, or
   the account menu.
2. **A short form:** store name, area, contact ways. It starts as a free
   store; verification and a pass come later, when wanted.
3. **Moving listings across:** the person may move some or all of their
   current listings into the store; each keeps its offers and history.
   Anything not moved stays personal.
4. **Posting afterwards:** from the Store console, everything is posted as
   the store. From Post New Item, anyone with a store sees one choice at the
   top, **Post as: Tarisai M. / Kopje Computers**, starting on themselves (Hillary, 2026-10-30), so a store listing is always chosen.
   Nobody without a store sees it.
5. **Switching:** the account menu shows the store; "Store console" opens
   it. No signing out and in.

### Owner and staff

Two roles, kept simple:

| Role | Can do |
|---|---|
| **Owner** | Everything, including passes, payments, verification, staff and closing the store |
| **Staff** | Stock, offers and leads. Not payments, verification, staff or settings |

Staff sign in with **their own person accounts**; nobody shares a password.
The owner adds staff by phone number and removes them in one tap. What
staff do is recorded against their name.

### Rules that keep it honest

- **A person can own up to 3 stores**, so stores are not a way around the
  limits.
- **Records stay apart.** Deals made as the store count for the store;
  personal deals count for the person. A store's reputation and its owner's
  never bleed into each other.
- **Closing a store** closes its live listings; the person carries on as
  before.
- **Selling a business** hands the store, and its record, to a new owner;
  the seller's personal history stays theirs. The Verified store badge
  pauses until the new owner is checked.

---

## Verification

**People earn trust through what they do; stores earn a badge by proving
who they are.**

### People: verified quietly

- **Phone number by one time code,** at sign up. Required, never shown as a
  badge, because a badge everyone holds says nothing.
- **What is shown is earned:** confirmed deals (from deal checks), typical
  reply time, member since, a clean record (no upheld reports).
- **Photo ID is optional and never public:** for disputes, account recovery
  or heavy sellers only. Shown publicly it would hand personal details to
  strangers met in person, and it carries duties under Zimbabwe's Cyber and
  Data Protection Act.
- No student, occupation or other status badges (see
  [trust-and-safety.md](./trust-and-safety.md)).

### Stores: a badge that asserts something checkable

**Verified store** means a real business stands behind this store. A staff
member checks a request from the owner:

- **A registered business:** certificate of incorporation, with the owner's
  national ID matching a director.
- **An informal trader:** a council vendor or market licence, with the
  owner's ID.
- **Every store:** a verified phone, and an address with a photo of the
  shop front, or a short video call walking through the shop.

> **Built so far (2026-10-28):** the owner asks on Edit store details with
> the kind of business and its registration or licence number; our team
> calls to see the documents; an admin verifies or declines (with a reason)
> at `/admin/verify`; a rename pauses the badge. Document photos, the
> yearly check, pausing after reports and a pass requiring the badge come
> later. Uploading the documents with the request is next in line for
> this, when Hillary asks (2026-10-30); whether a tax clearance counts
> is not decided.

The badge is **checked again every year**, **paused** after serious upheld
reports, and **paused while key details change** (name, address,
registration, owner) until they are checked again. **The check is never
sold, and never required to pay** (decision P38, 2026-10-28): any store,
free or paid, can ask for it; a store pass does not need the badge, and no
payment grants it. Paying buys room and tools; the badge is earned by being
checked. A store with a pass and no badge sees a short line in the Store
console inviting it to ask.

---

## What can be changed in settings

The rule underneath: **anything that is part of a record or a check cannot
be wiped by editing it.**

### A person

| Change freely | Change after confirming | Never changeable |
|---|---|---|
| Profile photo, area, notification settings, the contact toggle (P28), which contact ways show | **Display name:** at most once every 30 days; earlier names kept on record for safety | Member since, confirmed deals, deal history, reports against them |
| **Password:** with the current password or a code; option to sign out other devices | **Phone number:** a code to the new number, plus a short wait or a code to the old one | The account's internal id |
| | **Email:** a confirmation link | |

**No public usernames.** People are shown by first name and initial, as now:
simpler, safer, and nothing to squat on.

### A store

| Change freely | Change, but the badge pauses until checked again | Never changeable |
|---|---|---|
| Logo, description, opening hours, contact ways, stock, prices | **Store name:** "formerly …" shows for 30 days, so a record cannot be shed by renaming | Member since, confirmed deals, verification history |
| | Address, registration details, owner | |
| | **Web address** (`/store/…`): once; the old one redirects | |

---

## Related

- [../business/monetization.md](../business/monetization.md): what is
  free and what is paid
- [./trust-and-safety.md](./trust-and-safety.md): verification and safety
- [../architecture/auth-and-identity.md](../architecture/auth-and-identity.md):
  sign in and identity
- [./store-console.md](./store-console.md): the Store console
