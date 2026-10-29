# Swap & Top v2: working notes for Claude

Read `docs/HANDOFF.md` first. It holds where the work stands, how the code is
laid out, the design patterns in use and what was done most recently; its
"Where we stopped" says what comes next. The backend's phases, slices and
endpoints are in `docs/architecture/backend-plan.md` ("Where it stands").
`docs/00-SUMMARY.md` and the rest of `docs/` describe the product itself.

## Where things stand (2026-10-29)

- **Built and live on `main`:** Phases 1 to 4 (everything a person and a
  store uses, on the database), apart from real Paynow payment, which
  waits on Hillary's merchant account. Every contact number shown is real
  (`apps/api/src/contact.ts`).
- **Phase 5, the Staff console:** everything planned for Trust and
  safety is built and live. Roles are only `user` or `super_admin`; staff
  are in `staff_departments` as member or lead, checked with
  `inDepartment` (`apps/api/src/staff.ts`) and `useInDepartment`
  (`apps/web/src/lib/staff.ts`). The console at `/staff` (sections in
  `apps/web/src/app/staff/sections.tsx`, shown once `built: true`): Verify
  stores, Team, Reports, People, Appeals and the Activity log, with
  waiting counts on Reports and Appeals. Who may act on whom, what an
  action does and how it is undone are in `apps/api/src/moderation.ts`.
  A banned account sees only its ban and appeal (`BannedGate`), and the
  API refuses it everything else (`apps/api/src/app.ts`).
- **All loading is on TanStack Query** (`apps/web/src/lib/query.tsx`;
  the rule is below under "Working with the backend").
- **Next, in Hillary's order** (details in the handoff's "Where we
  stopped"): 1. move the button actions (posting, stock, owner tools,
  report, verify phone, your name, offers, deals, saved, notifications,
  boosts) onto TanStack Query mutations; 2. go through each Staff
  console page with Hillary for how it looks, as was done for the
  Activity log, keeping it cohesive with the Store console; 3. a design
  pass on the Store console; 4. ask about the open safeguards; 5. Phase 6
  (Executives, Board, Finance, Sales). `docs/product/staff-console.md`
  has the console's design and safeguards (section 9).
- **Real accounts:** Hillary (super admin), Patrick and Ray are on their
  real phone numbers. Never run `db:seed` (it would put them back on test
  numbers). On the live site test numbers (077 000 0xxx) carry no staff
  powers. For scripted staff tests use Tafadzwa (0006, Trust and safety
  lead) and Rumbi (0005, member).

## Standing rules from the product owner (Hillary)

These came from repeated feedback. Follow them without being asked.

1. **Never commit or push unless asked.** The site deploys live from `main`.
   Make changes, verify them, report them as uncommitted, and wait.
2. **Never create or delete a git branch without consent.** Work on
   `redesign/pdf-style` unless told otherwise.
3. **One dev server.** Before previewing, check port 3000
   (`lsof -iTCP:3000 -sTCP:LISTEN`). If something listens, use
   http://localhost:3000. A second `next dev` shares `apps/web/.next` and
   corrupts it. Killing or restarting the user's server needs consent.
4. **No dashes in visible text.** No em or en dashes, and no hyphenated
   words ("sign in", "signed in", not "sign-in"), in UI copy, toasts, labels,
   aria labels or mock data. Keep replies to the user dash free too.
5. **Say swap, never trade.** No "trade", "trade in" or "trading" in UI,
   hints, comments or docs: "Accept swaps", "Offer a swap", "Swap offers",
   "Swaps welcome". Code names like `tradeIn` or `/console/trade-ins` stay.
6. **Plain button labels.** Literal words ("View as a buyer", "View this
   listing"), never clever or figurative ones.
7. **Buttons, not text links.** Cancel, Back to…, Not yet and similar are
   real buttons (`variant="secondary"`, blue outline), never underlined links.
   The one exception the owner asked for: the small line at the foot of the
   sign in and sign up cards ("Don't have an account? Sign up").
8. **Forms.** Text boxes start empty with a faded "e.g." placeholder; every
   choice starts on its first option; one pale pill text box style; half
   width boxes side by side where they fit; hover states very subtle and only
   under `@media (hover: hover)`.
9. **Listings are listings.** Call posts "listings" in UI copy.
10. **Keep it simple, with as few taps as possible.** Every change to the
    interface or the system should be simple and easy to find your way
    through. Prefer one control over several, a toggle over a set of
    choices, and fewer steps to finish an action. Do only what was asked:
    no extra options, settings or rules beyond the request. When a choice is
    needed, offer the fewest options that work and start on the common one.
    If a request seems to need something complex, say so and suggest the
    simple version before building it.

## Working with the backend

- **The database is shared** by localhost and the live site. Name test data
  "Test …", delete it when done (listings with their items and details,
  stores with their members), and run `pnpm --filter @snt/api
  db:seed-activity` after changing offers, deal checks, saved listings or
  notifications. Never run `db:seed` (it empties every table) without
  asking.
- **Secrets stay put.** The root `.env` and `apps/web/.env.local` are git
  ignored; the owner fills them. Never print or paste their values. Vercel
  has them for Production only: Preview has none, so the Preview deploy
  of each branch push fails (it builds against no database). That is
  expected; check the Production deploy of `main` (`npx vercel ls`), not
  the commit's status on GitHub. `turbo.json` must list any new setting,
  or the build will not see it.
- **Mock codes:** email and phone codes are 123456 until real email and SMS
  are set up (`MOCK_CODE` in `apps/api/src/supabaseAdmin.ts`). Test phone
  numbers 077 000 0001 to 0007 (see the handoff).
- **Connections:** Supabase's session pooler allows 15. One-off scripts use
  the transaction pooler (port 6543); the API keeps one pool across hot
  reloads and one connection per build worker.
- **Speed:** the database is in Ireland (eu-west-1). On Vercel the API and
  pages run in Dublin: the project's Function Region is set to Dublin
  (dub1) in Vercel's settings (the code's `preferredRegion = 'dub1'` alone
  was ignored on this plan). Live, signed in requests take about 0.6 s.
  From the owner's laptop each trip is about half a second, so local pages
  are slower than live. Keep trips few and in parallel: the
  person for a sign in is kept for 15 seconds (`personFor`), "last seen"
  is not waited for, and `loadListings` reads everything in one batch.
- **Load data with TanStack Query, never `useEffect`** (the owner's
  rule, 2026-10-29). A page reads with `useQuery` and `apiGet` (or
  `publicGet` for public data), changes with `useMutation` and `apiSend`
  (`apps/web/src/lib/query.tsx`), and shows a failure with
  `QueryProblem` (Try again) or, for a query shared by several screens,
  `meta: { toast: true }`. After a change, update the cache or refresh
  the queries it touched. Effects are only for things that are not
  loading (a listener, a timer, the browser's storage).
- **A new endpoint** goes in `apps/api/src/routes/<area>.ts` with a
  `createRoute` (so it shows in Swagger at `/api/docs`), is registered in
  `apps/api/src/app.ts`, and is called from the web app with `apiAsViewer`
  (`apps/web/src/lib/supabase.ts`). Pages built on the server read the API's
  own functions (`apps/web/src/lib/listings.ts`, `stores.ts`), not HTTP.
- **Migrations:** `db:generate` writes one; `db:migrate` changes the shared
  (live) database, so ask the owner before running it, every time.
- **Payments are test ones** until a Paynow account is set up: store passes
  and boosts record a `payments` row with provider `test`, paid at once.
  Hillary will open the Paynow merchant account later; what then needs
  doing is under "Waiting on the owner" in the handoff.
- **The Store console** opens for the store in `useConsoleTarget()`
  (`@snt/ui`), not the mock `currentStore`; its endpoints answer 402 with
  `code: 'pass'` when no pass covers now. Pages use the signed in person
  from `useSessionStore`, never the mock `currentUser`.
- **Test what you build** against the API (curl with a test number's token)
  and in the browser, then put the data back.

## How the user works

Hillary dictates by voice, so messages can be cut off or misheard
("office" means "offers", "cheapo N" is "Chipo N."). When a message is
ambiguous, pick the most likely reading, do it, and say how you read it.
They review visually on a laptop and on a real phone, and will say when
something should be undone.

Show progress the way Hillary asked: a short one line status before each
step, and a checklist of the steps (`- [x]` done, `- [ ]` to do) at the
start of a job and in the final reply. Use a task list tool for it when
the session has one.

## Commit flow (only when asked)

1. Check the branch (`redesign/pdf-style`).
2. `pnpm -s typecheck`.
3. Production build in a throwaway worktree in the scratchpad, so the
   running dev server's `.next` is untouched:
   `git worktree add --detach <dir> HEAD`, rsync the working tree in
   (excluding `node_modules`, `.next`, `.git`, `.turbo`),
   `pnpm install --frozen-lockfile --prefer-offline`, `pnpm build`, then
   `git worktree remove --force <dir>`.
   The build reads the database (feed, listing and store pages are built
   ahead), so rsync the settings files in too; a build with none still
   passes, on the mock data, with warnings.
4. `git add -A` (check no `.env` file is listed), commit with a plain
   sentence subject and a short body, ending with the attribution line the
   session asks for.
5. Push the branch; check `git merge-base --is-ancestor origin/main HEAD`;
   `git checkout main && git merge --ff-only redesign/pdf-style`;
   push `main`; check out `redesign/pdf-style` again.
6. Wait for Vercel (about five minutes) and check the live site answers the
   new pages or endpoints before saying it is live.
