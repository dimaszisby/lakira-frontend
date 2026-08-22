# Dashboard Access Failures – searchParams & Cookie Propagation

- **Date detected:** 2025-11-30
- **Reporter:** dimaspramudya
- **Owner:** Codex assist
- **Related routes:** `/login`, `/register`, `/dashboard`
- **Related docs:** `docs/internal/initiatives/routing/next-router-plan.md`, `docs/internal/todos/todo-router-20251130.md`

---

## 1. Summary

Initial testing of the revamped App Router setup exposed two blockers when loading the dashboard:

1. **`searchParams` Promise misuse** on `/login`, `/register`, and `/dashboard` created runtime errors such as `Route "/dashboard" used searchParams.bucket`.
2. **Missing cookies during server-side prefetch** caused the dashboard’s visualization query to hit `/api/proxy/analytics/dashboard` without the `lakira_token`, resulting in `401 Unauthorized` responses during SSR hydration.

Both issues prevented the dashboard from loading immediately after authentication.

---

## 2. Impact

- **Users:** Any authenticated session hitting `/dashboard` while Turbopack renders pages server-side.
- **Severity:** High (dashboard unusable until client-side retries, multiple console errors, plus auth redirects blocked when already signed in).
- **Frequency:** Deterministic on first render; occurred on every boot after applying the router plan.

---

## 3. Timeline

| Time (local) | Event                                                                                                                        |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| 09:00        | Ran `npm run dev` after executing router plan docs; dev server compiled successfully.                                        |
| 09:02        | Navigated to `/login`; Next.js threw `searchParams` Promise error, but page still rendered due to fallback behavior.         |
| 09:04        | Navigated to `/dashboard`; SSR threw `searchParams` Promise error and dashboard API prefetch failed with `401 Unauthorized`. |
| 09:06        | Confirmed browser console logs: `[API ERROR] fetchedDashbordAnalytics: Request failed with status code 401`.                 |
| 09:10        | Root cause analysis (see section 4).                                                                                         |
| 09:25        | Implemented fixes (see section 5) and verified `/login` → `/dashboard` flow.                                                 |

---

## 4. Root Causes

### 4.1 Next.js 16 `searchParams` contract change

- **What changed:** Next 16’s App Router now provides `searchParams` as a `Promise<Record<string, string | string[]>>` to permit streaming/Flight.
- **Code path:** `src/app/(auth)/login/page.tsx` and `src/app/(app)/dashboard/page.tsx` treated `searchParams` synchronously.
- **Failure:** Accessing `searchParams.bucket` (or `.returnUrl`) before awaiting triggered the runtime guard: “Route used `searchParams.bucket`. `searchParams` is a Promise…”.

### 4.2 Server-prefetch lacks auth cookies

- **Data flow:** Dashboard page prefetches visualizations server-side using `getDashboardVisualizations`. Axios client’s `baseURL` points to `/api/proxy`, which requires `lakira_token` to forward the upstream `Authorization`.
- **Missed invariant:** Server components do not automatically include the incoming request’s cookies in outbound fetch/axios calls.
- **Failure:** Prefetch call executed without `Cookie` header, proxy returned `401 Unauthorized`, TanStack query rejected, leading to noisy console errors and empty charts until client-side retry (which _did_ send cookies because the browser owns them).

---

## 5. Fix

1. **Await `searchParams`** in server components:
   - `src/app/(auth)/login/page.tsx` and `src/app/(auth)/register/page.tsx` now accept `searchParams?: Promise<...>` and resolve them before using `returnUrl`.
   - `src/app/(app)/dashboard/page.tsx` performs the same `await` before parsing filters.
2. **Forward cookies during server prefetch:**
   - Read cookies via `cookies().getAll()` and concatenate into a `Cookie` header.
   - Pass `{ headers: { Cookie: … } }` to `getDashboardVisualizations`.
   - Updated `src/features/data-visualizations/api.ts` to accept optional `headers/signal` so server callers can inject auth context while hooks still pass abort signals.

---

## 6. Verification

- Reloaded `/login`: no `searchParams` error; already-authenticated users redirect cleanly via `authRoutes.afterAuth`.
- Reloaded `/dashboard`: server render succeeds, hydration contains prefetched viz data, no 401s logged.
- Confirmed client hook (`useDashboardVisualizations`) still passes `AbortSignal` thanks to updated API signature.

---

## 7. Follow-ups / Prevention

1. **Coding guideline:** Treat Next App Router `searchParams` as async everywhere; add lint rule or shared helper to unwrap them.
2. **Server data fetching helper:** Introduce a utility to build axios headers from `cookies()` automatically, ensuring parity across future server-prefetch sites (metrics, categories, etc.).
3. **Monitoring:** Consider lightweight log/metric for proxy 401s to catch missing tokens earlier.

---

## 8. References

- Error logs from Turbopack console (Nov 30, 2025) – stored in the terminal output snippet accompanying this doc.
- `src/app/(app)/dashboard/page.tsx`, `src/app/(auth)/login/page.tsx`, `src/features/data-visualizations/api.ts`.
