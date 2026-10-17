# F-02, F-10, F-11, F-16 — Decisions owed between the two repositories

Register rows [F-02, F-10, F-11 and F-16](register.md). Read at `f67716e`, the Notion page on
2026-10-13. These four are not code defects here, so this file is a note per item, not the eight
sections. The backend's side is its rows B-03, B-02, B-04 and B-15, in lakira-backend
`docs/internal/initiatives/backend-debt-register/analysis-decisions-owed-to-frontend.md` and
`analysis-analytics-relative-range.md`.

## F-02 — The frontend's origins are not chosen (B-03)

**Who owes what.** This side owes the backend its preview and production origins. The backend
owes a report of what staging's `CORS_ORIGIN` holds, and the per-environment setting afterwards.

**Why it is small here.** Almost every browser call goes server to server through `/api/proxy`,
so CORS matters only for a direct browser call. The Content Security Policy's `connect-src` holds
the API origin for that case.

**What unblocks it.** O-01. The origins follow from the host.

**Not verified.** Whether any code path calls the backend from the browser directly today. No
search for one was made for this kit.

## F-10 — A value logged today does not reach the dashboard (B-02)

**What a user sees.** For a metric that already has logs inside the requested range, a value
logged today is missing from the dashboard until the next day. The dashboard asks for a relative
range (`last`, default `30d`, `src/features/data-visualizations/state.ts:9` and
`dashboardFilters.ts:8`) and always sends `tz=Asia/Jakarta`
(`src/features/data-visualizations/viz-helpers.ts:10`).

**Whose defect.** The backend's. Its answer of 2026-10-13 on the Notion page says none of the
three behaviours is intended, and plans a fix with no change to request or response shapes.

**What this side can do meanwhile.** The backend's answer offers one: send an explicit `start`
and `end` through the present, which `viz-helpers.ts:20-21` already supports. That is O-04. It
would be removed again when the backend's fix ships, so it is a real cost for a temporary gain.

**After the backend's fix.** No code change is expected. Re-run the dashboard count assertions in
`cypress/e2e/stack/metric-to-dashboard.cy.ts`, and correct that spec's comment about why a value
logged today is counted.

**Not verified.** Nothing was reproduced for this kit; the figures are those on the Notion record,
taken on 2026-10-07 and 2026-10-08.

## F-11 — The production backend URL is undecided (B-04)

**Who owes what.** The backend, and behind it the owner, owes the URL. This side then sets
`API_URL` and `NEXT_PUBLIC_API_BASE_URL` for production and confirms `connect-src`.

**Where it shows here.** `docs/reference/environments.md:15` says the production backend URL is
not available, and two items of `2026-02-16-todo-cicd-overview.md` wait on it.

**What unblocks it.** The backend's hosting is decided (its ADR-0042, a VPS); the URL itself is
still `TBD` there. Closes with F-01's AC-3.

## F-16 — No shared pre-production smoke sequence (B-15)

**Who owes what.** The backend writes the sequence; this side links to it from
`docs/how-to/releases/release-checklist.md`.

**What unblocks it.** The backend's row B-15, which is `ready` on its register. Only needed once
there is a production environment to promote to.

**Closed 2026-10-17.** lakira-backend #171 wrote the sequence on 2026-10-16, and the release
checklist links it. The frontend's own half through `/api/proxy` is F-59.
