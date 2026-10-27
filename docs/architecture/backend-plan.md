# Backend Plan

## How we move from mock data to a real API and database, in order

**Status:** Approved 2026-10-27. Phases 1 and 2 built the same day (see [Where it stands](#where-it-stands)).
**Read this if:** you are about to write the API, the database schema, sign in, or the staff tools for reports.

---

## The short version

1. **Roles and stores are two separate things.** A role says what someone may do *on the platform* (user, moderator, admin, super admin). Stores are something a person *runs*, with their own owner and staff. Person, free store and paid store are not roles.
2. **Roles and reports go into the first database schema**, because adding them later means rewriting every permission check and every listing query. The screens staff use to work through reports come later.
3. **The stack:** Postgres (on Supabase), Drizzle, a Hono API in a new `apps/api`, Zod schemas that also produce the API contract, and Supabase Auth with phone number and a one time code.
4. **The order:** schema and seed data first, then sign in, then pages move from mock data to the API one at a time, then stores and passes, then the report queue.

---

## 1. Who someone is: role, and what they run

Two questions get two separate answers. Mixing them is how v1 ended up with role checks that locked out its own super admin.

### Question one: what may this person do on the platform? Their **role**

Every signed in account is a person, and every person has exactly one role. Higher roles include everything below them.

```ascii
SUPER ADMIN  ⊃  ADMIN  ⊃  MODERATOR  ⊃  USER        (GUEST = not signed in)
```

| Role | Who | Can do |
| --- | --- | --- |
| **Guest** | Anyone not signed in. Not stored: it is simply "no session". | Browse, search, reveal a number |
| **User** | Everyone who signs up. This is almost everybody. | Post, swap, ask, save, report, open stores |
| **Moderator** | Staff who work the report queue | Everything a user can, plus: claim reports, approve or clear them, remove listings, warn, suspend |
| **Admin** | Senior staff | Everything a moderator can, plus: ban, review appeals, verify stores, see payments, make people moderators |
| **Super admin** | The owner of the platform (Hillary) | Everything, including making and removing admins |

These are the same four levels v1 had (`user`, `moderator`, `admin`, `super_admin`). The one change is how they are checked: always "at least this level", never "exactly this role".

### Question two: what does this person run? Their **stores**

This is where person, free store and paid store live. None of them is a role:

| What you see | What it is in the data |
| --- | --- |
| **Person** | A user with no stores. Posts as themselves; 5 live listings. |
| **Free store** | A store with no pass running. 15 live listings, a store page. |
| **Paid store** | The same store while a pass is running. No listing limit, the Store console, lead alerts. |
| **Store owner** | A person listed as owner of a store |
| **Store staff** | A person listed as staff of a store |

Why it is shaped this way:

- **A person can have a store and still be a person.** Tarisai can post her own phone as herself and her shop's laptops as Kopje Computers, from one sign in. A single "account type" field cannot say that.
- **Free and paid is not something anyone sets.** A store is paid exactly while one of its passes covers today. When the pass ends, the store is free again with nothing to update. A stored "paid" flag would go stale and need a job to fix it.
- **Staff are people.** They sign in as themselves, and their membership says which store they can work in and as what.
- **A moderator can also run a store.** Roles and stores never get in each other's way.

So a permission check in the API asks one of three plain questions:

1. *Is this person at least a moderator?* (role)
2. *Is this person the owner, or staff, of this store?* (store membership)
3. *Is this store paid today?* (a pass covering today)

### What changes in the code

`packages/core/src/types/user.ts` today has `'store'` in the list of roles, as a stand in until people own stores. When the schema is built that value goes away: roles become `user`, `moderator`, `admin`, `super_admin`, and stores hang off a person through membership.

---

## 2. Reports, as v1 did them, kept simple

v1 (the `SnTAPI` repo) already had the right chain: a report, a disciplinary action, an appeal. This keeps the chain and trims it.

### How a report moves

```ascii
 User reports a listing or a person
            │
            ▼
        OPEN  ──── a moderator claims it ────►  CLAIMED
                                                  │
                     ┌────────────────────────────┼──────────────────────┐
                     ▼                            ▼                      ▼
                 APPROVED                  reason changed             CLEARED
           the report is right:          then approved            the report is wrong:
           an action is taken                                     nothing happens to
           (warning, removal,                                     the person reported
           suspension, ban)
```

Three choices for the moderator, matching what v1 let them do:

| Choice | What happens |
| --- | --- |
| **Approve** | The violation matrix picks the action from the reason and the person's history. The person's standing changes to match, and they are told. |
| **Change the reason** | For a report filed under the wrong reason. Then it is approved under the right one. |
| **Clear** | Closed with no action. Kept on record, never deleted. |

### What changes from v1

| v1 | v2 | Why |
| --- | --- | --- |
| 19 report reasons | 8: stolen, not as described, fake, duplicate, offensive, wrong category, no show, other | A person reporting picks from a short list on a phone |
| Statuses pending, approved, dismissed, escalated | Open, claimed, approved, cleared | Claiming is now a state you can see. "Escalated" is dropped: a ban simply needs an admin. |
| Reports only on listings (the user target was commented out) | On a listing or on a person | A no show is about a person, not a listing |
| A cleared report was soft deleted | A cleared report stays, with its outcome | Needed for appeals and honest counts |
| Role checks by exact match | "At least this level" | v1 refused its own super admin |
| Listing approval before going live | None | Listings go live at once (see [../features/moderation.md](../features/moderation.md)) |

### Appeals

Unchanged from v1 and the moderation doc: a person can appeal an action once; an admin, other than the one who decided, upholds it or overturns it, and an overturned action is reversed with the record kept.

### Tables this needs

| Table | Holds |
| --- | --- |
| `reports` | Reporter, the listing or person reported, reason, words, state, who claimed it and when |
| `moderation_actions` | The report, who decided, the choice, the action (none, warning, removal, suspension, ban), its length, the reason |
| `appeals` | The action, the person appealing, their words, who reviewed it, upheld or overturned |

Plus on each person: `role` and `standing` (good, warned, limited, suspended, banned) with a suspension end date. Listings from suspended and banned people are left out **in the database query**, so they can never slip into the feed.

---

## 3. The stack

| Part | Choice | Why |
| --- | --- | --- |
| Database | **Postgres**, hosted on **Supabase** | Decided relational (decision A2). Supabase gives the database, sign in and file storage together, on a free tier that does not sleep. |
| Talking to the database | **Drizzle** | Plain TypeScript tables, readable migrations, no separate engine to run |
| API | **Hono**, in `apps/api` | Small and fast, works with Zod and OpenAPI out of the box. Runs inside the web app on Vercel for now, and on a server of its own later with no rewriting (see [Where it runs](#where-it-runs)). |
| Validation and contract | **Zod** schemas in `packages/core`, turned into an **OpenAPI** file | One definition of a listing used by the web app, the API and a future phone app (decision A4) |
| Sign in | **Supabase Auth**, phone number and a one time code | Decided (A3). In development a fixed test code, so no SMS is sent while testing. |
| Photos | Supabase Storage for now | Object storage with direct uploads (A8). Can move to a no egress store later without touching listings. |
| Later | pg boss jobs in Postgres (A9), Upstash Redis for rate limits, the Paynow server SDK | Not needed until expiry, alerts and real payments |

**Why not Mongo first and Postgres later.** Starting on one database and moving to another means writing the data layer twice and migrating real data once. Drizzle migrations are small and generated, so Postgres from day one costs less than the switch would. v1's pain with a document database is the reason for decision A2.

**Why not a throwaway mock backend first.** The web app already has a good mock layer in the browser. A second mock on a server would be thrown away. Instead the real API is built with a seed script that loads today's mock listings, stores and people, so every page looks the same on day one.

---

## 4. The order of work

Each phase ends with something you can check on the phone before the next starts.

### Phase 1: the schema and seed data

- New `apps/api` with Hono, Drizzle and a connection to Supabase.
- The first schema: people (with role and standing), stores, store members, store passes, items, listings with their sale, swap and wanted details, photos, offers, reveals, deal checks, notifications, boosts, reports, moderation actions, appeals, payments.
- A seed script that loads the mock data from `packages/core/src/mock`, plus one test account for each kind of person (below).
- **Check:** the seeded data can be read through the API.

### Phase 2: sign in

- Phone and one time code through Supabase, with a fixed code in development.
- The web app's session store reads the real session instead of `snt-session` in local storage.
- **Check:** sign in as each test account and see the right menus.

### Phase 3: pages move to the API, one at a time

In this order, because each depends on the one before: the feed and a listing page, then posting, then My listings, then offers and deal checks, then notifications, then saved listings. Each page keeps working on mock data until its turn.

- **Check:** after each page, it looks and behaves the same as before.

### Phase 4: stores and passes

Build [../product/accounts-and-stores.md](../product/accounts-and-stores.md): opening a store, Post as, owner and staff, listing limits, passes through Paynow.

- **Check:** a person hits 5 listings, opens a store, buys a day pass, and sees the Store console.

### Phase 5: the report queue for staff

The screens: Report on a listing or person for users; a phone friendly queue for staff where a report is claimed, approved, given a new reason or cleared in a few taps; appeals for admins.

- **Check:** report a listing as one test account, approve it as the moderator, and see the warning arrive.

---

## 5. Test accounts

Seeded in development only, each signing in with its phone number and the fixed test code.

| Account | Role | Runs |
| --- | --- | --- |
| A person | User | Nothing |
| A free store owner | User | One free store |
| A paid store owner | User | One store with a month pass |
| Store staff | User | Staff on the paid store |
| A moderator | Moderator | Nothing |
| An admin | Admin | Nothing |
| The super admin | Super admin | Nothing |

---

## 6. What the product owner needs to do

- **Create a Supabase account and a project** (free). Claude cannot create accounts. The project's keys go into a local `.env` file that is never committed.
- **Say go** before Phase 1 starts.

---

## Where it stands

**Phase 1 is built** (2026-10-27), in `apps/api`:

- `src/db/schema.ts`: all 21 tables, with row level security on every one, so the public Supabase key reads nothing. The first migration is `drizzle/0000_first_schema.sql`, applied to the Supabase database.
- `src/db/seed.ts`: loads the mock people, stores and listings, the seven test accounts (phones +263770000001 to +263770000007, in the order of the table above) and month passes for Kopje Computers, Samora Mobile and Msasa PC Parts. Avondale Games stays a free store. Offers, deal checks and notifications are not seeded yet; each comes with its page in Phase 3.
- Read endpoints, all public: health check, browse listings (live only, owners in good standing, cursor paged), get a listing, get a store.
- **Swagger** at `/api/docs` lists every endpoint and can run each one (open it, Try it out, Execute). The contract itself is at `/api/openapi.json`.

**Phase 2 is built** (2026-10-27): phone sign in.

- Supabase Auth has phone sign in on, with the seven test numbers taking the code `123456` and sending no SMS. Any other number needs a real SMS provider (Twilio's details in Supabase are placeholders for now).
- **The auth pages follow the first app's arrangement and pictures**, in this app's style, on one shared frame (`apps/web/src/app/signin/AuthLayout.tsx`): sign in (`/signin`, the door), sign up (`/signup`, the clipboard, then the envelope; picture on the right), forgot password (`/signin/forgot`) and the new password page (`/signin/reset`, both the key and arrows).
- **Sign in** opens on email and password, with Continue with phone (a number and a one time code), Google and Facebook under "or" (Google and Facebook not connected yet). The phone and email forms keep the same height.
- **Sign up** is three steps, shown along the top of the card: Your details (first name, surname, email), Password (neighbourhood, city or town from the first app's list `TOWNS`, starting on Harare, then the password twice), Verify email (a code). Verified, they are signed in. Signing in by email before verifying asks for the code first, as the first app did.
- **Mock codes, until email and SMS are set up.** `POST /api/auth/signup` makes the account through Supabase's admin API without sending email; `POST /api/auth/verify-email` and `POST /api/me/phone` take the code `123456` (`MOCK_CODE` in `apps/api/src/supabaseAdmin.ts`) and send nothing. The screens say so under the box. Remove them once real email and SMS are set up.
- **A phone is optional to join** (decided 2026-10-27), because Google and Facebook accounts arrive without one. Anyone can browse and save. Posting and sending offers need a verified phone: `requireVerifiedPhone` in `@snt/core` opens the verify phone sheet (`apps/web/src/components/VerifyPhone.tsx`) and carries on once it is done; Settings has the same form. A phone belongs to one account only (409 otherwise), which keeps a ban in place. Someone who joined by phone is asked their name once (`AskName`, `PATCH /api/me`).
- Settings (`/me/settings`, from Me) has the phone number, and the email and password. The browser's Supabase client lives in `apps/web/src/lib/supabase.ts`, with `apiAsViewer` for calls as the signed in person.
- `SessionRestore` keeps the session store in `@snt/core` in step with Supabase. `useViewerId` is now the real person's id, and the header and menu show their real name.
- The API checks the sign in token against Supabase's public keys (`apps/api/src/auth.ts`). `GET /api/me` returns the signed in person, linking the Supabase user to the person with that phone the first time, or adding a new person with the name from sign up.
- In development the database pool is kept on `globalThis`, so the dev server's reloads do not use up Supabase's 15 session connections.
- The `'store'` stand in role is gone from `@snt/core`.
- **For email to work beyond testing:** Supabase's built in email only sends to the project's team members, a few an hour. Before launch, set a real email sender under Authentication, Emails, SMTP Settings. Also list the site under Authentication, URL Configuration, Redirect URLs (`http://localhost:3000/**` and the Vercel address with `/**`), or reset links are refused.
- Test account 1 (077 000 0001) also has the test email `tarisai.test@example.com` with the password `testpass123`.
- Not yet: the Me page, offers and deals still show the mock account (Tarisai M.) whoever signs in. Each moves to the API with its page in Phase 3.

**Phase 3 is built** (2026-10-27): every page a person uses reads and saves through the API.

- The feed (`/`) and a listing page (`/listing/[slug]`) read live listings from the database on the server, through `apps/web/src/lib/listings.ts` (the API's own `liveListings` and `listingBySlug`, not over HTTP). Both are built ahead and kept for a minute (`revalidate = 60`), so they stay instant; a new listing shows within a minute.
- The feed is now newest first, by when each listing was published, where the mock file had its own order.
- If the database cannot be reached the mock listings stand in, with a warning, so a build never fails for it.
- **Posting saves to the database.** "Post listing" on the review step sends the draft to `POST /api/listings` (`apps/api/src/routes/post.ts`), which needs a sign in and a verified phone (the app asks for the phone first) and saves the item or items, the listing and its sale, swap or Wanted details in one go: live at once, expiring in 30 days, in the poster's neighbourhood. The feed and the new listing's page are refreshed straight away (`showNewListing`), and the new listing opens. Photos are not uploaded yet, and the listing limits come with Phase 4.
- **My listings reads from the API** (`GET /api/me/listings`: everything the signed in person posted and has not deleted). The owner's Manage choices (pause, mark sold or swapped, delete, relist) save through `PATCH /api/listings/{id}/status` (`apps/web/src/lib/listingStatus.ts`), showing at once and put back if the API refuses; the feed and the listing's page are refreshed straight away. Relisting puts a listing back in the feed as new, for another 30 days. Editing a listing is not built yet. The Store console's stock still uses the mock data (Phase 4).
- **Offers read and save through the API** (`apps/api/src/routes/offers.ts`): `GET /api/me/offers` (sent, and on your listings), `POST /api/offers` (a verified phone, not your own listing, one standing offer per listing) and `PATCH /api/offers/{id}` (the owner accepts or declines; the sender withdraws; the owner takes a decline back at any time, or an accept within a minute). Accepting starts a deal check for both, asked three days on. The offer store loads them on sign in (`apps/web/src/lib/accountData.ts`) and stays optimistic.
- **Deal checks read and save through the API** (`apps/api/src/routes/deals.ts`): `GET /api/me/deals` (the ones you are asked about, and your count of confirmed deals) and `PATCH /api/deals/{id}` (yes, no or not yet; both yes confirms it, a no closes it quietly). The deal check page finds its deal among the signed in person's own. Your own confirmed deals now come from the database; other people's badges on cards still come from the mock data.
- **Saved listings read and save through the API** (`apps/api/src/routes/saved.ts`): `GET /api/me/saved` (ids, newest first, and the listings, sold or gone ones included), `PUT` and `DELETE /api/me/saved/{listingId}`. The star saves optimistically; the Saved page shows the listings from the API.
- **Notifications read and save through the API** (`apps/api/src/routes/notifications.ts`): `GET /api/me/notifications` (yours, and your stores' for the Store console) and `POST /api/me/notifications/read`. A new offer tells the listing's owner, and accepting or declining one tells the sender (`notify`). Other events (deal checks, expiring listings, leads) do not send any yet.
- The seed loads the sample offers, deal checks, saved listings and notifications (`seedActivity`); `pnpm --filter @snt/api db:seed-activity` puts just those back.
- **Search and the Wanted feed read from the database**: `/search` and `/wanted` get the live listings on the server, as the feed does, and `LiveListingsLoader` loads them once in the browser for the search panel and anything else without a page to bring them (`useListingSource` in `@snt/core`). A newly posted listing is in search straight away.
- Still on the mock data: the Store console (Phase 4), and the names, store badges and deal counts shown for other people on cards and offers (they come from the mock people and stores, whose ids match the database). The seeded ids match the mock ones, so the two agree.
- A production build makes pages in several workers at once, so each opens one database connection; Supabase's session pooler allows 15 in all.

### Running it

The settings live in the root `.env` (git ignores it): `DATABASE_URL` and the four `SUPABASE_` values. Then:

| What | Command |
| --- | --- |
| Start the API on its own, on port 4000 | `pnpm --filter @snt/api dev` |
| Put the data back to the start | `pnpm --filter @snt/api db:seed` |
| After changing `schema.ts`, write a migration | `pnpm --filter @snt/api db:generate` |
| Apply migrations to the database | `pnpm --filter @snt/api db:migrate` |

Start the API on its own, as above. The root `pnpm dev` starts every app, including a second Next.js server when one already runs on port 3000.

### Where it runs

No server to rent. The web app serves the API at `/api` through one route (`apps/web/src/app/api/[[...route]]/route.ts`), so the same push to Vercel deploys the site and the API together, at one address:

| Where | API | Swagger |
| --- | --- | --- |
| Your laptop, with the web app | http://localhost:3000/api | http://localhost:3000/api/docs |
| Your laptop, the API on its own | http://localhost:4000/api | http://localhost:4000/api/docs |
| Vercel | `https://<site>/api` | `https://<site>/api/docs` |

**On Vercel** the project needs `DATABASE_URL`, and for sign in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the same values as `apps/web/.env.local`; they are built into the page, so add them before the push). They go under Settings, Environment Variables. For `DATABASE_URL` use Supabase's **Transaction pooler** string there (Connect, Transaction pooler, URI, with the password filled in), which suits Vercel, where each request borrows a connection for a moment. The Session pooler string in `.env` is for the laptop.

**When a server of its own is worth it:** for work that runs between visits (expiring listings, lead alerts, closing auctions) or to answer with no first request delay (decision A16). Then `apps/api/src/index.ts` runs the same app on a small always on host, about $5 a month, not a VPS to look after.

---

## Related documentation

- [auth-and-identity.md](./auth-and-identity.md): roles cascade, phone identity, protected by default
- [data-model.md](./data-model.md): the entities this schema builds
- [../features/moderation.md](../features/moderation.md): reports, outcomes, the violation matrix, appeals
- [../product/accounts-and-stores.md](../product/accounts-and-stores.md): people, stores, passes, owner and staff
- [../api/endpoints.md](../api/endpoints.md): the API surface
- [../reference/v1-lessons.md](../reference/v1-lessons.md): what went wrong last time
