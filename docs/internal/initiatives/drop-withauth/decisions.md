# Drop withAuth — decisions

## D-01 — Delete the client-side auth guard rather than invert it

- **Status:** Accepted
- **Date:** 2026-09-22

**Context.** `withAuth` was on the four-file layer-rule quarantine list in `eslint.config.mjs`,
tracked since 2026-08-17 as an inversion to be refactored. `/account` was its only consumer. Reading
it against what already runs on that route showed all three of its jobs were duplicates:

| `withAuth` did                          | Already done by                                                                                                                     |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Redirect unauthenticated users          | `src/proxy.ts` (edge gate, validates the token's `exp`, carries `returnUrl`) and `(app)/layout.tsx` (server redirect before render) |
| Fill `userAtom` from `fetchUserProfile` | `useAuthProfileQuery`, which `/account/page.tsx` already calls                                                                      |
| Seed the query cache                    | `useAuthProfileQuery`, under `authKeys.profile()`                                                                                   |

The third was not merely duplicated, it was **broken**: `withAuth` wrote to a hand-written
`["userProfile"]` key while the feature module uses `authKeys.profile()` → `["auth", "profile"]`.
Nothing read `["userProfile"]` except `withAuth` itself and the equally dead `src/hooks/useAuth.ts`.
It had been maintaining a cache entry that fed nothing, which is the failure
`.claude/rules/data-access.md` § TanStack Query warns about when it says keys come from `keys.ts`.

**Decision.** Delete `withAuth.tsx`, its test, and its single usage. Delete `HydrateUser.tsx`
(referenced nowhere) and `src/hooks/useAuth.ts` (unreferenced, and importing `useRouter` from
`next/router`, a Pages Router API this app does not provide — it would have thrown if called).
The quarantine list goes from four files to two.

**Options considered.**

- _Invert it, as the 2026-08-17 todo planned._ That was the right plan when the list was written and
  the assumption was that each entry did necessary work in the wrong place. It does not survive
  contact with the finding that this entry did no necessary work at all. Inverting a component whose
  only consumer does not need it produces a correctly-layered component nobody calls.
- _Keep the HOC, unused, for a future route that needs a client guard._ Rejected: it would leave a
  duplicate-fetch pattern in the tree for new code to copy, and the broken cache key with it. A
  future client guard should be written against `authKeys`, not resurrected from this.
- _Remove only the `/account` usage._ Smallest diff, but leaves two dead files on the quarantine
  list and the debt register overstating itself.

**Consequences.**

- `/account` makes **one fewer `/auth/profile` request** per visit and no longer blocks behind a
  `FullScreenSpinner` before its own loading state.
- The layer-rule quarantine is `Header.tsx` and `Sidebar.tsx` — both genuine inversions that do need
  inverting. The register now contains only real debt.
- The deleted test covered `withAuth`'s StrictMode effect ordering, a bug `.claude/lessons.md`
  records at length. Those four cases describe behaviour that no longer exists, so the test goes
  with the code. **The lesson stays in `lessons.md`**, where it is about effect ordering under
  StrictMode generally rather than about this HOC.

## D-02 — A failed profile shows a recovery card instead of redirecting

- **Status:** Accepted
- **Date:** 2026-09-22

**Context.** The one behaviour `withAuth` had that nothing else replicates: when
`fetchUserProfile` returned nothing, it called `router.replace("/login")`. Removing the HOC removes
that redirect, so this is a deliberate change rather than an oversight.

**Decision.** Let the page's existing `!data` branch handle it — the "We were unable to load your
profile information" card with a Try again button.

**Options considered.**

- _Reproduce the redirect in the page._ Rejected on the merits, not just on cost. A failed profile
  is not proof the session is dead: `fetchUserProfile` deliberately swallows its error and returns
  `null` (`.claude/rules/data-access.md` records this), so "no profile" and "could not load it" are
  indistinguishable at that point. Redirecting to `/login` on a transient network failure logs out a
  user whose session is fine, and `/login` would bounce them straight back.

**Consequences.**

- A genuinely dead session still reaches `/login`, one navigation later and by the right mechanism:
  the proxy clears both cookies on a 401 that refresh cannot rescue, and `src/proxy.ts` then
  redirects with a `returnUrl`. That path carries the return destination; `withAuth`'s
  `router.replace("/login")` did not.
- **Security note.** A small sweep owes no plan and so has no _Security and data_ section; this is
  where that reasoning lives. Removing a gate warrants stating plainly what remains: `/account` is
  in `PROTECTED_APP_PATHS`, so `src/proxy.ts` gates it at the edge **before the page renders**, and
  `(app)/layout.tsx` redirects server-side as well. `withAuth` ran third, in the client, after both
  — the weakest of the three and the only one an attacker could skip by disabling JavaScript. The
  change removes the least load-bearing layer, not the load-bearing one.
- Pinned by `AccountPage.int.test.tsx`, which asserts the card rather than a redirect. That suite is
  also the first test `/account` has ever had.
