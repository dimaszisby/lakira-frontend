# Hand-off: UI-refactor follow-ups

**Period:** 2026-09-12 → 2026-09-15
**Scope:** the 13 follow-ups listed under "Follow-ups, not done here" in
[`todos/2026-09-11-todo-ui-components-refactor.md`](./todos/2026-09-11-todo-ui-components-refactor.md)
**Outcome:** 12 of 13 closed across PRs #18–#26. One is a decision, not a task, and is open.

Every ticket has its own todo file under `todos/` with the full reasoning; this is the summary.

---

## 1. Read this first: three of the original diagnoses were wrong

The follow-up list was written from a browser session and several of its root causes did not survive
investigation. This matters for how much the rest of that list should be trusted.

| Ticket                                             | What the note said                                                                      | What was actually true                                                                                                                                                                                                                                           |
| -------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **4** — `/logs/new` shows "Page not found"         | `[logId]/page.tsx` serves `logId="new"`, fetches `/metric-logs/new`, calls `notFound()` | No such fetch happens anywhere. "Page not found" was the **session** bug (ticket 3) — `[metricId]/layout.tsx` turns any fetch failure into `notFound()`. The real defect was a broken route interception, invisible because Next falls back to a full page load. |
| **3** — sessions die at 15 minutes                 | check whether `/api/auth/login` captures the refresh cookie                             | `/api/auth/login` was **dead code** — nothing imported it. Login runs through `/api/proxy/auth/login`, and the proxy discarded the backend's `Set-Cookie`.                                                                                                       |
| **9** — mapping `--space-*` changes `*-7` app-wide | 1.75rem → 2rem affects the app                                                          | No `*-7` utility exists in the codebase, and none is generated in the build. The change moves no pixel.                                                                                                                                                          |

Ticket 6 was also real but **latent**: the theme key mismatch could not bite, because nothing in the
app calls `useTheme` or `setTheme` — there is no theme switcher at all.

---

## 2. Tickets

| #   | Ticket                                     | PR  | Notes                                                                                               |
| --- | ------------------------------------------ | --- | --------------------------------------------------------------------------------------------------- |
| 1   | Log Out never clears the session           | #18 | `Sidebar` rolled its own mutation to the proxy; the route that clears cookies was never reached     |
| 2   | `/login` redirects on cookie presence      | #18 | Now tests `isSessionTokenUsable`. With (1) this was a trap with no exit from inside the app         |
| 3   | Sessions die at ~15 minutes                | #18 | Proxy now captures and re-scopes the refresh cookie; see §3 for what else this required             |
| 4   | `/logs/new` unreachable                    | #21 | Root cause was two interceptors matching one segment; see §1                                        |
| 5   | `/account` stuck on "Loading…"             | #20 | `startedRef` deadlocked against its own effect cleanup under StrictMode                             |
| 6   | Theme key mismatch                         | #20 | Latent — no theme switcher exists                                                                   |
| 7   | Duplicate-name check always 400s           | #22 | Moved to the cursor contract. **It was failing open**: conflicting metric names have been creatable |
| 8   | Widen the `ui/`-only lint rules            | #25 | Two rules widened; `no-arbitrary-value` deliberately left scoped — see §5                           |
| 9   | Map `--space-1..7` to Tailwind             | #26 | Visual no-op; removes the second source of truth for the scale                                      |
| 10  | `phosphor-react` → `@phosphor-icons/react` | #23 | 32 files, specifier-only change, all 34 icon names verified present in v2                           |
| 11  | Button tokens fail WCAG AA                 | —   | **Open. Decision, not a task** — see §4                                                             |
| 12  | `src/utils/theme.ts` unused                | #20 | Deleted; `src/utils` coverage rose 55.33% → 70.04%                                                  |
| 13  | `testing.md` coverage claim stale          | #20 | Rewritten with verified numbers                                                                     |

---

## 3. Five bugs found that were not on the list

**The edge session gate had never run.** (#18) `middleware.ts` sat at the repository root while
`app` is at `src/app`, and Next 16 renamed the convention to `proxy`. Next never loaded it. It
failed silently because `(app)/layout.tsx` also redirects — just without a `returnUrl` and only once
rendering has started. Now `src/proxy.ts`, with the matcher-sync test reading it by path.

**Every auth error reported as a connection failure.** (#19) `auth.api.ts` flattened the Axios error
into a plain `Error`, the forms normalized it a second time, and `friendlyMessageFor` fell through
to "We couldn't reach the server". Wrong password, rate limit and 500 were indistinguishable.

**Refresh rotation would have revoked sessions under concurrency.** (#18) The backend revokes the
whole token family on replay. A page firing several queries at once 401s together, so fixing the
capture without coalescing would have logged users out _because_ refresh finally worked.

**Four phantom colour classes across six sites.** (#24) `tailwind.config.mjs` replaces Tailwind's
palette, so a class naming an undefined colour generates no CSS — silently. **Both route error
boundaries had been rendering with no error styling at all.** Also `text-muted-foreground` (a shadcn
leftover), `text-ink-600` and `bg-card`.

**A second, unreported instance of the interception bug.** (#21) Found by the regression test, in
`metric-categories/[categoryId]/metrics/@modal`. Nobody had reported it.

---

## 4. The one open item: ticket 11

Button colour tokens fail WCAG 2.1 AA (4.5:1) in **light mode**:

| Variant     | Measured |
| ----------- | -------- |
| primary     | 1.96:1   |
| secondary   | 1.96:1   |
| destructive | 3.13:1   |
| tertiary    | 2.68:1   |

Nothing was changed. The owner's instruction was to document rather than decide, and
`.claude/rules/styling.md` treats the brand identity — palette values, brand mapping, **Button
colour tokens**, fonts, type scale — as fixed input.

The cheapest fix that does not touch the palette is repointing each button token at a different step
of the ramp it already uses, as the contrast pass in PR #17 did for focus rings, error text and
control borders. That needs a decision from whoever owns the brand.

---

## 5. Decisions taken during the work, and why

- **`no-arbitrary-value` was not widened** with the other two lint rules. The five uses outside
  `ui/` are `min-h-[50vh]`, `max-h-[80vh]`, `grid-rows-[auto_1fr_auto]` and two scrollbar-hiding
  properties — viewport units, grid templates and raw CSS the token system does not model. They are
  not token bypasses; there is no token they could have used.
- **`src/components/layout` was added** to the widened rules beyond the ticket's stated scope: it
  had `bg-ink/40` and `bg-bg/95` doing exactly what the rule forbids.
- **The refresh cookie stays scoped to `/api`.** Widening it to `/` looks like the obvious fix for
  navigation, and is actively dangerous: `getServerAuthHeaders()` forwards every cookie, so a server
  component would rotate the token during SSR and discard the new value into an internal fetch,
  leaving the browser holding a token the backend reads as replay.
- **`/api/auth/login` and both offset list paths were deleted** rather than repaired. Each was
  unreachable code that duplicated a working path.

---

## 6. Open follow-ups

**Needs a backend change (different repo):**

- **`/auth/register` issues no refresh cookie.** `controller.ts` calls `setRefreshCookie` on login
  and refresh but not register, so a newly registered user's session still ends when the access
  token expires. Looks like a frontend bug; is not one.

**Frontend, unclaimed:**

- **No desktop edit affordance for logs.** `MetricLogsClient` passes `onEdit` to `LogTable` but
  never `onRowClick`, so clicking a row does nothing on desktop. Edit works on mobile and by URL.
- **`metric-categories/[categoryId]/metrics/**`is dead.** Nothing navigates to it —`MetricListSection`pushes to`/metrics/new`and`/metrics/:id/edit`. Made correct rather than
  deleted, since deleting a route subtree is an owner's call.
- **No theme switcher.** The token system, the pre-paint script and the docs all support light and
  dark; nothing lets a user choose.
- **`withAuth` is a third, redundant gate.** `/account` is already gated by `src/proxy.ts` and by
  `(app)/layout.tsx`, and the page fetches its own profile. It is also one of four files quarantined
  from the layer rule; deleting it would take that list to three.
- **401 copy is wrong on the login form.** `handleApiError` maps 401 globally to "Your session
  expired. Please log in again." A rejected password is not an expired session.
- **`src/hooks/useAuth.ts` is dead code** that imports `useRouter` from `next/router` — a Pages
  Router API the App Router does not have. It would throw if anything called it.
- **A `Set-Cookie` written during SSR is discarded.** The proxy's cookie clear and rotation only
  reach the browser from a client-side call. It self-heals on the next client call, and it is why
  the refresh cookie must stay on `/api`.
- **Five files keep riding along with `eslint --fix`.** Pre-existing import-order and `sonarjs`
  warnings in `useRouteSync`, `sanitizeErrorMessage`, `cursorSort.test` and two metric-category route
  files. Reverted twice to keep diffs honest; worth a small PR of their own.

---

## 7. Notes on verification

Three guards were added that read structure rather than render, because the bugs they cover are
invisible to a rendering test:

- `src/app/__tests__/parallel-route-interceptors.test.ts` — no parallel slot may hold two
  interceptors matching the same segment. Found the second occurrence of that bug.
- `src/styles/__tests__/colour-classes.test.ts` — every colour utility must name a colour the theme
  defines. Proven to fail against planted phantom classes.
- The proxy matcher-sync test now reads `src/proxy.ts` **by path**, so moving the gate back to a
  location Next does not load fails the suite.

Each asserts it matched something before asserting what it matched, so a broken parse cannot pass
vacuously — the failure mode recorded in the 2026-08-17 `boundaries` lesson.

Two lessons were added to `.claude/lessons.md` during the work: re-adding a path that `git mv` or
`git rm` already staged breaks the handover command, and **a test that passes before the fix is not
a regression test**. The second is the more important: it happened twice, and once (the `withAuth`
StrictMode deadlock) the race proved impossible to stage in jsdom at all. That fix is verified in
the browser only, and its test file says so.

## 8. Gate baseline

`dev` at the end of this work: `lint` 0 errors / 17 warnings, `lint:css` clean, `typecheck` clean,
`test:unit` 78 suites / 648 tests, `test:integration` 18 suites / 92 tests, `coverage` ~32.9%
statements with every folder goal met, `build` passing.

At the start it was 21 warnings, 71 suites / 593 tests, 17 / 80, and 30.88%.
