# Handoff: where the redesign stands

Written on 2026-10-22 to carry the work to a new Claude account, and
brought up to date on 2026-10-26, 2026-10-27 (the second account change),
twice more later on 2026-10-27, at the end of the long 2026-10-27
backend session (Phases 1 to 3 and Phase 4 slice 1), and on 2026-10-28
(slices 2 and 3: store passes and the Store console on real data), and
again at the end of 2026-10-28 (the rest of Phase 4, the Staff console
plan, and Phase 5's first parts: the roles change, the console frame and
Team). The rules for working on this repo are in `/CLAUDE.md`; read that first. This
file is the state of the code and the recent work. **Start with "Where we
stopped" just below**, then `docs/architecture/backend-plan.md` ("Where it
stands") for the backend in full.

## Where we stopped (2026-11-04)

**In one line:** Phases 1 to 7 are built and live on `main` (commit
ac67c91, 2026-11-03), apart from real Paynow payment (waiting on
Hillary's merchant account) and Umami (waiting on the final hosting;
Growth shows sample visits until then). Phase 5 is the Staff console's
Trust and safety; the three safeguards Hillary chose (staff password,
sealed second super admin, data requests) are built and live. Phase 6
is Stores (Sales), Revenue (Finance) and the Overview with My overview.
Phase 7 is Growth (Marketing) and Health (DevOps), with the recording
behind them (migration `0013`). Migrations `0001` to `0014` are applied
(`0014`, the stores' `logo` column, with Hillary's yes on 2026-11-06).
Vercel builds only Production. The Dockerfile for Dokploy is committed on
the branch (12250c3, "Hosting on Dokploy" below). **Built 2026-11-06, not
committed: photo uploads on R2** (listing photos and store logos, "Photos
on R2" below). Next after it: Umami on Dokploy.

**Where the next agent starts:** Hillary looks at Growth and Health (as
super admin she sees every section; no test account is in Marketing or
DevOps, and adding one is refused as a permission grant) and says what
to change. Then whatever she picks next: the things offered and not yet
chosen (an export of Stores for Sales leaders, a mark for store owners
who say no to being called, a payments by day chart), Umami once the
hosting is chosen ("Waiting on the owner"), real Paynow payment, or
real email and SMS before launch. Ask Hillary before building, show
her the page in the browser, and build what she picks.

The notes below are newest at the end of each part, from 2026-11-03.

**Built 2026-11-03: the Overview, for everyone on the
team** (Hillary, 2026-11-03: every team member has an Overview, its
tiles chosen by their departments), at `/staff/overview`, first in the
menu and where the console opens (`everyone: true` in `sections.tsx`).
`GET /api/staff/overview?unit=week|month|year&period=…`
(`apps/api/src/routes/overview.ts`) answers the sections the viewer may
see, each tile once: **The business** (Executives and the Board: new
users, new listings, offers made, confirmed deals, value swapped,
revenue; Executives also active users, live listings, paying and
verified stores, open reports, appeals waiting); **Trust and safety**
(reports received, handled, handled by you, actions taken, open reports,
waiting over 2 days, users suspended or banned; leaders also appeals
decided, appeals waiting, stores to verify); **Sales** (new stores, store
passes sold, stores to call as the tab counts them, passes ending soon,
lapsed passes, paying stores; `storeRows` and `toCall` now exported from
`routes/sales.ts`); **Finance** (revenue, payments made and failed, store
passes and boosts sold); **Marketing** (new users, active users, listing
views, number reveals); **DevOps** (a line: nothing recorded until Phase
7). **Each section is a tab** (Hillary, 2026-11-03, for information at a
glance): The business, Trust and safety, Sales, Finance, Marketing,
DevOps, only those the person has (one alone has no tab strip; on a phone
"Business" and "Trust" and the strip scrolls). Each tab is whole: a tile
two departments share (Revenue in The business and Finance) is in both,
worked out once a request. Test payments never count; a tile says how
many it left out. Week, Month or Year and which one; a tile of what
happened, tapped, shows its chart under the tab's tiles (each tab keeps
its own pick). The skeleton
takes each person's shape from their departments (`overview/shape.ts`,
the API's lists again). Tested as Tafadzwa (Trust and safety leader and
Sales; then in every department for a moment, as the super admin sees
it: six tabs) and Rumbi (member), on a laptop and a phone.
Planned with Hillary from the previous app's role dashboards
(`../swap-and-top/docs/ADMIN_DASHBOARD_DOCUMENTATION.md`).

**Also 2026-11-03: My overview**, the first tab of
the Overview, the cards a team member chose and ordered themselves
(Hillary, 2026-11-03). Its button, the gear with the words "Customize
my overview" (only the big button of the same name while the tab is
empty), opens the sheet of that name
(`app/staff/overview/CardsSheet.tsx`), set as Android's quick settings
tiles are edited (Hillary, 2026-11-03): Your cards two to a row in their
order, and every card of the person's own departments two to a row, by
department, each with a tick box. A card is dragged with a mouse
anywhere on it (after a 4 pixel move, so a click is not a drag) or with a
finger by its six dot grip, at the card's right end so the hand does
not hide the card (Hillary, 2026-11-03), so the sheet still scrolls: a faded copy
follows the pointer, drawn inside the sheet's own dialog (a modal
dialog is above everything, so a copy on the page body was hidden), and
the card's place turns to a dashed slot that moves to the nearest place
as it goes, the others making room; letting go drops it there. Arrow
keys on the grip move it one place (left, right) or a row (up, down).
While a card is dragged the sheet's dialog has `grabbing`, so the
cursor stays a closed hand over the other cards and the tick boxes.
Names wrap to two lines. Save, off until something has changed (a card ticked or
unticked, or the order; back as it was, off again), sends
`PUT /api/staff/overview/cards` (it refuses a card not theirs) and keeps
them in the new table `staff_overview_cards` (person, cards in order;
migration `0012_new_gideon`, run on the shared database on 2026-11-03
with Hillary's yes). `GET /api/staff/overview` gives My overview first
(`key: 'mine'`, cards they can no longer see left out) and `choices`.
Once it has cards the page opens on it; until then on their first part
of the team, and the tab says "Pick the cards you want to see here" with
a Choose your cards button. No My overview for DevOps alone (no cards to
choose). The skeleton opens on My overview in its shape from the count
kept in the browser (`snt-overview-mine`). Tested as Tafadzwa and Rumbi
(saving, the order, a card not theirs refused, the reload opening on it,
the sheet on a phone); their test cards deleted after.

**Also 2026-11-03, small things for Hillary:** Save
on Customize my overview waits until the Overview has been read again,
so the sheet closes onto the new cards (Save spins meanwhile). The
Overview's skeleton always shows eight cards, four to a row, and the
chart. The account menu, when taller than the screen, hides the
browser's scroll bar (its lane showed the panel's blue beside the bands)
and draws its own thin white bar with a blue edge, in from the right and
clear of the corners (`AppMenu.tsx`, `.scrollBar`). Every password box
has the sign in page's eye: built into `Field` for `type="password"`
(the staff password, Settings), and added to the reset page's two boxes;
the eye drawings moved to `packages/ui/src/primitives/PasswordEye.tsx`
(`EyeOpen`, `EyeClosed` from `@snt/ui`). On a phone the Overview's (and
Stores') tab strip stays inside the page and slides on its own: its
style had `max-width: none`, which let it grow to every tab's width and
pushed the whole page wide; it is `max-width: 100%` now. Every
dropdown (the shared `Dropdown`) picks on a tap, not on touch: it picked
on `pointerdown` and cancelled the touch, so a finger could not scroll a
long list (the Overview's 104 weeks); now a finger's press is left to
the browser, a drag scrolls (`touch-action: pan-y`, `overscroll-behavior:
contain`) and `click` picks, while a mouse press still keeps the focus
on the pill.

**Also 2026-11-03: Verify stores is a tab of Stores,
and the menu is in Hillary's order.** Stores (`app/staff/stores`) shows
the tabs each person has: All stores and Stores to call for Sales,
Verify stores for Trust and safety leaders (the super admin, all
three); one tab alone shows no tab strip. The Verify stores page moved
to `stores/VerifyTab.tsx` (its styles to `stores/verify.module.css`),
unchanged inside; `/staff/verify` redirects to `/staff/stores?tab=verify`.
Each tab shows its own count once it has loaded. The Stores section shows
for Sales and for Trust and safety leaders (`leadersOf: 'trust_safety'`
in `sections.tsx`). The menu: Overview, Reports, Appeals, Users, Team
members, Stores, Revenue (Hillary did not name it; put after Stores),
Activity log. Tested as Tafadzwa (Trust and safety leader, in Sales) on
a laptop and a phone.

**The Overview went live** on 2026-11-03 (`main` fast forwarded to
1d82a99 at Hillary's word). Phase 6 is built and live.

**Phase 7 started 2026-11-03: Growth, the Marketing section (live,
ac67c91).** Hillary chose Marketing first, then DevOps. At
`/staff/growth` ("Growth" in the menu, after Revenue; department
`marketing`), `GET /api/staff/growth?unit=month|year&period=…`
(`apps/api/src/routes/growth.ts`): a month or a year beside the one
before. Tiles: visitors, visits, new users, active users (30 days).
"Visits over time" and "New users over time" as lines (this period green,
the one before blue; a period still running stops at today, the readout
saying "Not yet"; `Series.values` may now be shorter than the buckets in
`revenue/charts.tsx`, Revenue unchanged). Tables: where visitors come from
(Umami), where new users came from (with how many went on to post), top
searches (only those made 5 times or more), each category's listings,
views, number reveals and Wanted listings; and boosts (started, views and
reveals while boosted). Totals only: a figure about fewer than 5 users
shows "Under 5", sources under 5 are put together as Other.
**Umami (Hillary, 2026-11-03):** she uses Umami (on Dokploy) and the
final hosting may not be Vercel. No Umami is running for this site yet,
so `apps/api/src/umami.ts` answers **sample figures**, steady for each
day, and the page says so in a yellow strip. Everything is ready to
connect: see "Waiting on the owner". **What we record ourselves**
(migration `0013_mysterious_slipstream`, run with Hillary's yes on
2026-11-03): `people.signup_source` and `signup_campaign` (the browser
keeps the first visit's `utm_source`, else the referring site, else
"direct", and `utm_campaign`, in `snt-first-source`,
`apps/web/src/lib/firstSource.ts`; sent once after sign in to `POST
/api/me/source`, kept only for an account made in the last day);
`search_counts` (a row a term a day and a term a month, counted up by
`POST /api/searches` from the search box's `goToResults`; lower cased,
emails and phone numbers taken out, no one's name; day rows cleared
after two months, month rows kept); and, for DevOps next,
`request_issues` (each server error or request over 2 seconds: route
pattern, method, status, time; kept two months) with
`request_issue_months` (counts and total time a month a route, kept),
from `apps/api/src/recordRequests.ts`, **live site only**
(`NODE_ENV=production`), since a laptop's trips to the database in
Ireland are slow anyway. **Retention, Hillary 2026-11-03:** keep a year
to compare; if a year of detail is a lot, keep detail about two months
and condense each month into totals, so one year can be put beside the
next. That is what the tables do. **Tested:** the endpoints (Growth
refuses anyone outside Marketing; a search is cleaned and counted; an
old account's source is left alone) and the queries run directly
against the shared database; the page itself on a throwaway preview with
sample figures on a laptop and a phone (deleted), and its skeleton lines
up with it to within 3 pixels. **Not seen with real rows:** adding a
test account to Marketing was refused as a permission grant; Hillary as
super admin can see it. Test rows deleted.

**Also 2026-11-03: Health, the DevOps section (live, ac67c91).** At
`/staff/health` ("Health", last in the menu; department `devops`),
`GET /api/staff/health` (`apps/api/src/routes/devops.ts`, the figures in
`healthReport()`), read again every minute. No controls. Now: the
database's answer time (a second `select 1`, so not the connection's
opening), its connections of the most it allows (`pg_stat_activity`,
`max_connections`), its size, the store pass check ("Keeping up", or
"Behind" with ended passes over 15 minutes old not dealt with and
suspensions not lifted), and the deploy running ("Running now": the
commit, its message and branch from Vercel's own settings, or
`COMMIT_SHA`, `COMMIT_MESSAGE` and `COMMIT_BRANCH` on another host; on a
laptop it says it is not a deploy). Then the last 30 days from
`request_issues`: errors, slow requests and their average time, a line
chart by day (errors purple, slow blue), by route, the latest 20, and
each month's totals for the last year from `request_issue_months`. Off
the live site a yellow strip says nothing is recorded there. Only route
patterns, never addresses or users. The Overview's DevOps tab now points
to Health. **Tested:** the refusal for anyone outside DevOps, the report
run directly against the shared database, the page on a throwaway
preview with sample figures on a laptop and a phone (deleted), and its
skeleton lines up with it. **Not seen with real rows:** no test account
is in DevOps (adding one is a permission grant); Hillary as super admin
can see it. **With Health, Phase 7 is built.**

Growth and Health went live on 2026-11-03 (ac67c91). Where the next
agent starts is at the top, under "Where we stopped".
Ask Hillary before building, show her the page in the browser, and
build what she picks. Offered and not yet chosen: an export of Stores
for Sales leaders (no phone numbers), a mark for store owners who say
no to being called, and a payments by day chart. Not seen with real
rows yet: Stores and Revenue, as no test account is in Sales or
Finance (Hillary, as super admin, can see both). False reports and bulk
actions come later. Parked at Hillary's word: renaming the `people`
table to `users` (it needs a stand in view during the deploy).

**What was done on 2026-10-30 (newest last):**

- The note on every decision (item below, "Done 2026-10-30").
- Reports: in a report's sheet, Posted by (or User) and Reported by open
  that user's record.
- Users (was People): a table of every user with search, a standing
  filter with counts and pages; a user's record with pills, small
  toolbar buttons, facts in two columns and small tables of actions,
  reports about them, reports they sent and listings. Details in item 2.
- Words, at Hillary's request (now CLAUDE.md rule 11): "leader" or
  "departmental leader", never "lead"; "user", never "people" or
  "person", on screen and in API messages. The section and its routes
  are `/staff/users` and `GET /api/staff/users` (`routes/users.ts`).
- The shared `Dropdown`'s open list grows to fit its longest option, so
  an option and its count stay on one line.
- The shared page buttons (`Pager`): "Prev" and "Next"; below 768px one
  compact line beside "1 to 10 of N" (words, small numbers with no
  outlines or hover ring, the page on show in bold, up to five numbers);
  the button tapped spins until its page has come.
- A look at a user's record is logged at most once in ten minutes.

**Also 2026-10-30, after that:** a user's page in
Users, redone at Hillary's request. The page is titled "User"; one card
holds their initials, their name with their place on our team beside it
("Dpt. leader", short for department leader so the pill stays small, in
the Users list too; "Member" or "Super admin"), their standing under the name as a small pill in the regular
weight (so it does not compete with the team pill), then their details in
two columns, one column below 768 pixels (where the tiles go two by
two). Under it, four white tiles
with counts: Actions taken, Reports about them, Reports they sent,
Listings; each opens that list as a full table at
`/staff/users/{id}/{list}` (`actions`, `reports`, `sent`, `listings`,
`app/staff/users/[id]/[list]`) with "Back to <name>". The record's data,
pills and table are shared in `app/staff/users/[id]/shared.tsx`
(`useUserRecord`), so a list opens at once from the page.

**Also 2026-10-30: Appeals reviewed with Hillary.**
`GET /api/staff/appeals?show=all|waiting|upheld|overturned` (with
`counts`) now lists every appeal about users the leader may act on: the
waiting ones first, oldest first (never one against the leader's own
decision), then the decided ones, newest first, each with its outcome (by
whom, when, the note). The page (`app/staff/appeals`, its own
`page.module.css` started from Reports') is a table set as Reports' (the
user's initials and name, the decision as a pill, reason, decided by,
appealed, then a small Decide or an Upheld or Overturned pill), one compact
line each below a laptop (the name and decision, then the appeal's opening
words), waiting ones unread (bold, a blue dot). One filter pill with
counts. A row opens the full appeal in a sheet (their record a tap away;
Uphold or Overturn, each asking the required note; once decided, the
outcome and its note). The skeleton matches. In both the Appeals and the
Reports sheets the facts are information, not links: each label on top
in bold and its value under it in the regular weight, both dark grey
(`--snt-card-ink`), pair after pair with a little room between, only names that open a record blue and underlined (`personLink`),
and room before the buttons under them. Tafadzwa (0006) signed in by
phone again on 2026-10-30, in the browser and by script.

**Also 2026-10-30: Verify stores reviewed with
Hillary.** `GET /api/admin/verifications?show=all|waiting|verified|declined`
(with `counts`) now lists every request from an open store: waiting ones
first, oldest first, then decided ones, newest first, each with its
owner's id and, once decided, by whom, when and the note. **Verify now
needs a note too**, as Decline did (`note`, 2 to 300 letters, "Say why you
decided this"): kept on the request for either decision; only a decline's
note is shown to the owner (their store's verification standing), a
verify's is for the record. Both decisions are now in the Activity log
(`store.verify`, `store.decline`, with the store's name and the note;
searchable by "verify", "declined" or "store"). The page
(`app/staff/verify`, `page.module.css` started from Appeals') is the same
table: the store's initials and name, owner, the kind of business as a
pill, the registration or licence number, asked, then a small Decide or a
Verified or Declined pill; one compact line each below a laptop (the
store's name, then the owner and kind); waiting ones unread; one filter
pill with counts; a matching skeleton. A row opens a sheet: what to check
(while waiting), then Store, Owner (their record) and Phone (tap to
call) as blue links, Business, the number, Area, Asked, and once decided
Outcome and Why; View the store; Decline and Verify, each asking for the
note. **Test data left in on purpose (Hillary asked):** three test stores
and their requests: Test Mbare Phones (Tarisai, 0001) and Test Borrowdale
Gadgets (Kuda, 0004) waiting, Test Chitungwiza Electronics (Tinashe,
0003) declined by Tafadzwa. Ids `test-s-mbare`, `test-s-borrowdale`,
`test-s-chitungwiza` (with their `store_members` owner row) and
`test-vr-mbare`, `test-vr-borrowdale`, `test-vr-chitungwiza`. To remove
them, delete the requests, the members, any notifications and
`staff_log` rows about them, then the stores.

**Verification, to add later (Hillary, 2026-10-30: noted, not now).**
What a store must show is in `docs/product/accounts-and-stores.md`
("Verification"): a registered business, its certificate of
incorporation and the owner's national ID matching a director; an
informal trader, a council vendor or market licence and the owner's ID;
every store, a verified phone and an address with a photo of the shop
front or a short video call. Today the owner only types the kind and the
number, and our team calls to see the documents. Later: the owner
uploads photos of the documents (and the shop front) with the request,
shown in the Verify stores sheet; the yearly check; pausing the badge
after serious upheld reports. Hillary asked whether a tax clearance
should count too; not decided.

**Also 2026-10-30: Team reviewed with Hillary.** One table set as
Users': the search box, a filter pill by department with counts ("Whole
team", then each department the viewer manages) and a small Add a user
in the toolbar; "N on the team"; a row per member (initials, name with
"You" on your own, phone) and a column per department showing "Dpt.
leader", "Member" or nothing; one compact line each below a laptop, their
departments as small pills. Search and the filter run in the browser (the
team is small; `GET /api/staff/team` is unchanged). A row opens a sheet:
one line per department with Not in, Member and Leader, each saving at
once (PUT or DELETE `/api/staff/team/{personId}/{department}`, as
before); Leader faded for anyone but the super admin, a leader's row and
your own locked, with a line saying who can; View their user record;
Remove from the team (super admin); Done. The sheet stays open when
someone is taken out of every department, so they can be put back. Add a
user finds someone and opens the same sheet. Tested as Tafadzwa: Rumbi
taken out and put back as a member (log rows removed after). The
section is called "Team members" in the menu and the page title (its
short label on a phone stays "Team").

**Also 2026-10-30: the user's appeal page** (`app/appeal/[id]`), which
is also the banned page. The decision card has a pill beside its heading
("Warning", "Listing removed", "Suspended", "Banned", or "Overturned"),
in the tones of the staff Appeals page, and Date and Reason as label
lines; the appeal card has "Waiting", "Overturned" or "Stands". Under the
box, "At least 10 characters" until there are, so a grey Send appeal is
explained; no resize grip; a shorter waiting message. Hillary had already
done the banned page; it was checked with the new look (a test ban on
Kuda, removed after).

**Also 2026-10-30: a design pass on the Store console.** Hillary thinks
it looks fine; small things fixed: on Leads the offer form (price and
message side by side, Send offer across under them; it was squashed in
the narrow pane) and the requester's line no longer says "joined" with
no date; `/console` opens Stock (`app/console/page.tsx`); Leads, Offers,
Stats and Store profile show their skeletons while their data loads
(each `loading.tsx` exports its bones: `LeadsBones`, `OffersBones`,
`StatsBones`; `StorefrontBodySkeleton own`); Store profile shows no
Show contacts or Follow on the store's own view and counts "N live"
(`StorefrontBody own`); Stats says "Your best listings". Page widths
stay as they are (Hillary): Stock and Leads full width, the rest in a
column.

**Also 2026-10-30: Show contacts never shows a made up number.** When
the API cannot give the number (offline, an error, the listing gone or
the store closed), `recordReveal` and `revealStoreContact`
(`lib/reveals.ts`) answer `failed` and `RevealAction` says so in a toast
("We could not get the number. Try again in a minute.", or the API's
words), instead of the sample number it showed before. The store page's
Show contacts no longer passes a fixed owner (`u-kopje`). Sample
listings in a build without database settings no longer show a sample
number.

**Also 2026-10-30:** the sign in sheet (`packages/ui/src/auth/SignIn.tsx`)
says "Continue with email or phone", not "Continue with email".

**Also 2026-10-30: stores on Me, at Hillary's
request.** Me's "For stores" is one small row, "My stores" with the
count (or "Open a store" with none), opening `/me/stores`
(`app/me/stores`): one row a store, with "Paid until …", "Free store" or
"Staff", each opening that store's Store console. Edit store details and
the store pass are no longer on Me: the console's Store profile has
"Extend store pass" beside "Edit store details" (owner only), and a free
store's "needs a store pass" screen has "Edit store details" under "Get a
store pass".
Two flashes fixed with it: Me's loading screen (`app/me/loading.tsx`)
still had the old "Switch to Store console" row, and My stores, having
no loading screen, showed it; My stores now has its own. And the
console's gate (`app/console/layout.tsx`) read `?store=` in an effect, so
the store opened before showed for a moment (its "needs a store pass"
screen, say); it now reads it as the page draws (`useSearchParams`, in a
Suspense boundary).

**Also 2026-10-30: store listings are the store's.**
Hillary saw Tinashe's Kopje Computers listings in his My listings too.
Now:
- My listings (`GET /api/me/listings`) is a person's personal listings
  only (`storeId` null).
- A listing posted as a store, by its owner or a staff member, is the
  store's: only the store's current owner and staff change it (`mayManage`
  in `routes/post.ts`, for edit and status; boosts already did this). A
  staff member removed from the store keeps no access to what they
  posted, and running boosts are listed for a store only to its members.
  The listing page shows its owner's tools by the same rule
  (`useOwnsListing` in `@snt/core`, in Sale, Swap and Request details).
- A free store (no pass, so no Store console) is looked after on its own
  page, `/me/stores/{id}` (`app/me/stores/[id]`): its listings as cards
  (`GET /api/me/listings?store={id}`, members only), and for the owner
  Get a store pass and Edit store details. My stores opens a free store
  there and a store with a pass in its console. Moving a listing into or
  out of a store is still the store owner's alone.
- The rest of the app's "is this mine" checks (the feeds leaving out your
  own posts, offers on your listings) still go by who posted it; only
  managing a listing changed.
- Posting: Post New Item's "Post as" (`components/PostAs.tsx`) now starts
  on the person themselves, their name first and then their stores; it
  used to start on their first store. It is the only way a free store
  posts; a store with a pass can also use Add stock in its console, which
  is always for that store.
- Post as is outlined in the blue before it is opened
  (`PostAs.module.css`, `.choice`).
- Edit store details loads in its own shape (`app/store/[slug]/edit/
  Skeleton.tsx`, used by its `loading.tsx`, the page while the store
  loads, and the Verified store panel while its standing loads), so
  nothing shifts.
- The Store console's Leads badge was the old mock number on every page
  (`newLeadCount` from `@snt/core`'s mock leads). Now the console's gate
  reads the store's real leads (`storeLeadsQuery` in `lib/storeLeads.ts`,
  the same query the Leads page uses) and passes the count of new ones to
  `ConsoleShell` through `ConsoleLeadCountContext` (`@snt/ui`); none new,
  no badge. Pages no longer pass `newLeadCount`. Leads shows a plain
  message when a tab is empty ("No matching requests yet", "No number
  reveals yet") instead of a bare list or an empty table.
- **Lead settings, saved per store (migration `0009_icy_gressill`, run
  on the shared database with Hillary's consent, 2026-10-30).** Table
  `store_lead_settings` (one row a store; no row means the defaults):
  `match` (`stock` or `categories`), `categories`, and `alerts` (jsonb:
  on or paused, WhatsApp number, quiet hours, swaps, a least budget).
  `GET` and `PUT /api/stores/{id}/lead-settings` (owner and staff;
  Whole categories needs one category), in `routes/leads.ts`
  (`leadSettingsFor`). "Show me leads for" (Items in my stock, or Whole
  categories) now decides the Leads list as well as the alerts: with
  Whole categories, `GET /stores/{id}/leads` takes requests in the chosen
  categories even with nothing in stock. The sheet is "Lead settings"
  (Hillary: the leads choice is its own setting, alerts a part of it):
  "Show me leads for" at the top, full width, then a "Lead alerts" part
  with its price line and the alert options in two columns; the button
  beside the alerts pill says "Lead settings". It
  (`components/leadAlerts/LeadAlerts.tsx`) reads and saves through
  TanStack Query for the open store; the old browser only store
  (`useLeadAlertStore` in `@snt/core`) is gone. Defaults: Items in my
  stock, alerts on, WhatsApp off (the sample number is gone). Alerts are
  still not sent; swaps and a least budget only shape alerts, not the
  list. Deleting a store for good now also needs its
  `store_lead_settings` row deleted first.
- **Phase 6 started (committed and live 2026-11-03).** Business definitions agreed with
  Hillary, in `docs/product/staff-console.md`, "Business definitions":
  active is used in 30 days; value swapped is confirmed deals, money
  only; test payments show marked Test; the order is Stores to call,
  Money, Overview, Board summary. **Stores** (`/staff/stores`, the
  sidebar's "Stores"; API `routes/sales.ts`, department `sales`): two
  tabs, at Hillary's asking. All stores: every open store with owner,
  live listings and pass, filtered by free, paid or verified. Stores to
  call: stores near the free limit (12 of 15), passes ending within 3
  days or lapsed, and users near the limit of 5 with no store, filtered
  by each. The fullest first; a number shows one at a time
  on Show number and each look is logged (`sales.phone`). **Only the
  refusals are tested so far:** no account available to test with is in
  Sales, so the page has not been seen with rows (Hillary, as super
  admin, can see it). Still to do from the
  design: export for leaders (no phone numbers), and a store owner saying
  no to being called (a line in the terms, and a mark on the store).
- **Revenue (Phase 6, live; was "Money", renamed at Hillary's
  asking).** `/staff/revenue`, `routes/revenue.ts`, department `finance`.
  One row of controls scopes the page: Week, Month or Year; which one;
  "Compare with the ... before" (on at first); "Include test payments"
  (on by default while no real payment exists, with a plain note that
  test payments are not real money). Four tiles (revenue, paid, failed,
  pending) with the change on the period before; "Revenue over time" as
  Bars or Line (this period brand green `#1cb67f`, the one before brand
  blue `#255dab`; days of a week or month, months of a year); "Revenue by
  product" as Pie (a donut) or Bars; the same figures as a table; the
  period's payments with a filter. A Finance leader downloads the period
  (`/staff/revenue/export`, `revenue.export` in the log). The charts are
  hand drawn SVG in `app/staff/revenue/charts.tsx`, to the dataviz skill
  (palette validated: the pair and the four product colours pass; green
  and yellow are under 3:1 on white, so every chart has a legend or
  labels and a table). Checked by eye with sample figures on a throwaway
  preview page (deleted); the real page is not yet seen with data, as no
  account available to test with is in Finance (Hillary can see it as
  super admin).
- **Revenue, then (2026-11-02):** Day as well (hour by hour), and
  Compare with any period of the same length, not only the one before
  (`against`; the "Compare with" choice shows while Compare is on). The
  Day, Week, Month, Year switch and the charts' type switches are small
  pills (`ChipRow`), not the large `Segmented`, which looked wrong in the
  toolbar. **Test payments left in on purpose (Hillary asked):** 2,075
  payments from 1 Nov 2024 to 2 Nov 2026 (provider `test`,
  `provider_ref` starting `test-seed-`), paid by the test accounts for a
  closed store "Test Revenue Store" (`test-s-revenue`), with 1,579
  store passes on it marked reminded and settled (so nothing lapses or
  notifies). To remove: delete `store_passes` where `store_id =
  'test-s-revenue'`, then `payments` where `provider_ref like
  'test-seed-%'`, then the store.
- **The top loading bar on in page fetches (2026-11-02):** the yellow bar
  now also runs while a page fetches without moving (another month,
  filter, tab or page of rows): `useLoadingBar(query.isPlaceholderData)`
  from `lib/loadingBar.ts`, counted by `PageLoadBar`, shown after a
  tenth of a second, filled and faded when done. Used on Revenue,
  Stores, Users, Reports, Appeals, Verify stores and the Activity log.
- **The account menu's staff pill (2026-11-02):** under the name, a small
  pill "Super admin" or "Staff member" (no icon, regular weight, tooltip
  "Go to the Staff console"), for anyone on the team; it opens the Staff console at their first section
  (`StaffHomeContext` in `@snt/ui`, given by `components/
  StaffHomeProvider.tsx` in the root layout), the password asked first.
  The profile's Staff console row has the new `TeamIcon` (three people).
- **Data requests (built, tested and live).** Migration
  `0011_uneven_clea` (`people.deleted_at`), run on the shared database
  with Hillary's consent. `routes/dataRequests.ts`: on a user's page,
  "Data request" (Trust and safety leaders and the super admin, on
  someone they may act on; `app/staff/users/[id]/DataRequest.tsx`) offers
  Download their data (`GET /api/staff/users/{id}/data`, one JSON file,
  logged as `person.export`; never who reported them or our team's
  notes) and Delete their account (`POST .../delete`, a required note,
  `person.delete`, cannot be undone). Delete removes name, phone, email,
  area, saved listings, notifications and the Supabase sign in; withdraws
  their personal listings, their waiting offers, and closes stores they
  own with their listings; keeps deals, reports, decisions and payments
  under "Deleted user". Refused for anyone on our team (take them off
  first) and while banned or suspended (it frees the phone number, so it
  would dodge the ban). The row keeps `authUserId`, so a sign in left in
  a browser is turned away (`code: 'deleted'`, app.ts; the web app signs
  it out) instead of making a new account. Deleted accounts leave the
  Users list and cannot be acted on. Tafadzwa (0006) now has the test
  password `testpass123` too.
- **Staff password.** The Staff console now asks for
  the account's password (the one set in Settings; checked against its
  email, or its phone when it has none) once a day on each device,
  besides the phone code. `POST /api/staff/unlock` (`routes/
  staffUnlock.ts`) checks it with Supabase Auth and gives a staff pass
  for 12 hours (`staffPass.ts`: the person and its end, signed with a key
  made from `SUPABASE_SECRET_KEY`, so nothing new on Vercel). Every other
  `/api/staff/...` and `/api/admin/...` request needs it in `X-Staff-Key`
  (app.ts), or answers 401 `code: 'staff-key'`. Five wrong passwords in
  15 minutes and it stops trying for 15 minutes. Unlocks and wrong
  passwords are in the Activity log (`staff.unlock`,
  `staff.unlock-failed`). The web app keeps the pass in localStorage
  (`lib/staffPass.ts`, `snt-staff-pass`), sends it from `apiAsViewer`,
  and drops it when the API turns it down; `app/staff/StaffUnlock.tsx`
  is the password screen (with Set a password, to Settings). **Before
  pushing it live:** Hillary, Patrick and Ray must each know their
  password (set one in Settings if not), or they cannot open the
  console. Rumbi (0005) now has the test password `testpass123`.
- **Sealed second super admin (built and tested).** `people.sealed` (migration `0010_nervous_madame_masque`, run
  on the shared database with Hillary's consent, 2026-10-30; every
  account starts not sealed). A sealed account is a super admin kept for
  emergencies. When it opens the Staff console (`POST /api/staff/unlock`)
  the log says `staff.sealed-use` (not `staff.unlock`) and every other
  super admin gets an `account` notification at once ("The sealed super
  admin account just opened the Staff console. If that was not planned,
  act now.", to the Activity log); the pass says `sealed`, and the
  console shows a red strip across the top the whole time
  (`app/staff/layout.tsx`). Nothing in the app makes an account sealed:
  Hillary creates the second account herself and gives its email, and it
  is set by hand (role `super_admin`, `sealed` true). Tested 2026-10-30
  by marking Rumbi (0005) sealed while still a member (making a test
  account a super admin was refused as a permission grant): the log
  entry, Hillary's notification and the strip all came; then put back
  and the test rows deleted.
  **Making a super admin is database only** (Hillary, 2026-10-30; no
  button in the app, by design): the steps are in
  `docs/product/staff-console.md`, "Making or removing a super admin".
  Hillary is adding one person herself in Supabase. Record who and when
  here once done.
- The profile's Staff console row links straight to the person's first
  section (`useStaffHome` in `app/staff/sections.tsx`), not `/staff`,
  which drew an empty frame and then redirected. `/staff` stays for a
  typed address.
- The footer came off the task pages: Settings, Edit store details, Open
  a store and the appeal page. It stays on the profile (the only way a
  signed in user reaches Terms, Privacy and Contact), sign in and sign
  up, and the information pages. Settings without it was not looked at
  in the browser (Hillary stopped that check), so look at the foot of
  those pages next time.
- Sheets (`packages/ui/src/primitives/Sheet.tsx`): the rounded panel
  stays still and a box inside it scrolls, to the panel's edges. The
  browser's scrollbar is hidden there (Firefox and Zen drew it into the
  round corners, where it was cut) and the sheet draws its own thin blue
  bar (`.thumb`, `useScrollThumb`), 18 pixels clear of the top and bottom,
  that follows the scroll and can be dragged. The Lead settings heading
  shows the gear.
- The two scrollbars of this kind (dropdown lists, sheets) are the
  outlined buttons' blue (`--snt-control-idle`), the filled blue
  (`--snt-control-active`) on hover: plain to see.
- Stock loads in its own shape all the way: while its stock comes, the
  table shows rows of bones (`StockBoneRows`, from its `loading.tsx`)
  rather than an empty table; and the console's gate
  (`app/console/layout.tsx`) shows the console's frame in bones
  (`Waiting`) while the sign in and who it is come, where it showed a
  blank page. `ConsoleShell` shows a bone for a store with no name yet.
  Then, at Hillary's asking, all at once: Stock shows its whole skeleton
  (now with the Stock and Boosted tabs and the count line) until its
  stock has come, then the real page in one go; the gate's `Waiting`
  shows the page's own skeleton from the first moment for Stock, Leads,
  Offers, Stats and Store (`SKELETONS` in `app/console/layout.tsx`); and
  `components/BoneContinuity.tsx` (in the root layout) marks the page
  once bones have shown half a second, so a skeleton that takes over
  from another shows at once rather than blinking out for its first half
  second (`:root[data-bones-shown] .bone` in `Skeleton.module.css`).
- Leads the same way: it returns its whole skeleton (`leads/loading.tsx`)
  until its leads, number reveals and lead settings have all come, then
  the real page at once. The skeleton now matches: two tabs, the alerts
  pill and Lead settings, and lead cards line for line (a Wanted card 270
  pixels and a swap card 342, as the real ones). New standing rule 12 in
  CLAUDE.md: one skeleton that matches, then the page; check both.
- A console page's skeleton is put up two or three times while it
  loads (the gate's, the route's `loading.tsx`, the page's own): the same
  shapes, but each restarted its pulse, a shade apart, which read as a
  flash. `BoneContinuity` now sets every bone's pulse to one shared clock
  as it arrives (`animation-delay`), so a swap for its twin cannot be
  seen. Measured: the bones' shade across a swap differs by 3 in 255 or
  not at all.

**What comes next, in Hillary's order (do them in this order):**

- **Done 2026-10-30: a note on every decision.** Approve (any action)
  and Clear on a report (`POST /api/staff/reports/{id}/decide`), warn,
  suspend and ban on a person (`POST /api/staff/users/{id}/action`) take
  a required `note` (2 to 500 letters; "Write a short note saying why"
  when missing), and upholding or overturning an appeal already took a
  required `reason`. The Reports page has one decision sheet for both
  (`DecideSheet` in `app/staff/reports/PageContent.tsx`): Approve with
  its action and reason, Clear with only the note, the button off until
  there is a note; Take action on a person's record the same. The note is
  kept on the decision (`moderation_actions.note`, no migration) and in
  the `staff_log` detail (`note`; for an appeal, its reason), and shows
  in the report's sheet ("Why", from `outcome.note` in
  `GET /api/staff/reports`), the person's record (beside each action and
  each decided report) and the Activity log ("… Why: the note").
  Tested through the API as Rumbi on REP 2026 0015 (cleared) and 0016
  (warning) and a warning on Kuda, each refused without a note and taken
  with one, and in the browser (Clear off until a note is typed); then
  all of it put back: 0015 and 0016 are open again, no test decisions,
  notifications or log rows left.
1. **Done 2026-10-29: button actions on TanStack Query mutations.** No
   tap calls the API directly any more (the only `apiAsViewer` left is
   `loadAccountData`, which runs inside the account query). Each is a
   `useMutation` with `apiSend` (or `publicSend` for sign up and the email
   code), its busy state from `isPending` (held on with `isSuccess` where
   the page moves on, so it cannot be sent twice), and the cache refreshed
   after: posting (`['me']` and the store's `stockKey`), Add stock and Bulk
   import (`stockKey`), your name and verify phone (`setViewerData` in
   `lib/viewer.ts`), the Report sheet, Show contact (`RevealAction`),
   owner tools (`useSaveStatus` in `lib/listingStatus.ts`, shared with
   Stock: changes at once, put back if refused; moving to a store too).
   Offers, deal checks, saving, notifications read and boosts stay in the
   `@snt/core` stores (which show the change at once), and their calls in
   `lib/accountData.ts` run through `runMutation` and then
   `refreshAccount` (`lib/query.tsx`), which reads the account query
   again. Boosts stopped here stay marked stopped across that refresh.
   Tested in the browser as Tarisai: post, pause, relist, delete, save and
   unsave (the account data read again after), report.
2. **Reviewed with Hillary so far: the Activity log, Reports (2026-10-29) and Users (2026-10-30).** Every report
   stays in one table, decided or not (`GET /api/staff/reports?show=`
   `all|open|claimed|warning|removal|suspension|ban|cleared`, with `counts`
   for each): waiting ones first, oldest first, then decided ones, newest
   first. The filter is one dropdown with counts ("All reports (4)"). On a
   laptop a table set as the Activity log's (photo, reason pill, listing,
   posted by with their record, reported by, when, status; short rows, a
   small Claim the size of the Activity log's page buttons); below a laptop
   each row is one compact line, as an email in Gmail: the photo, the
   reason pill with the number, the listing cut to one line, and Claim or
   the outcome at the end (who posted and who reported are only in the
   report itself). The filter is a blue outlined pill, as the Activity
   log's Filters is, its counts in small rounds as on the tabs (the shared
   `Dropdown` now takes an option `count`; its list's scrollbar is thin,
   pale blue and set in from the edge, in every dropdown: the rounded card
   stays still and the options scroll inside its padding, so the corners
   stay round in Firefox and Zen too). **Left in on purpose, at Hillary's request
   (2026-10-29):** three test reports, REP 2026 0014 to 0016 (from Tarisai
   and Kuda, their notes start "Test:"), so the page can be seen with
   reports in it; delete them by id when Hillary says (with any decisions
   and log rows they gain). Farai D.'s ban and removed listing are also
   Hillary's test data: leave them. Open ones read as unread: bold, a blue dot in
   the margin, a Claim button. Reason pills: red for stolen, amber (the new
   `warning` Badge tone) for fake, not as described, offensive, no show,
   grey for the rest. A row opens the full report in a sheet (Claim, then
   Clear or Approve; buttons side by side). The Activity log shows a
   report by its full number, "REP 2026 0014" (`reportLabel` in
   `routes/reports.ts`, kept in the `staff_log` detail as `reportLabel`;
   older entries get it looked up in `routes/activity.ts`). In a
   report's sheet, Posted by and Reported by open that person's record.
   **Users and a user's record (2026-10-30), reviewed with Hillary** (was
   People; renamed at her request, and "lead" is "leader" or
   "departmental leader" on screen): `GET /api/staff/users` now lists everyone, newest first, 10 to 40 a
   page with the total, `q` for a name or number and `show`
   (`all|good|warned|suspended|banned|team`, with `counts`). The page is
   set as Reports: the search box and one filter pill with counts, the
   table (initials, name with a team pill, phone, area, joined, live
   listings, reports, a standing pill: grey, amber, red, dark for banned),
   one compact line a person below a laptop, and the shared `Pager`
   (`app/staff/Pager.tsx`, used by the Activity log too, `usePageSize`
   remembering the size per page). Below 768px the pager is one compact
   line beside "1 to 10 of N" and the gear, never stacked: "Prev" and
   "Next" as words, small numbers with no outlines, the page on show in
   bold, and only it and two either side (Hillary, 2026-10-30), with no
   ring on hover; a laptop keeps the outlined pills. "Prev" on both. The
   button tapped shows a small spinner until its page has come (the
   table's query is `isPlaceholderData` meanwhile). A record (`app/staff/users/[id]`):
   the standing and team pills under the name, Take action and Back to
   People as small buttons in the toolbar (no Take action on a banned
   account, said beside them, and the API refuses it too), the facts in
   two columns, and small tables of the actions taken, reports about
   them, reports they sent (new, `reportsSent`) and their listings with
   photos, each decision with its note and an overturned one marked so.
   A report opens on Reports (`/staff/reports?open={id}`), a listing on
   its page. A look at a record is logged once in ten minutes per staff
   member (the record reads itself again when the page is come back to).
   Next: Appeals, Verify stores, Team, the appeal page and the banned
   page. The shared `Dropdown`'s open list now grows to fit its longest
   option (from the pill's right edge, to the left), so an option and its
   count stay on one line.
   **The review of every Staff console page is done** (2026-10-30),
   with the user's appeal page and the banned page.
3. **A design pass on the Store console:** done (2026-10-30), see above.
4. **The open safeguards** (item 8, the end of Trust and safety: staff
   password as well as the phone code, a sealed second super admin,
   false reports counting on the reporter, data requests, bulk actions):
   put to Hillary on 2026-10-30, waiting on her choice (see "Where the
   next agent starts").
5. **Phase 6** (Executives, Board, Finance, Sales), item 9 below and
   `docs/architecture/backend-plan.md`. Agree the business definitions
   with Hillary first.

**Earlier, Phase 4 (kept for reference):**

- **Slice 2, store passes:** a day ($1), week ($5) or month ($15) pass,
  bought as a test payment from Me or the limit message
  (`apps/api/src/passes.ts`, `components/StorePassSheet.tsx`); a reminder
  the day before it ends; when it ends, live listings above 15 are paused
  and come back with the next pass.
- **Slice 3, the Store console on real data:** every console page now
  reads and saves through the API. The console opens only for a signed in
  owner or staff member of a store with a pass (`console/layout.tsx`).
  Stock (add, edit, drafts, status), Bulk import, Offers (received and
  sent as the store), Leads (Matching requests and Number reveals), Stats
  (real views, reveals, offers, deals), the store's own Notifications, and
  boosts (buy, extend, stop, Undo as test payments; six sample boosts
  seeded). Show contact records each reveal with the daily limit; opening
  a listing records a view.
- **Me page fixed (2026-10-28):** it showed the sample account Tarisai M.
  to everyone; the name, initials, listings, reveals and offers counts now
  belong to whoever is signed in, and the profile's Offers page sorts by
  the signed in person too.

**Phase 4 after slice 3, in the order it was built:**

1. **Slice 4, owner and staff (built 2026-10-28, `325827e`):**
   `GET`, `POST` and `DELETE /api/stores/{id}/members` (in
   `apps/api/src/routes/stores.ts`): the owner adds staff by phone (the
   number must have an account; they are told in their notifications)
   and removes them (Undo puts them back); staff see the list. `roleIn`
   in `routes/post.ts` gives a person's role; paying for a boost on a
   store's listing is now the owner's alone (passes already were). The
   console's Store profile reads the real store (it was still on the
   mock) and has the Staff section (`console/store/StaffPanel.tsx`);
   `useConsoleRole()` (`apps/web/src/lib/consoleRole.ts`) hides boost
   buttons from staff in Stock, Boosted and Stats. Tested through the
   API and in the browser as owner and as staff.
2. **Store settings (built 2026-10-28, `ac2ffe6`):** the owner
   edits the store's description, opening hours and area at
   `/store/[slug]/edit` (`PATCH /api/stores/{id}`, owner only), reached
   from Me ("Edit store details" under the store) and the console's Store
   profile. No database change was needed.
3. **Moving listings into a store (built 2026-10-28, `bb4f6eb`):**
   in a personal listing's Manage sheet, "Move to <store>" for each store
   the person owns, with Undo (`PATCH /api/listings/{id}/store`, storeId
   or null). It stays the same listing, so offers and history go with it;
   the store's limit applies to a live listing for sale or swap. One at a
   time; a "move them all" was not built.
4. **Switching between stores (built 2026-10-28, `bb4f6eb`):**
   someone in more than one store gets an "Open Store console" button
   under each store on Me, which opens `/console/stock?store=<id>`; the
   console keeps that store (remembered in the browser,
   `apps/web/src/lib/consoleChoice.ts`) until another is chosen. With one
   store, the single "Switch to Store console" row opens it. Without a
   choice the console opens the first store with a pass.
   **Also 2026-10-28:** the Saved page shows its skeleton until the
   saved listings arrive (it flashed "Nothing saved yet"); signed in
   requests make fewer trips to the database (the person kept for 15
   seconds, "last seen" not waited for, items read with the details);
   the live API runs in Dublin next to the database; two more admins,
   Patrick M. and Ray L. (see the test accounts).
5. **Closing a store (built and committed 2026-10-28):** the owner
   taps "Close store" at the foot of Edit store details and confirms in a
   sheet. `POST /api/stores/{id}/close` (owner only) sets `closed_at` and
   withdraws the store's listings in one transaction; the store's page and
   listings come down, staff lose access, pass time left is lost, and it
   cannot be opened again. The owner's account and personal listings stay.
   Tested in the browser as Kuda with a test store, then deleted.
6. **Real contact numbers, the store's phone number, renaming a store
   (built 2026-10-28):**
   - `POST /api/listings/{id}/reveals` (`apps/api/src/routes/reveals.ts`)
     now answers with `contact` (`{ phone: "077 123 4567", call,
     whatsapp }`) once its checks pass: the poster's phone, or for a
     store's listing the store's own number, else its owner's. It also
     enforces the seller's rules (signed in only: 401 `code: 'signin'`;
     after an accepted offer only: 403). With no number to give it
     records nothing. `RevealAction` takes the listing's `channels` and
     shows what the API returns (kept in `useRevealStore.contacts`); the
     mock `contactWaysFor` is only for listings not in the database.
     Email and Messenger have no stored values, so only Call and WhatsApp
     show for database listings.
   - The eight sample sellers had no phone; they now have test numbers
     077 000 0101 to 0108 (`SAMPLE_PHONES` in `seed.ts`, set in the
     database too). They cannot sign in.
   - Edit store details has "Store name" and "Store phone number" (empty
     means the owner's). `PATCH /api/stores/{id}` takes `name` and `phone`.
     A new name keeps the old one as `formerName` for 30 days
     (`renamedAt`), shown as "formerly …" under the name on the store
     page; renaming again within them keeps the first; going back to the
     old name clears it; initials follow. The slug never changes. The
     store's number reaches its owner only through `/api/me` (stores'
     `phone`), never the public store page.
   - Migration `0004_windy_luckman.sql` (stores `phone`, `former_name`,
     `renamed_at`) applied 2026-10-28 with Hillary's yes.
   - **Every number is real now.** Who gets which number lives in one
     place, `apps/api/src/contact.ts` (`contactForListing`, `storePhone`,
     `personPhone`, `contactOf`). The store page's Show contacts calls
     `POST /api/stores/{id}/contact` (no sign in; the same daily limit,
     not recorded since it is on no listing) for the store's number,
     else its owner's. Accepted offers carry `contact` from the API: the
     sender gets the listing's seller, the listing's side gets the sender
     (as a store: the store's number) on the ways they chose; accepting
     keeps the server's copy, so the number shows at once. Links turn
     077 numbers into 263 (`digitsOf` in `ui/contact/ContactWays.tsx`).
     The mock `contactWaysFor` is left only for sample data not in the
     database. "formerly …" shows on the store page only, not on listing
     cards (their store names still come from the mock).
7. **Verified store requests (built 2026-10-28),**
   the simple version agreed with Hillary (`apps/api/src/routes/
   verification.ts`, table `verification_requests`, migration
   `0005_ancient_justice.sql` applied with her yes):
   - The owner asks on Edit store details (`store/[slug]/edit/
     VerifyPanel.tsx`): Registered business or Informal trader, and the
     registration or licence number. One request waits at a time. The
     panel then says our team will call them on their number.
   - Admins (role admin or super admin) see "Verify stores" on Me, under
     "For our team", which opens `/admin/verify`: each waiting request
     with the store, owner, phone, kind, number and area, and Verify or
     Decline (a reason is required). Verifying sets `stores.verifiedAt`
     (the badge shows at once); the owner is told either way in their
     notifications.
   - A rename pauses the badge (`verifiedAt` cleared in `PATCH
     /api/stores/{id}`); the panel then asks them to ask again, and the
     name hint warns first.
   - Not built: document photos (no uploads yet), the yearly check,
     and pausing after upheld reports (with Phase 5). A store pass does
     not need the badge (decision P38, 2026-10-28): paying and being
     verified are separate. An owner of a store with a pass and no badge
     sees a nudge on the console's Stock page to ask.
   - Admin test accounts: Patrick M. 077 000 0008 (Tafadzwa's 0006 did
     not sign in by script on 2026-10-28, likely a Supabase rate limit).
8. **Phase 5, the Staff console** (decided with Hillary 2026-10-28,
   decisions P39 to P43; read `docs/product/staff-console.md` first, then
   the backend plan's Phase 5 and section 2 on reports).

   **Built (2026-10-28), all live:**
   - **The four holes** found in built code are closed ("Before launch"
     below, items 1 to 4; migration `0006`).
   - **Roles:** a role is only `user` or `super_admin`. Staff are in
     `staff_departments` (person, department, lead), departments
     `trust_safety`, `sales`, `finance`, `marketing`, `devops`,
     `executives`, `board` (migration `0007`, which moved moderators and
     admins into Trust and safety). Every staff check asks
     `inDepartment(person, department, lead?)` in `apps/api/src/staff.ts`
     (the super admin passes all; on the live site, test accounts are in no
     department); the web app asks `useInDepartment` and `useOnTeam` in
     `apps/web/src/lib/staff.ts`. `/api/me` returns `staff`.
   - **The console frame** at `/staff`: gated in `app/staff/layout.tsx`,
     opened from "Staff console" under "For our team" on Me, drawn by
     `StaffShell` in `@snt/ui` (the Store console's styles; the bar at the
     foot of a phone scrolls sideways past five sections). Every section is
     listed in `app/staff/sections.tsx` with its department, whether it
     needs a lead, and a `built` flag: a person sees the built sections of
     their departments, the super admin all. Each page wraps itself in
     `StaffPage`. **To add a section: build its page under `app/staff/`,
     then set `built: true`.**
   - **Verify stores** at `/staff/verify` (Trust and safety leaders;
     `/admin/verify` redirects): every request as a table with a filter,
     Verify and Decline each with a required note (2026-10-30).
   - **Team** at `/staff/team` (`apps/api/src/routes/team.ts`): a card per
     person, a tick per department, "Leads it" beside a ticked one, "Add a
     person" by name or number, "Remove from the team" for the super
     admin. The API enforces the rules: only the super admin makes leads
     and removes from the team; a lead adds and takes out members of their
     own departments only, never a lead, never themselves. Every change is
     a row in `staff_log` (migration `0008`): `team.add`, `team.remove`,
     `team.lead`, `team.unlead`, `team.leave`.

   - **Reports** (built 2026-10-29, `apps/api/src/routes/reports.ts`,
     no migration: the `reports`, `moderation_actions` tables were there).
     **Reporting:** the flag on an opened listing (`CardActions`'
     `onReport`, wired by `useListingReport` in
     `apps/web/src/components/ReportSheet.tsx`) and "Report this person" /
     "Report this listing" on a deal check (`DealConfirm.tsx`) open one
     sheet: a reason (`REPORT_REASON_LABELS` in
     `packages/core/src/types/report.ts`, starting on the most common)
     and an optional note. `POST /api/reports` (signed in; a listing,
     whose poster is the person reported, or a person; never your own
     listing or yourself; 10 a day; the same open report again changes
     nothing). There is no person profile page yet, so a person is
     reported only from a deal check.
     **The queue** at `/staff/reports` (Trust and safety):
     `GET /api/staff/reports` gives the open and claimed reports this
     person may handle, oldest first, with the listing, the person's
     standing, actions upheld before and other open reports, who
     reported, and a suggested action (a simple violation matrix:
     stolen or two upheld before suggests a suspension; fake, duplicate
     or offensive on a listing suggests removal; else a warning).
     `POST /api/staff/reports/{id}/claim` (one person at a time; a claim
     left 30 minutes can be taken), then `/decide` with `approve` (an
     action: warning, removal, a 7 day suspension, or a ban for leads
     only; the reason can be corrected; an optional note for the record)
     or `clear`. Each decision writes a `moderation_actions` row (`none`
     for a clear) and a `staff_log` row (`report.approve`,
     `report.clear`), and the person is told in their notifications,
     never who reported them. Effects: a warning or removal makes them
     `warned`; removal sets the listing `removed`; a suspension sets
     `suspended` with `suspendedUntil` (ended by `liftEndedSuspensions`
     in `apps/api/src/standing.ts`, run with `settlePasses`, back to
     `warned`); a ban sets `banned` and removes all their listings.
     **Who handles what** (`mayHandle`): never your own report, one about
     you, or about a listing of a store you own or work for; reports
     about our team go to Trust and safety leads, about a lead to the
     super admin; nobody acts on the super admin. Such reports are simply
     not in that person's queue.
     Tested 2026-10-29 by script and in the browser (Kuda reported,
     Rumbi claimed and approved a warning and a removal, a person report
     cleared, every refusal checked), then all of it deleted. Not tested:
     a ban by a lead (Tafadzwa's 0006 still does not sign in by script),
     and "Report this person" on a deal check in the browser.
     Not built: reporter notifications, false reports counting on the
     reporter's record, bulk actions, a count on the console's Reports
     tab, and automatic priority signals.

   - **People** (built 2026-10-29, `apps/api/src/routes/users.ts`, pages
     `app/staff/users/` and `app/staff/users/[id]/`, no migration):
     Trust and safety find anyone by name or number
     (`GET /api/staff/users?q=`), open their record
     (`GET /api/staff/users/{id}`: phone, area, joined, last seen,
     standing, place on our team, stores, confirmed deals, live
     listings, their last 10 listings, reports about them and actions
     taken; each look is a `person.view` row in `staff_log`), and "Take
     action" without a report (`POST /api/staff/users/{id}/action`: a
     warning, a 7 day suspension, or a ban for leads, under a reason,
     with an optional note; logged as `person.warning` and so on, and
     the person is told). Where the viewer may not act, the record says
     why instead of the button.
   - **The rules and effects are shared** in `apps/api/src/moderation.ts`
     (`actorOf`, `targetsOf`, `mayActOn`, `mayBan`, `applyAction`,
     `actionText`), used by Reports and People alike. Added with People:
     nobody acts on someone they run a store with.
     Tested 2026-10-29 by script and in the browser as Rumbi (search,
     record, warning, suspension hiding the listings, every refusal),
     then put back. Lifting a suspension or ban by hand is not built:
     Appeals will overturn actions.

   - **Appeals** (built 2026-10-29, `apps/api/src/routes/appeals.ts`,
     no migration: `appeals` was there). Every action's notification now
     links to `/appeal/{actionId}` (`app/appeal/[id]/`), where the person
     sees what was decided and why, and appeals once in their own words
     (`GET /api/me/actions/{id}`, `POST /api/me/actions/{id}/appeal`, at
     least 10 characters). The Appeals section (`/staff/appeals`, Trust
     and safety leads) lists waiting appeals oldest first, leaving out
     decisions this lead made and people they may not act on; Uphold or
     Overturn, with a reason the person is told
     (`POST /api/staff/appeals/{id}`, decided once). Overturning sets
     `reversedAt` and `reversedById` and runs `undoAction`
     (`moderation.ts`): a removed listing goes live again, a ban gives
     back the listings it removed (not ones another removal still keeps
     down), and `resettleStanding` works the standing out from the
     actions still in force. Logged as `appeal.uphold` and
     `appeal.overturn`.
     Tested 2026-10-29: the person's side by script and in the browser as
     Tarisai (notification, page, appeal, once only, refusals); the
     undoing by a script calling `undoAction` (a suspension and a ban
     overturned, standing and listings back). **Not tested: a lead
     deciding in the browser or through the API**, since no Trust and
     safety lead signs in by script (Tafadzwa's 0006 fails, and making a
     test account a lead was not allowed). Hillary can check it as super
     admin: suspend a test account from People, appeal as them, then
     overturn from Appeals. An action Hillary made herself will not show
     in her own Appeals list (by design).

   - **Activity log** (built 2026-10-29, `apps/api/src/routes/activity.ts`,
     `app/staff/activity/`): `GET /api/staff/activity?page=&size=` gives
     `staff_log` newest first, 10, 20, 30 or 40 a page (`size`, 10 by
     default) with the total. The page is set as the Store console's
     Stock page: the search box and a Filters pill (From and To days in a
     sheet) in the toolbar, the count line in the blue, and the table in
     one white card under the pale blue heading strip (When, Who, What
     they did), one line a row (two on a phone). Under it "1 to 10 of N",
     a gear (Page settings: 10, 20, 30 or 40 a page, remembered in the
     browser as `snt-activity-size`) and the page buttons: small pills
     the height of that line, the page on show filled in the blue,
     Previous, nine numbers at a time (1 to 9, 10 to 18…) with chevrons
     either side that jump nine pages once there are more than nine, and
     Next. With one page they all show, disabled. On a phone the numbers
     sit on one line and Previous and Next under them.
     Search (`q`): every word must match a name, who did it or to whom,
     or a kind of action through `ACTION_WORDS` ("kuda warning" is Kuda's
     warnings). `from` and `to` are days in Harare's time, both included.
     The page keeps only the newest answer when searches overlap. Trust and safety leads and the super admin see
     everything; a member sees only what members did (no leads' or super
     admin's actions, no `team.*`). Each entry is worded on the page
     (`describe()`), e.g. "Rumbi M. warned Tarisai M. (offensive)", and
     opens the person's record. Read only. Tested as Rumbi and Kuda,
     then the test entries deleted (Hillary's two Team entries kept).
   - **A banned account sees only its ban** (2026-10-29): `BannedGate`
     (`apps/web/src/components/BannedGate.tsx`, in the root layout) shows
     the appeal page for their ban (`banActionId` on `GET /api/me`) on
     every address (bar /help, /terms and /privacy), with the usual
     header and footer: Post New Item is faded and does nothing, and View
     profile in the menu is disabled. The browser remembers a ban
     (`snt-banned` in localStorage), so a reload shows the ban page at
     once; sign in waits for `/api/me` before leaving the sign in page (as
     long as it takes; it moves on only if the API cannot say, shown by
     `viewerFailed` in the session store, or after a minute), so the
     marketplace never flashes first. The first `/api/me` after a sign in
     can take 8 seconds from the owner's laptop. The
     API refuses a banned account everything but `GET /api/me` and
     `/api/me/actions/{id}` (and its appeal), in a middleware in
     `apps/api/src/app.ts` (`code: 'banned'`). A ban is lifted only by
     overturning it on appeal.
   - **The header from the first paint** (2026-10-29): a script at the
     top of `<body>` (`MARK_SESSION` in `apps/web/src/app/layout.tsx`)
     marks `<html>` with `data-signed-in` when Supabase has a session in
     this browser and `data-banned` when it last saw a ban. The person's
     bell is always in the page and shown by CSS only under
     `data-signed-in`; the outlined person shows as the white circle; a
     banned account's bell and Post New Item are faded and do nothing.
     `SessionRestore` and `BannedGate` keep the marks in step, and sign out
     clears both.
   - **The Staff console never shows a blank page while loading**
     (2026-10-29): the gate in `app/staff/layout.tsx` draws the console
     while `/api/me` is on its way, and only turns away someone off the
     team once it knows. Meanwhile `StaffShell` (`loading`) shows bones
     for the name and three sections (sidebar, phone header and the bar at
     the foot) and keeps the title icon's place, and each section's page
     shows its own skeleton (they wait on `allowed === false`, not on
     `undefined`). The API checks every request, so nothing is shown to
     anyone off the team.
   - **TanStack Query for loading data** (2026-10-29, the owner's rule:
     no `useEffect` for loading data). `@tanstack/react-query` is in the
     web app; `apps/web/src/lib/query.tsx` has the one `QueryProvider`
     (in the root layout), `apiGet` and `apiSend` (throw `ApiError` with
     the API's message and status), the retry rule (twice more, never
     after a plain no under 500) and `QueryProblem` (the message and Try
     again). `apiAsViewer` now also returns `status`. `useDebounced`
     (`lib/useDebounced.ts`) waits for typing to pause. The whole Staff
     console is on it: the menu counts (every minute and after each
     change), Reports, People and a person's record, Appeals, Verify
     stores, Team and the Activity log, with their keys in `staffKeys`
     (`app/staff/sections.tsx`); a change updates its list in the cache
     and refreshes what it touched (counts, the log, a record).
     **The rest of the app moved too (2026-10-29):** the appeal page;
     the Store console's Stock (`useConsoleStock`, one request shared by
     its six screens, `stockKey`), Leads, Stats, Offers (trade ins), Store
     profile and Store staff; Me and My listings (`lib/myListings.ts`);
     Saved; Edit store (the form drawn once the store has loaded, from
     it) and its Verify panel; Open a store and the store pass sheet
     (mutations); the feed's live listings (`LiveListingsLoader`, read
     again after five minutes); and sign in: `SessionRestore` keeps only
     the Supabase listener as an effect, and runs who it is
     (`/api/me`, `viewerKey` in `lib/viewer.ts`, read again each minute
     at most) and then their things (`lib/accountData.ts`) as queries,
     putting the answers in the same stores. `refreshViewer` reads who
     they are again after a change (`fetchViewer` is gone). If who they
     are cannot be loaded, `viewerFailed` is set (through `meta.onError`,
     once the retries are done): the sign in page signs them out again
     cleanly and says "We could not sign you in. Check your connection
     and try again."; elsewhere a toast says so. Queries shared by
     several screens report a failure with `meta: { toast: true }`.
     Everything below the layout's `<QueryProvider>` (SessionRestore,
     LiveListingsLoader and the sheets included). Effects left, none
     loading data: the Supabase listener, the Activity log's page size
     from the browser, the stock form's own one, the Staff console's
     redirect to its first section, `useDebounced`, and `ViewRecorder`
     (it only sends a view).
   - **Counts in the console's menu** (2026-10-29): `GET
     /api/staff/counts` gives reports nobody holds that this person may
     handle, and appeals waiting for them (leads); shown beside Reports
     and Appeals, through TanStack Query (`staffKeys.counts` in
     `app/staff/sections.tsx`): every minute, and refreshed after each
     claim or decision.
   - **Check for the phase** (done 2026-10-29): a listing reported as
     Kuda, approved as Rumbi (a member), the warning arrived.

   **The Trust and safety part of Phase 5 is complete.** Still open from
   section 9 of the staff console design, not built: staff signing in
   with a password as well as the phone code, a sealed second super
   admin account, false reports counting on the reporter, data requests
   (export and delete), and bulk actions. (A count on Reports is built:
   the menu counts.) Ask Hillary which of these come before launch.
9. **Phase 6:** Executives Overview, Board monthly summary, Finance,
   Sales (owners' phone numbers allowed). Agree business definitions
   (what counts as active, as value swapped) with Hillary first.
10. **Phase 7:** Marketing and DevOps, after recording traffic sources,
    searches and errors.

**Before launch (found in a review on 2026-10-28; see
`docs/product/staff-console.md` sections 8 and 9):**

Holes found in built code, **fixed 2026-10-28 at the start of Phase 5**
(migration `0006_bitter_big_bertha.sql` applied with Hillary's yes):

1. **An admin could verify their own store.** `POST
   /api/admin/verifications/{id}` now refuses anyone who owns or works for
   the store (`roleIn`).
2. **The store page's Show contacts was not counted.** It is now recorded
   in a `store_contacts` table and counts as one seller against the same
   daily limit (`overDailyLimit` in `routes/reveals.ts`); the same store
   again that day is free.
3. **A guest could reset the limit of 3 by clearing their browser.**
   Reveals and store contacts now keep the network address, hashed
   (`address_hash`); all guests on one address share a cap of 50 sellers a
   day (`ADDRESS_DAILY`), generous because a campus or a mobile network can
   share an address. Signing in lifts it.
4. **Test staff accounts on the live site.** On the live site
   (`VERCEL_ENV=production`) any account on a test number (077 000 0001 to
   0999) is treated as an ordinary user, whatever its role
   (`withLiveRole` in `routes/me.ts`, applied in `personFor`). Localhost
   and previews keep their roles for testing. **So on the live site there
   is no super admin until Hillary's real account is made one** (item 5).

Before real users join:

5. **Done 2026-10-28: real numbers for Hillary, Patrick and Ray.** The
   accounts `u-hillary` (super admin), `u-patrick` and `u-ray` were moved
   from the test numbers 0007, 0008 and 0009 to their real phone numbers,
   in our database and in Supabase Auth (the same sign in, so their roles
   and departments stayed). On the live site real numbers keep their
   powers. Signing in by phone needs real SMS, or (meanwhile) each number
   in Supabase's test numbers with a private code, never 123456. **Running
   `db:seed` would put them back on the test numbers**; do not without
   asking. Sign in now also takes a number with its country code (`+55 …`),
   for Ray (`toPhone` in `apps/web/src/lib/supabase.ts`). For scripted
   staff tests use Tafadzwa (0006, Trust and safety lead) and Rumbi (0005).
6. **Split the database:** a development database with sample data for
   localhost and previews, the live one for production only (P42). Today
   they are one, which is why test data shows on the live site.
7. **Real email and SMS,** replacing the mock codes (123456).
8. **Stronger sign in for staff:** a password as well as the phone code,
   or an authenticator app, before the Staff console opens (P43).
9. **A second, sealed super admin** or a written recovery step, so the team
   can still be managed if Hillary's account is lost (P43).
10. **Terms:** opening a store includes agreeing to be called about Swap &
   Top's products, with a way to say no (P43); data requests and account
   deletion handled by a Trust and safety lead.
11. **Logs without personal data** (P42).
12. **Real payment through Paynow** (below).

**Waiting on the owner (Hillary):**

- **A Paynow merchant account**, which Hillary will open later at
  paynow.co.zw. Until then every payment (store passes, boosts) is a test
  one. When it exists: Hillary puts the Integration ID and Integration Key
  in the root `.env` and in Vercel (Production and Preview), they are
  added to `turbo.json`'s `passThroughEnv`, and the payment step is built:
  start a Paynow transaction (EcoCash express or the web checkout), take
  Paynow's result call at an API endpoint, and only then mark the
  `payments` row paid and switch the pass or boost on. Remind Hillary of
  this when work reaches real payments or launch.
- Real email (Supabase SMTP) and SMS (a provider in place of the Twilio
  placeholders), to replace the mock codes before launch. Ray is in Brazil,
  so the SMS provider must send there.
- **Until real SMS:** Hillary adds her, Patrick's and Ray's real numbers to
  Supabase (Authentication, Sign In / Providers, Phone, Test Phone Numbers
  and OTPs), each with a private code (never 123456), with a "valid until"
  date, and removes 263770000007, 0008 and 0009 from that list. Told to her
  on 2026-10-28; check with her whether it is done before testing as them.

- **Umami, for Growth's visits** (Hillary, 2026-11-03: with the final
  hosting, likely Dokploy). Set up Umami, add the site, and make a view
  only Umami user for the console. Then fill five settings in the root
  `.env` and the hosting's settings (all in `turbo.json` already):
  `NEXT_PUBLIC_UMAMI_SCRIPT_URL` (Umami's `script.js` address) and
  `NEXT_PUBLIC_UMAMI_WEBSITE_ID` load the counting script in the web
  app (`app/layout.tsx`); `UMAMI_URL`, `UMAMI_WEBSITE_ID`,
  `UMAMI_USERNAME` and `UMAMI_PASSWORD` let the API read the figures
  (`apps/api/src/umami.ts`, kept five minutes). Once they are there the
  sample strip goes and the figures are real. The API calls
  (`/api/auth/login`, `/websites/{id}/stats`, `/pageviews`, `/metrics`)
  are written to Umami's documented API but not yet tried on a real
  server: check them against the version installed.

**Good to know before starting:**

- Migrations `0001` to `0013` are applied to the shared database. A new
  one is made with `db:generate`; running `db:migrate` changes the live
  database, so ask the owner first.
- Real payment waits on a Paynow merchant account; every payment is a test
  one (`payments.provider = 'test'`) recorded as paid at once.
- Test data: none left behind. `db:seed-activity` puts back the sample
  offers, deal checks, saved listings, notifications and boosts.

## Hosting on Dokploy (prepared 2026-11-06)

Hillary plans to move the site from Vercel to her own server on Dokploy,
with Cloudflare in front and R2 for photos. The code is ready for it; the
site still runs on Vercel until she switches the domain. **One container**
holds the site and the API (at `/api`), as on Vercel: splitting them would
mean two domains, CORS and two deploys for no gain yet. The API can still
run alone later (`apps/api/src/index.ts`), for a phone app.

**What the repo has for it:** `Dockerfile` and `.dockerignore` at the root
(Node 22, pnpm, `next build` with `output: 'standalone'` in
`apps/web/next.config.ts`, then a small image that runs
`node apps/web/server.js` on port 3000, as the `node` user, with a health
check on `/api/health`). The image sets `APP_ENV=production` and
`APP_HOST=Dokploy`. **`APP_ENV=production` is what keeps test numbers
from staff powers off Vercel** (`apps/api/src/staff.ts`, which also
still reads `VERCEL_ENV`). Health shows the deploy from `COMMIT_SHA`,
`COMMIT_MESSAGE` and `COMMIT_BRANCH` when they are passed as build
arguments; with none it shows no deploy line.

**Steps on Dokploy:**

1. A server close to the database (Ireland): London or Amsterdam, not
   the US or South Africa, since a page makes several trips to it.
2. New application from the GitHub repo, branch `main`, build type
   Dockerfile (`Dockerfile` at the root), auto deploy on push.
3. Build arguments: `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_UMAMI_SCRIPT_URL`,
   `NEXT_PUBLIC_UMAMI_WEBSITE_ID` (baked into the pages), and
   `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`,
   `SUPABASE_SECRET_KEY`, `SUPABASE_JWKS_URL` (the build reads the
   database to make pages ahead; they stay in the build stage only).
   Optionally `COMMIT_SHA`, `COMMIT_MESSAGE`, `COMMIT_BRANCH`.
4. Environment (while running): the same database and Supabase settings,
   and the four `UMAMI_...` ones once Umami runs. The values are the ones
   in the root `.env` and Vercel; never paste them anywhere else.
5. Domain: the site's host name, container port 3000, HTTPS with Let's
   Encrypt. In Cloudflare, point the name at the server with the cloud
   grey until the certificate is issued, then turn the proxy on, SSL mode
   Full (strict).
6. Supabase, Authentication, URL Configuration: the new address as Site
   URL and in Redirect URLs, or reset links point at the old one.
7. Try it on a spare host name first while Vercel stays live; both use
   the same database (Vercel one connection a request, the container a
   pool of five, within the session pooler's 15). Then move the main
   domain and turn Vercel off.

**Tested (2026-11-06):** the image built on a laptop with the settings
from `.env` (376 MB, 120 pages made), ran on port 3100: the feed, a
store, sign in, Swagger and `/api/health` answer, no console errors, the
health check reports healthy, no setting or database address is in the
image, and Tafadzwa (0006) has no staff departments there while the dev
server still gives her hers. **Careful when trying the image:** it counts
as the live site, so its requests over 2 seconds go into
`request_issues` and `request_issue_months` in the shared database;
delete them after (done for this test). A Supabase build from a laptop
downloads slowly; the `esbuild` build script warning is harmless (only
the migration tools use it).

## Photos on R2 (built 2026-11-06)

Listing photos and store logos are kept on Cloudflare R2, in the public
bucket `swap-and-top-photos`, served from `photos.gretaworksdigital.com`
for now (a custom domain through Cloudflare, never the `r2.dev` address).
**Settings** (root `.env`; add them to Vercel and Dokploy before this code
is deployed, all in `turbo.json`): `R2_ACCOUNT_ID` (the ID, or the whole
endpoint address Cloudflare shows; `apps/api/src/r2.ts` takes the ID out
of it), `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` (an Account API token,
Object Read & Write, this bucket only), `R2_BUCKET`, `R2_PUBLIC_URL`.
Without them uploads answer "Photos are not set up yet" and the rest
works.

**How it works.** The browser shrinks a photo first (`lib/photos.ts`:
1600 pixels on its long side, 512 for a logo, WebP or else JPEG, which
also drops what the camera wrote into the file) and sends it to our API,
not straight to R2: R2 cannot limit size or type on a signed link. The
API (`routes/uploads.ts`) needs a sign in, a verified phone and an
account not suspended or banned, checks the first bytes are JPEG, PNG or
WebP and the size is at most 3 MB, and puts it under
`photos/{personId}/{random}.{ext}`. The database keeps **keys, not
addresses** (`items.images`, `stores.logo`); `photoUrl` makes the address
when read, so moving to the final domain is only `R2_PUBLIC_URL`.
Browsers keep a photo a year, Cloudflare's cache a day (`s-maxage`), so a
deleted photo stops showing by the next day. Photos are sent to R2 whole
with a signed request (`putPhoto`): a signed Request's streamed body gets
411 from R2 inside Next.

**On screen.** `components/PhotoPicker.tsx` (`usePhotoPicker`) on the post
form (`post/details`, kept in the draft as `photos`) and on Add stock and
Edit (`console/stock/StockForm.tsx`): each photo goes up as it is chosen,
faded with a spinner until kept, up to 8; Next and Save wait while any
are going up. The review step's preview shows them. `POST /listings` and
`PATCH /listings/{id}` take `images` (keys or addresses), only ones in
the sender's own folder or already on the item ("One of those photos is
not yours."). **Deleting:** a photo taken off a form before saving goes
at once (`DELETE /uploads/photo`, only an unused one in the sender's
folder); one taken off a saved listing goes when it is saved without it;
deleting an account (data requests) deletes its listings' photos and its
own stores' logos. **Store logo:** Edit store details (owner only), Add
logo, Change logo, Remove logo, saved at once (`PUT` and `DELETE
/stores/{id}/logo`, the old one deleted), shown by `StoreMark` (`logo`
prop) on the store page and in the Store console; the edit page's
skeleton shows two buttons when there is a logo.

**Tested 2026-11-06** against real R2 on localhost: refusals (no sign in,
not a photo, too big, another person's photo, not the store's owner), a
listing posted in the browser with two photos (4000 by 3000 shrunk to
1600 by 1200 WebP), Add stock and Edit on Kopje Computers (the removed
photo deleted only on Save), a logo set, replaced and removed, at laptop
and phone size. All test listings, logos and photos deleted after; the
bucket was left empty.

**Not yet:** feed cards still take stores from the mock data, so they show
initials, not logos; photos chosen and then left on an unsaved form stay
in R2 (a later cleanup could list `photos/` against `items.images`);
bulk import takes no photos; a private bucket for verification documents
comes with that feature.

## The project

Swap & Top is a Zimbabwean marketplace for phones, laptops, consoles and
parts, built around the swap: offer what you have, add cash on top. People
post items for sale, swaps and Wanted listings; stores get a Store
console with stock, leads, offers and stats. The product docs live in
`docs/` (start at `docs/00-SUMMARY.md`).

**State, 2026-10-28.** The app has a real backend: Postgres on
Supabase, Drizzle, a Hono API in `apps/api` served by the web app at `/api`
(Swagger at `/api/docs`), deployed with the site on Vercel. Every page a
person uses reads and saves through it: the feed, listing pages, search,
Wanted, posting, My listings (pause, sold, delete, relist), offers (send,
accept, decline, withdraw, undo), deal checks, saved listings, notifications,
store pages, opening a store, store passes, and the whole Store console.
Sign in is real (Supabase Auth): email and
password from a three step sign up, or phone and a one time code. Email and
phone codes are **mock ones (123456)**, nothing is sent, until real email and
SMS are set up. A phone is optional to join; posting and sending offers ask
for a verified phone first.

Still on the mock data: other people's names, store badges and deal counts
on cards and offers (from the mock people and stores, whose ids match the
database).

The **database is shared** by localhost and the live site: anything posted,
saved or answered on either shows on both. Clean up test data you make, and
`pnpm --filter @snt/api db:seed-activity` puts the sample offers, deal
checks, saved listings, notifications and boosts back.

Roles (user, moderator, admin, super admin) are on the person; person, free
store and paid store are not roles but store membership and passes.

## Repo layout

pnpm workspace with Turborepo.

| Path | What it is |
|---|---|
| `apps/web` | Next 15.5 (App Router), React 19. Pages under `src/app`, shared page parts under `src/components`, browser helpers under `src/lib` (Supabase client, `apiAsViewer`, account data loading, listings and stores read on the server). Serves the API at `/api` through `src/app/api/[[...route]]/route.ts`. |
| `apps/api` | `@snt/api`: the Hono API. `src/db/schema.ts` (21 tables), `src/db/seed.ts` and `seedActivity.ts`, `src/routes/*` (one file per area), `src/auth.ts` (token check), `src/supabaseAdmin.ts` (admin calls, `MOCK_CODE`). Also runs on its own on port 4000. |
| `packages/ui` | `@snt/ui`: the component library, CSS Modules. Cards, layout (headers, tabs, menus, footer, console shell), offers, primitives. |
| `packages/core` | `@snt/core`: types, mock data (`src/mock`), Zustand stores (`src/stores`), helpers. |

Commands: `pnpm dev` (the user usually has it running on port 3000),
`pnpm -s typecheck`, `pnpm build`. API: `pnpm --filter @snt/api dev` (on
its own, port 4000), `db:seed` (everything back to the start, empties all
tables), `db:seed-activity` (just offers, deal checks, saved and
notifications), `db:generate` and `db:migrate` (after changing the schema).

Settings: the root `.env` (git ignored) holds `DATABASE_URL` and the four
`SUPABASE_` values; `apps/web/.env.local` holds `NEXT_PUBLIC_SUPABASE_URL`
and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Vercel has all of them for
Production and Preview, and `turbo.json` lists them so the build sees them.
Never print the secret values.

Branch: all work is on `redesign/pdf-style`, fast forwarded into `main` when
the user asks. `main` deploys live.

## Test accounts and data you will meet

Sign in with a phone (Continue with phone) and the code **123456**:

| Number | Who | Notes |
|---|---|---|
| 077 000 0001 | Tarisai M. (`u-tarisai`) | A person. Also email `tarisai.test@example.com`, password `testpass123`. Owns the MacBook swap and the PS5 controller Wanted listing. |
| 077 000 0002 | Avondale Games owner (`u-avgames`) | A free store, `s-avondale-games`. |
| 077 000 0003 | Tinashe K. (`u-kopje`) | Owner of Kopje Computers (`s-kopje`), a paid store with a month pass. |
| 077 000 0004 | Kuda S. (`u-kuda`) | Staff at Kopje Computers. |
| 077 000 0005 | Rumbi M. (`u-rumbi`) | Trust and safety member. Test password `testpass123`, for the Staff console. |
| 077 000 0006 | Tafadzwa A. (`u-tafadzwa`) | Trust and safety leader. Test password `testpass123`, for the Staff console. |
| ~~077 000 0007~~ | Hillary M. (`u-hillary`) | Super admin. **Moved to Hillary's real number on 2026-10-28** (in the database and in Supabase Auth); 0007 is no longer this account. |
| ~~077 000 0008~~ | Patrick M. (`u-patrick`) | In every department: lead of Trust and safety, Sales and Marketing; member of Finance, DevOps, Executives and Board. **Moved to Patrick's real number on 2026-10-28.** No store. |
| ~~077 000 0009~~ | Ray L. (`u-ray`) | Trust and safety lead; member of Sales, Marketing and Finance. **Moved to Ray's real (Brazilian) number on 2026-10-28.** No store. |

Only numbers listed as test numbers in Supabase can sign in by phone (1 to 7
are; 8 and 9 need adding there: Authentication, Sign In / Providers, Phone,
Test phone numbers, `263770000008=123456` and `263770000009=123456`);
Patrick and Ray can sign in by email meanwhile. Any other number needs real
SMS. Any Zimbabwe number can be *verified* in
Settings or the verify phone sheet with 123456. Sign up with any email
works (code 123456).

The mock data in `packages/core/src/mock` is what the database was seeded
from, and what the Store console and other people's details still read:

| Who | Id | Notes |
|---|---|---|
| Tarisai M. | `u-tarisai` | The mock's sample user (`CURRENT_USER_ID`); pages now use whoever is signed in instead. Owns the MacBook swap (`l-macbook-swap`) and the PS5 controller Wanted listing (`l-ps5-controller-wanted`). |
| Kopje Computers | `u-kopje`, store `s-kopje` | The store (`currentStore`) shown in the console. |
| Chipo N., Rudo K., Blessing T., Tendai C., Farai D., Nyasha P., Avondale Games | `u-chipo`, `u-rudo`, `u-blessing`, `u-tendai`, `u-farai`, `u-nyasha`, `u-avgames` | Other people offering or posting. |

Boosted in the seed (`SAMPLE_BOOSTS` in `seedActivity.ts`, ids
`b-sample-<listing>`): the Dell Latitude 7490 (Kopje's, the only one the
console shows), and other people's iPhone 11 128GB (sale),
PS4 Slim for an Xbox One S and Galaxy A34 for a Pixel 7a (swaps), RTX 3060
or Better and Galaxy S21 or newer (Wanted), so the Sponsored badge can be
seen on every kind of card. Notifications: `mock/notifications.ts`. Deal
checks: `mock/deals.ts`. Stats figures: `mock/stats.ts`.

Sample offers (`SAMPLE_OFFERS` in `useOfferStore.ts`), deal checks
(`mock/deals.ts`), saved listings (`SAMPLE_SAVED`) and notifications
(`mock/notifications.ts`) are seeded into the database by `seedActivity`.
Tarisai receives three offers (two on the MacBook, one on the PS5
controller) and has sent four, one in each state.

## Design system in practice

Tokens are in `packages/ui/src/styles/tokens.css`. The ones used most:

- Blues: `--snt-control-active` (#2f7599, the main interactive blue),
  `--snt-accent-bold` (headings), `--snt-accent-strong`.
- Backgrounds: `--snt-bg-app` (page), `--snt-bg-card`/`--snt-bg-surface`
  (white), `--snt-bg-inset` (#ebf2ff).
- Others: `--snt-alert` (#d92d20, the app's red), `--snt-success`,
  `--snt-wanted-ink` / `--snt-wanted-fill` (Wanted green), brand blue,
  green and yellow (#ffff8b).
- Spacing: space-1 = 2px, 2 = 4, 3 = 6, 4 = 8, 5 = 10, 6 = 12, 7 = 14,
  8 = 16, 10 = 20, 12 = 24, 16 = 32. Radius md = 12, lg = 14, xl = 18.
- Weights: there is `--snt-weight-normal` (400), no "regular".

Patterns the user has settled on:

- **Icon tiles.** Icons sit on a small rounded square. Usually a see through
  wash of the icon's own colour:
  `color-mix(in srgb, currentColor 12%, transparent)`. On the page background,
  `color-mix(in srgb, var(--snt-control-active) 12%, transparent)`.
- **Tabs are a segmented switch** (`packages/ui/src/layout/Tabs.tsx`): a pale
  blue strip, a blue block that slides to the chosen tab, counts in tinted
  rounds, optional icons on tinted tiles, a `short` label for phones, `fill`
  for even widths. Used on the feed (laptop), My listings
  (All, Swaps, For Sale, Wanted), Saved, Offers, shop pages. The Leads tabs
  in the console (`apps/web/src/app/console/leads/LeadTabs.tsx`) are the
  original version and still separate code.
- **Listings are white; offers are pale blue.** An offer card
  (`packages/ui/src/offers/OfferCard.tsx`) is compact, on
  `color-mix(control-active 12%, bg-app)`, like a reply under a post.
- **Offers hang off a thread line**, like comments: "Offers on this
  listing" with the count in a round, flush left with the listing, then a
  solid line down the left that curves into the middle of each offer
  (`.rail` in `Offers.module.css`, `.offers` in
  `apps/web/src/components/offers/OfferGroups.module.css`, shared by the
  profile's and the console's Offers pages; the line colour is solid, not
  transparent, so overlaps do not darken).
- **Status pills** (Live, Accepted, Declined) are a faded wash of their own
  colour, never a solid fill.
- **Gaps.** Under the header band (search, chips, tabs) to the first
  listing: 12px on a phone, 20px from tablet up, except the feed which keeps
  12px under its sticky tabs. Between the chips and the tabs: 12px.
- **Calls to action** are the yellow of Post New Item with its green ink
  (`--snt-brand-yellow`, `--snt-post-ink`), as on the Sponsor banner.
- **"New" and "Sponsored"** badges use the brand gradient (`Badge
  tone="brand"`). "Sponsored" always sits top right: on the photo of a
  sale, on a swap's "Looking for" tile (the card's top right corner), and
  at the right of a Wanted card's top row with the responses and time
  under it. The type (Wanted, Swap) keeps the top left. "New" on Leads stays
  on the left: it is for dealers to act on.
- **Boost, not sponsor, for the seller.** Everything the seller does says
  "boost" ("Boost this listing", "Boost a listing", "Boosted listings",
  "Boosted until …", "Extend boost", "Stop boost", the Stats card "Boosts").
  Only the label buyers see on a card stays "Sponsored". Code names
  (`useSponsorStore`, `SponsorSheet`) keep "sponsor".
- **Store, never dealer, in code too.** Code names say store:
  `allowStoreOffers`, `contactToStores`, `contactOpenToStores`,
  `VerifiedStoreBadge`, `ownsStore`, the role `'store'`, and the console doc
  is `docs/product/store-console.md`. "Shop" is gone from the code too:
  `Store`, `storeId`, `currentStore`, `getStore`, `useStoreStock`,
  `mockStores` (`mock/stores.ts`, `types/store.ts`), the `Storefront`
  component, `StoreMark`, `--snt-store-mark`. Only the design file's frame
  names (`DetailDealer`, `Shopfront`) keep the old words.
- **Store, not shop, in what people see.** A dealer's page is a store:
  "Store profile" (storefront icon, "Store" on the phone bar), addresses
  `/store/<slug>` and `/console/store`. The old `/shop/...` and
  `/console/shop` redirect there (`apps/web/next.config.ts`).
- **Boosting lives in Stock.** Stock has two tabs, Stock and Boosted
  (`stockTab` in `useConsoleStore`). Boosted (`console/stock/BoostedTab.tsx`):
  a yellow "Boost a listing", each boosted listing with "Until … · $3 a day
  · 12 reveals since" and a menu (Extend boost, View as a buyer, Stop boost
  with Undo), then "Worth boosting": the three live items with the most
  reveals, each with a yellow Boost button. Stock rows keep Boost this
  listing / Extend boost / Stop boost in their menu, and the edit page keeps
  its banner. Stats keeps a Boosts card whose "Boosted listings" button
  opens Stock on the Boosted tab. The separate Sponsored items page was
  removed.
- **Settings** use the gear (`SettingsIcon`). Information pills are not
  buttons; the action beside them is a real button.
- **Never restyle a `Panel` with another background.** Two styles of equal
  weight: the production build loads them in a different order than the dev
  server, so it looked right locally and wrong on Vercel (the offer cards
  came out white). Give the thing its own box instead.

## What was built recently (newest first)

See `git log` for the full detail; each commit body explains its change.

- **2026-10-29, Trust and safety and the app's loading** (one commit,
  pushed to `main`): Reports, People, Appeals and the Activity log (item
  8); the banned account page (only the ban and its appeal, the header
  as usual with Post New Item, the bell and View profile faded; the API
  refuses a banned account the rest; sign out goes home); waiting counts
  on Reports and Appeals; the Activity log as a Stock page style table
  (search, Filters sheet with days, 10 to 40 a page from the gear, nine
  page numbers at a time with chevrons); the Staff console drawn with
  skeletons straight away on a reload; the header's bell and account
  circle right from the first paint (`MARK_SESSION` in the layout); sign
  in waiting for who it is, with a real error when the server cannot say;
  "Signed out successfully" and "Sign in successful" once the next page
  shows; the account menu placed before it is drawn (no jump); selected
  outlined buttons filled to the edge with no ring; the outlined person
  in the header at a 4px outline; and every page's loading moved from
  `useEffect` to TanStack Query (item 8).

- **2026-10-28, the rest of Phase 4 and Phase 5's start** (`0d0c07a` to
  `0059d3e`, all pushed to `main`): real contact numbers on Show contact,
  the store page and accepted offers (`apps/api/src/contact.ts`); the
  store's own phone and renaming with "formerly"; Verified store requests
  and the nudge on Stock (P38: a pass does not need the badge); the Staff
  console plan and the access review (P39 to P43); the four holes closed;
  the roles change to departments; the Staff console frame with Verify
  stores and Team; sign in taking numbers with a country code. Hillary,
  Patrick and Ray moved onto their real numbers.

- **2026-10-28, slices 2 and 3** (one commit): store passes, the Store
  console on real data, boosts and bulk import through the API, and the Me
  page fixed to show the signed in person. Details under "Where we
  stopped" above and in `docs/architecture/backend-plan.md`. New API files:
  `passes.ts`, `routes/leads.ts`, `routes/reveals.ts`, `routes/stats.ts`,
  `routes/boosts.ts`; new web files: `console/layout.tsx`,
  `console/stock/useConsoleStock.ts`, `components/StorePassSheet.tsx`,
  `components/ViewRecorder.tsx`, `lib/reveals.ts`; `ConsoleTarget.tsx` in
  `@snt/ui` (`useConsoleTarget()` is the store the console is open for).

- **2026-10-27, backend session** (`5a25f1c` to `12faafa`): the backend
  plan, Phases 1 to 3 and Phase 4 slice 1. In order:
  - **Phase 1, schema and seed** (`5a25f1c`): 21 tables with row level
    security (the public key reads nothing), seed from the mock data, the
    first read endpoints, Swagger; the API served by Next at `/api`.
  - **Phase 2, sign in and accounts** (`4876ad8`, `30e43e1`, `582045e`):
    Supabase Auth; the auth pages to the first app's arrangement and 3D
    pictures on one frame (`signin/AuthLayout.tsx`): sign in (email first,
    Continue with phone, Google and Facebook not connected), a three step
    sign up with steps along the top (details; neighbourhood, town and
    password; email code), forgot password, reset; verify your phone in
    Settings and as a sheet before posting or offers; a name sheet for
    phone sign ups. Build and Turbo fixes for Vercel settings.
  - **Phase 3, pages on the API** (`f1962ff`, `3192a93`): feed and listing
    pages built on the server from the database (kept a minute, refreshed
    at once after a post or change), posting, My listings and owner
    actions, offers, deal checks, saved, notifications (a new offer and its
    answer notify the other person), search and Wanted.
  - **Phase 4 slice 1** (`12faafa`): listing limits (5 person, 15 free
    store, none with a pass; Wanted never counts) with the limit sheet,
    Open a store (`/store/new`), store pages from the database, Post as.
- **2026-10-27, third session** (`70e2dea`, `6ea172c`):
  - **Accounts and stores decided** (docs only, nothing built):
    `docs/product/accounts-and-stores.md`, decisions B16 to B19 and P31 to
    P37, with dated notes in monetization, trust and safety, sign in and
    identity, and the console doc. Summary under "Decided, not built" below.
  - **Store everywhere, never dealer or shop.** Visible text: Store
    console, Verified store (the feed cards' "Verified Seller" too),
    "For stores" and "Switch to Store console" on the profile, "accepts
    offers from stores", "Let stores send me offers", "Let stores see my
    contact details", "Stores come to you".
  - **The code follows.** `allowStoreOffers`, `contactToStores`,
    `contactOpenToStores`, `VerifiedStoreBadge`, `ownsStore`, the role
    `'store'`; and Shop renamed to Store throughout: `Store`, `storeId`,
    `currentStore`, `getStore`, `getStoreBySlug`, `useStoreStock`,
    `useStoreSponsorships`, `mockStores`, `mockStoreReveals`, the
    `Storefront` component (`components/Storefront.tsx`), `StoreMark`,
    `StoreIcon`, `--snt-store-mark`, files `types/store.ts` and
    `mock/stores.ts`. The console doc is now
    `docs/product/store-console.md`. Only the design file's frame names,
    `DetailDealer` and `Shopfront`, keep the old words.
- **2026-10-27, second session** (`c5ebf63`, back on the first account):
  - **Boost, not sponsor, for sellers.** Every seller facing word says boost
    ("Boost this listing", "Boost a listing", "Boosted until …", "Extend
    boost", "Stop boost", the Stats card "Boosts"); buyers still see the
    "Sponsored" badge. Code names keep "sponsor".
  - **Boosting lives in Stock**, with **Stock and Boosted tabs**
    (`stockTab` in `useConsoleStore`; text width on a laptop, full width on a
    phone). The Boosted tab (`console/stock/BoostedTab.tsx`): a yellow "Boost
    a listing", each boost with "Until … · $3 a day · N reveals since" and a
    menu (Extend boost, View as a buyer, Stop boost with Undo), then **Worth
    boosting**, the three live items with the most reveals, each with a
    yellow Boost button. Stock rows' menus have Boost / Extend / Stop boost.
    The Sponsored items page under Stats was removed; Stats' "Boosted
    listings" opens the Boosted tab. The two Stats buttons share a row on a
    phone.
  - **Boost sheet**: "Which listing" is a dropdown of the boostable items
    (live, for sale, not boosted already), the chosen one shown under it.
  - **Stores, not shops.** "Store profile" with the storefront icon
    ("Store" on the phone bar); addresses `/store/<slug>` and
    `/console/store`, old `/shop/…` and `/console/shop` redirect
    (`apps/web/next.config.ts`). Visible copy says store; code names keep
    "shop".
  - **Sponsored in the top right** on every card: a sale's photo, a swap's
    "Looking for" tile, the right of a Wanted card's top row with the
    responses and time under it. "New" on Leads stays on the left.
  - **Feed spacing**: one sponsored listing after every three others, never
    two together; extras wait rather than piling up at the end
    (`interleaveSponsored` in `useFeedStore.ts`).
  - **Deal check pills** on Leads, Number reveals: "Deal check in 3 days"
    (was "Asking them in 3 days"), and every pill explains itself on hover
    (browser tooltip); an "Answer needed" pill opens the check too.
  - **Close buttons**: the boost banner's X is a pale green round, dark green
    with a white X on hover; the header menu's X turns blue with a white X
    on hover, as the sheets' do.
  - **Console header on a phone**: the store's initials tile is hidden below
    420px wide so the name fits beside the bell.
- **2026-10-27, first session** (on the second account):
  - **Sponsored slots, built out** (Promote's place, at the foot of Stats).
    A daily budget like boosting a post on WhatsApp: a slider from $1 a day
    (to $100), with about how many people a day it reaches, for 1 day, 1
    week or 1 month; the total shown. **Every payment goes through Paynow's
    own page** (EcoCash, OneMoney, Telecash, ZimSwitch, Visa, Mastercard are
    named, chosen on Paynow), mocked until the Paynow account is live; see
    docs/operations/payments-and-invoicing.md for going live. One sheet:
    `apps/web/src/components/sponsor/SponsorSheet.tsx` (plan, pay, on
    Paynow, done). State: `packages/core/src/stores/useSponsorStore.ts`
    (`promotionOf`/`withPromotion` feed the feed, cards and Stock).
  - **Anyone can sponsor any live listing.** A yellow "Sponsor this item"
    banner with an X (`SponsorBanner`) sits on top of a dealer's item in
    Stock (edit page) and a person's own listing page; once sponsored it is
    "Sponsored until … · $3 a day" with Extend. Stock's item menu has
    "Sponsor this item" too.
  - **Sponsored items** page (since removed: boosting moved to Stock) (`/console/stats/sponsored`, from Stats'
    "Manage sponsored items", not in the menu): a table of the shop's own
    sponsorships with Extend, View as a buyer, Stop sponsoring (Undo).
  - **Lead alerts** left Stats; their price and renewal show at the top of
    their settings sheet on Leads. The lead alerts pill is information only;
    a "Lead alert settings" button with a gear opens the sheet.
  - **Friday Drop paused** (decision P30): out of the console and mock;
    the plan is kept in docs/business/monetization.md.
  - **Notifications**: a bell with an unread count in the marketplace
    header (`/notifications`) and in the console (phone header bell; top of
    the laptop sidebar; `/console/notifications`). One list, unread lines in
    blue and bold with a blue dot, Mark all as read
    (`components/notifications/NotificationList`, `useNotificationStore`).
  - Offer cards fixed for production (their own box, not a restyled Panel).
  - Deal check: no ticks on "Yes, we completed it" or the record number.
  - Header logo: the stacked mobile one below 580px wide.
  - Seven more mock listings from private sellers (three swaps, three
    Wanted, one sale), reusing photos of the same models.
- **2026-10-26 session** (one commit):
  - Profile: "My wanted posts" row removed; **Deals to confirm** is a list
    (`/me/deals`, To confirm and Answered) of deal checks, each opening
    `/deals/<id>/confirm`.
  - **Deal checks** start from an accepted offer (both asked) or a signed in
    number reveal (the revealer first, the owner only after a yes); guest
    reveals ask nobody. Roles are asker and owner. Decision P27.
  - **Contact toggle** on every post: "Only share my contact details after
    I accept an offer"; with it on, "Let dealers see my contact details".
    Such listings show only the offer button and say "Offers only" on their
    feed cards. Decision P28.
  - **One kind of offer**: "Make an offer" everywhere, one form. On a sale,
    "Just cash" where the price moves, plus swap choices where it takes
    swaps. Sales take offers when negotiable, accepting swaps, or contact
    after offer. Decision P29.
  - **Toasts** always in front: one toaster, moved into an open sheet;
    sheets animate an inner panel, not the dialog.
  - **Dealer console**: Promote is now **Stats** (`/console/stats`: time
    switch, four numbers, bar graph, best items, lead sources, promotion at
    the foot; mock data in `packages/core/src/mock/stats.ts`). Swap offers
    is now **Offers** with Received and Sent, laid out as the profile's
    Offers page (shared `components/offers/OfferGroups`); Leads keeps
    Matching requests and Number reveals. Number reveals rows name the
    person only once they say a deal happened, and only "Answer needed"
    rows open (the shop's deal check). Matching requests restyled as the
    Wanted card; swaps there and in the Wanted feed read "Swap", not
    "Wanted + Swap".
  - Sign in is remembered in local storage until you sign out.
  - CLAUDE.md rule 10: keep it simple, fewest taps, only what was asked.
- **2026-10-22, committed with the first version of this file:**
  - My listings tabs split into All, Swaps, For Sale (Sale on a phone),
    Wanted, as on the feed.
  - Even tabs tighten on narrow phones; the sliding block re-measures when
    any tab changes width.
  - The "This person accepts offers from dealers" note is hidden on your
    own Wanted listing (shown to everyone else, and in View as a buyer).
  - On offers, the shop or person icon sits 3px from the name.
  - 20px from the header band to the first listing from tablet up.
- `fddc7a2` Your own listing cards count "Offers on this listing" under your
  name, with save and share in the bottom corner; no offers button or
  response count on your own Wanted card.
- `1aa00c2` The Offers page (`/me/offers`): each listing summarised (photo,
  kind, status, name, terms, "View this listing") with its offers under it
  on the thread line, for Received and Made. Offer cards smaller and pale
  blue, price labels ("Their price", "You add") small and grey over the
  amount. Accepted offers show contact tiles (WhatsApp and Call side by side
  on a phone; Email and Messenger full width). Withdrawing closes the offer
  sheet. Toasts on a phone sit just above a bottom bar, or 12px from the
  foot when there is none (`apps/web/src/components/ToastOffset.tsx`, bars
  marked `data-bottom-bar`).
- `f2b3bea` Segmented tabs everywhere; the header logo and the footer's
  Homepage link always open the feed on All (`HomeLink`); bigger, full width
  social icons in the menu.
- `d4b8dd2` and earlier: console header and phone menu, footer, lead alerts,
  Leads tables, icon tiles, the app menu, help and legal pages, sign in,
  loading skeletons, the post form, swap language everywhere.

## Known loose ends and ideas offered

- **Where we stopped:** see the section near the top.
- **Gaps in what is built:** (photos are uploaded since 2026-11-06, "Photos
  on R2"); editing a listing is not built; Show contact does not
  ask for a verified phone yet; deal checks, expiring listings and leads
  send no notifications yet; Google and Facebook sign in are not connected;
  email and phone codes are mock (123456) and would work on the live site
  for anyone until real email (Supabase SMTP) and SMS (a provider in place
  of the Twilio placeholders) are set up; Supabase Redirect URLs need
  `http://localhost:3000/**` and the Vercel address for real reset links;
  other people's names and badges on cards come from the mock data; bulk
  import does not take photos yet.
- The feed shows one sponsored listing per three others, so on short type
  tabs (Swaps, Wanted) only one of two sponsored shows; spacing every two
  was offered, not built.
- The deal check pills' explanations are browser tooltips: they show on a
  laptop only, not on a phone.
- The desktop app used to start its own preview server on port 3001 when
  port 3000 was taken (`autoPort` in `.claude/launch.json`), which shares
  `.next` with the user's server and breaks pages and the API. `autoPort`
  is now off (2026-10-28), so the preview reuses 3000 or fails instead. If
  a server on 3001 appears anyway, ask the user to stop it.
- The budget slider runs $1 to $100, so each dollar is a tiny movement on a
  phone; a lower top or minus and plus buttons were offered, not built.
- On sale and swap cards' bottom line, the place and age get trimmed first
  when space is short ("Gre… · Offers only").
- Paynow is mocked: a boost or pass payment "succeeds" after a moment and
  is saved as a test payment. Nothing is really charged.
- **With the API: one home per account.** A dealer's own profile should
  point shop matters (My listings, Offers, shop deal checks) to the console
  rather than repeat them; only personal things (Saved, Settings) stay in
  the profile. See docs/product/store-console.md, "One home per account".
- The Leads tabs could move onto the shared `Tabs` component.
- Made offers are listed in store order, not strictly newest first; real
  dates would allow sorting.
- No sample person has both WhatsApp and Call, so the side by side contact
  pair on a phone has not been seen on screen.

## Testing tips

- **Test against the API with curl:** sign in a test number through
  Supabase (`/auth/v1/otp` then `/auth/v1/verify` with token 123456, using
  the publishable key from `.env`), then call `http://localhost:3000/api/...`
  with `Authorization: Bearer <access_token>`. Swagger at `/api/docs` lists
  every endpoint.
- **Clean up test data** in the shared database: delete test listings
  (and their items and details) and test stores you made, and run
  `db:seed-activity` after changing offers, deal checks, saved or
  notifications. Name test data "Test …" so it is easy to find.
- One-off database scripts: run from `apps/api` with Node, load the root
  `.env`, and use the transaction pooler (`DATABASE_URL` with port 6543) so
  they do not compete with the dev server for the session pooler's 15
  connections.
- The browser pane often does not paint until a screenshot is taken, and a
  page can look unhydrated for a long while. Read state with
  `javascript_tool` (and wait a few seconds) rather than trusting the first
  screenshot.

- The Claude browser pane can be hidden, which throttles
  `requestAnimationFrame` and transitions: screenshots may be stale or caught
  mid animation. Measure with JavaScript (`getBoundingClientRect`) when in
  doubt, and wait a moment before screenshots.
- Clicking before hydration does nothing; wait, or navigate with
  `window.next.router.push(path)`.
- Editing a file in `packages/core` or some `packages/ui` files triggers a
  full reload, which resets offers and the like; you stay signed in.
- Check phones at 375 by 812 and laptops at about 1024 wide.
- One dev server only. On 2026-10-26 the desktop app started a second
  preview server on 3001 by itself when the session reopened, and pages lost
  their styles (CSS 404s); run `preview_list` and stop the stray one.
- Clicks in the browser pane sometimes fail while the tool safety checker is
  unavailable; a click done through `javascript_tool` usually still works,
  and file edits can go through the Edit and Write tools.
