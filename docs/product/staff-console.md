# Staff Console

## Where our own team runs the platform, each person seeing what their department needs

**Status:** Decided 2026-10-28 with Hillary (decisions P39 to P43). Being built in Phases 5 to 7 of [../architecture/backend-plan.md](../architecture/backend-plan.md). Built so far (2026-10-28): the roles change and `staff_departments`, with every staff check in the API asking for a department (`apps/api/src/staff.ts`); the console frame at `/staff` with its sections list (`apps/web/src/app/staff/sections.tsx`, showing only built sections); Verify stores inside it; Team, with every change written to `staff_log`.
**Read this if:** you are building anything staff use: reports, verifying stores, the team, business numbers, money, or system health.

---

## The short version

1. **One Staff console for the whole company.** Built like the Store console: the same frame, a sidebar on a laptop, tabs along the bottom on a phone. It opens from "For our team" on Me.
2. **Departments decide what you see.** A person is put into one or more departments. Their console shows the sections of every department they are in, and nothing else. Everyone's console can look different.
3. **Member or lead decides what you can do.** Inside each department a person is a member or a lead. A lead also does that department's bigger actions and adds or removes its members.
4. **Hillary turns it on and off with toggles.** A Team page lists each staff member once, with one toggle per department and a Lead switch beside each toggle that is on.
5. **Roles shrink to two.** An account is a **User** or the **Super admin**. Moderator and admin stop being roles: they become Trust and safety member and lead.

---

## 1. Roles: only two kinds of account

| Role | Who | What it means |
|---|---|---|
| **User** | Everyone who signs up, staff included | Posts, swaps, asks, saves, reports, opens stores. Staff are users who are also on the team |
| **Super admin** | Hillary only | Sees every section, can do everything, and manages the team |

Guests (not signed in) are not stored: a guest is simply "no session".

**What happens to the old roles:**

| Before | After |
|---|---|
| User | User, the same |
| Moderator | User, plus **Trust and safety member** |
| Admin | User, plus **Trust and safety lead** |
| Super admin | Super admin, the same |

The test accounts moved the same way: Rumbi M. (077 000 0005) became a Trust and safety member; Tafadzwa A. (0006), Patrick M. (0008) and Ray L. (0009) Trust and safety leads; Hillary M. (0007) stays super admin. Then, as Hillary set on 2026-10-28: Ray is also a member of Sales, Marketing and Finance; Patrick is in every department, lead of Trust and safety, Sales and Marketing (the seed's `TEST_STAFF`).

---

## 2. Departments and what each sees

| Department | Who | Sections they see | Members can | Leads can also |
|---|---|---|---|---|
| **Trust and safety** | The people who keep the platform safe | Reports, People, Appeals, Verify stores, Activity log | Claim and clear reports, remove listings, warn, suspend (ordinary users only) | Ban; decide appeals; verify or decline stores; act on members of the team; add or remove Trust and safety members |
| **Sales** | The people who sell passes, boosts and verification to stores | Stores: free, paid, pass ending soon, lapsed, verified, each with the owner's name and phone number. Who to approach: free stores near 15 listings, people near 5 | Look and call | Export the list; add or remove Sales members |
| **Finance** | Money | Money: every payment (passes and boosts) by day and month, revenue by product, failed payments, the Paynow record of each | Look | Export for accounting; add or remove Finance members. Refunds come once Paynow is live |
| **Marketing** | Growth and promotion | Growth: new and active people, where visitors come from, what people search for, popular categories, Wanted demand, how boosts perform. Totals only, never names or numbers | Look | Export; add or remove Marketing members |
| **DevOps** | Engineering | Health: errors, slow pages, the last deploy, database connections, background work (such as the store pass check that runs as pages are read). No access to people's data | Look | Add or remove DevOps members |
| **Executives** | Leadership | Overview: the headline numbers of every department, as totals, with charts over time | Look | Add or remove Executives members |
| **Board** | Board members | Board summary: a short monthly report of the main numbers, shorter than the Executives' Overview | Look | Add or remove Board members |
| **Super admin** | Hillary | Every section, plus Team | Everything | (not a department: it is the role) |

**Who may act on whom (as the first app had it):** a Trust and safety member acts only on ordinary users; a lead also on members of the team; the super admin on anyone. Nobody acts on the super admin.

---

## 3. How it is stored

One new table, `staff_departments`: **one row for each department a person is in**.

| Column | Holds |
|---|---|
| `person_id` | Who |
| `department` | One of: `trust_safety`, `sales`, `finance`, `marketing`, `devops`, `executives`, `board` |
| `lead` | Yes or no: lead of this department |
| `added_by_id`, `added_at` | Who added them, and when |

A person in two departments has two rows; in four, four. A person with no rows is an ordinary user. `people.role` keeps only `user` or `super_admin`.

**Example:**

| person | department | lead |
|---|---|---|
| Rumbi | trust_safety | no |
| Tafadzwa | finance | yes |
| Tafadzwa | executives | no |

Every change to the table (a toggle on or off, a lead switched) is written to the activity log: who, what, when.

---

## 4. How it looks

**Team page** (the super admin; a lead sees only their own department's column). Each staff member appears once, with a toggle per department; Lead appears beside a toggle that is on. Toggling saves at once. "Add a person" finds anyone by name or phone.

```
              Trust   Sales  Finance  Marketing  DevOps  Executives  Board
Rumbi          [on]    [ ]     [ ]       [ ]       [ ]      [ ]        [ ]
Tafadzwa       [ ]     [ ]     [on]      [ ]       [ ]      [on]       [ ]
                              Lead [on]
```

**Each person's console** shows the sections of their departments only:

- Rumbi (Trust and safety member): Reports, People, Appeals, Verify stores, Activity log (with member actions only).
- Tafadzwa (Finance lead and Executives): Money, with Export, and Overview.
- Hillary: every section, and Team.

**The server checks the departments on every request**, so a section that is not shown cannot be opened by typing its address either.

---

## 5. Principles

1. **See only what your job needs.** Names and phone numbers are shown only to Trust and safety (to deal with reports) and Sales (to call stores). Everyone else sees totals. This protects users and follows Zimbabwe's Cyber and Data Protection Act.
2. **Looking is not acting.** Only Trust and safety acts on people; only the super admin and leads change who is on the team.
3. **Everything done is logged.** Who did what and when, kept for checking.
4. **Staff use their own accounts,** as store staff do. No shared logins.
5. **Real numbers only.** Figures come from what the app records. Where a figure needs a business definition (what counts as an "active" person, whether "value swapped" includes cash on top), Hillary decides it before it is shown, rather than the console showing sample figures as the first app did.

---

## 6. What is recorded today, and what is not

Already recorded, ready for the numbers: sign ups, last seen, listings and their states, views, reveals (with way and slot), offers, deal checks, saved listings, stores and passes, payments and their events, boosts, verification requests.

**Not recorded yet,** needed before some sections can be built:

- **Marketing:** where visitors come from (referrer and campaign tags) and what they search for.
- **DevOps:** errors and slow requests (partly visible in Vercel and Supabase already).

---

## 7. In which phase

| Phase | What | Why this order |
|---|---|---|
| **5** | The Staff console frame, `staff_departments`, the roles change, Team, and Trust and safety: Report on listings and people, the Reports queue, People, Appeals, Verify stores (moved in from `/admin/verify`), the Activity log | Keeping people safe comes first once real people use the site |
| **6** | Executives Overview, Board summary, Finance, Sales | The money and business side, from data already recorded |
| **7** | Marketing and DevOps | They need new recording first (traffic sources, searches, errors) |

**Left out on purpose, from the first app:** approving listings before they go live (dropped; listings go live at once), system health and uptime (Vercel and Supabase show it), security and system settings pages (nothing to set yet; added when there is).

---

## 8. Production access: passwords sit outside the console

The console decides what staff see **inside the app**. It cannot limit anyone who holds the live database password, Supabase or Vercel: they can read everything. So DevOps and anyone else with those keys are limited **on the accounts themselves** (decision P42):

1. **Few people hold production keys.** Only Hillary and one or two trusted senior engineers get full access to the live database, Supabase and Vercel. Being in DevOps does not by itself give it.
2. **Developers work on a separate development database** with sample data, never real people's details. Today localhost and the live site share one database; it must be split before real users join (see the handoff's "Before launch").
3. **Everyone has their own named login,** never a shared password, so access shows who it was and one person can be removed alone.
4. **Most production access is look only.** A read only database login for debugging; write access only for the one or two who need it. Supabase keeps a record of access.
5. **Keys are changed** when someone with access leaves, and kept only in `.env` files and Vercel, never in chat, code or documents.
6. **Logs carry no personal data:** phone numbers, emails and names are not written to error logs or request logs, so DevOps' everyday tools do not expose them.

When a developer truly needs real data, they use their own logged access: a deliberate step, not a screen open all day.

---

## 9. Loopholes, and the rules that close them

Found in a review on 2026-10-28, going through each kind of account. Each rule is part of the design; Phase 5 to 7 build them with the sections they belong to. Holes found in what is **already built** are listed in the handoff ("Before launch") to fix first.

### Everyone on the team

- **Staff sign in more strongly.** A code by SMS can be stolen by swapping someone's SIM card. Staff accounts need a password as well as the phone code (or an authenticator app) before the console opens.
- **Checked on every request.** Departments are read from the database each time (no copy kept in the sign in), so removing someone takes effect at once.
- **Nobody acts on themselves**, on a report they filed, a report about them, or anything about a store they own or work for. Those go to someone else.
- **Every action and every look at a person's record is logged**, including exports and phone numbers shown, and the log cannot be edited or deleted from the console.
- **Leaving the company:** one "Remove from the team" on Team takes away every department at once.
- **No test staff accounts on the live site** (see the handoff's "Before launch").

### Super admin (Hillary)

- **Not a single point of failure.** If Hillary's phone is lost or her account is taken, nobody could manage the team. A second, sealed super admin account (or a written recovery step with the developers) is kept for emergencies, and its use is logged and noticed.
- **Only the super admin makes leads**, and only the super admin can add someone to more than one department at once. A lead adds and removes members of their own department only.

### Trust and safety

- **Members act only on ordinary users;** reports about anyone on the team go to leads, and reports about a lead go to the super admin.
- **Conflicts of interest:** a member who runs a store does not handle reports about that store or its listings.
- **Reporters stay private:** the person reported never learns who reported them.
- **Bans need a lead,** and an appeal is decided by a lead other than the one who acted.
- **Verify stores:** nobody verifies a store they own or work for, and the decision names who made it.
- **False reports:** a person can report a limited number of times a day, and reports cleared as false count on the reporter's record.
- **Data requests:** a person asking for their data or for their account to be deleted (their right under the Cyber and Data Protection Act) is handled by a Trust and safety lead, with deal and report records kept as the law allows.

### Sales

- **Phone numbers are for calling, not copying:** shown one at a time, each look logged; exports (leads only) leave out phone numbers unless the super admin allows it.
- **Store owners agree to be called** when they open a store (a line in the terms), and can say no; a store that said no is marked and not called.

### Finance

- **Look only.** Refunds, when Paynow is live, need a Finance lead and are logged; a large one needs the super admin too.
- **Exports are logged** and hold no more personal data than the accounts need.

### Marketing

- **Totals only, and no tiny groups:** a figure about fewer than 5 people is not shown, so a total cannot point at one person.
- **Searches are kept without who searched,** and anything that looks like a phone number or email is removed before it is stored.

### DevOps

- See section 8. In the console: health only, no people's data, no exports.

### Executives and Board

- **Totals only,** with the same "fewer than 5" rule.
- **Board members are outside the company:** they get their own accounts in the Board department only, and the monthly summary holds no personal data. Removing a board member is one toggle.

### Store owners and store staff (not our team, but the same kind of hole)

- **Staff never see the store's payments** or its own phone number setting (already so), and lose access the moment they are removed (already so).
- **Selling a store** (handing it to a new owner) pauses Verified store until the new owner is checked, when that is built.

---

## Related documentation

- [../architecture/backend-plan.md](../architecture/backend-plan.md): roles, the report chain, the phases
- [../features/moderation.md](../features/moderation.md): reports, outcomes, the violation matrix, appeals
- [./accounts-and-stores.md](./accounts-and-stores.md): people, stores, passes, verification
- [./store-console.md](./store-console.md): the console the Staff console is built like
- [../reference/decisions-log.md](../reference/decisions-log.md): P39 to P43
