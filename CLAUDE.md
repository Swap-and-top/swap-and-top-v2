# Swap & Top v2: working notes for Claude

Read `docs/HANDOFF.md` first. It holds where the work stands, how the code is
laid out, the design patterns in use and what was done most recently.
`docs/00-SUMMARY.md` and the rest of `docs/` describe the product itself.

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

## How the user works

Hillary dictates by voice, so messages can be cut off or misheard
("office" means "offers", "cheapo N" is "Chipo N."). When a message is
ambiguous, pick the most likely reading, do it, and say how you read it.
They review visually on a laptop and on a real phone, and will say when
something should be undone.

## Commit flow (only when asked)

1. Check the branch (`redesign/pdf-style`).
2. `pnpm -s typecheck`.
3. Production build in a throwaway worktree in the scratchpad, so the
   running dev server's `.next` is untouched:
   `git worktree add --detach <dir> HEAD`, rsync the working tree in
   (excluding `node_modules`, `.next`, `.git`, `.turbo`),
   `pnpm install --frozen-lockfile --prefer-offline`, `pnpm build`, then
   `git worktree remove --force <dir>`.
4. `git add -A`, commit with a plain sentence subject and a short body,
   ending with the attribution line the session asks for.
5. Push the branch; check `git merge-base --is-ancestor origin/main HEAD`;
   `git checkout main && git merge --ff-only redesign/pdf-style`;
   push `main`; check out `redesign/pdf-style` again.
