# Metric name duplicate check

**Purpose:** ticket D — MetricForm's duplicate-name check always returns 400.
**Owner:** hardini
**Branch:** `fix/metric-name-duplicate-check` off `dev`

## What was wrong

`MetricForm` debounced the name field into `useMetricsListViaOffset`, which called
`getMetricLibraryList` with `page`, `limit`, `sortBy`, `sortOrder` and `name`.

`GET /metrics` moved to cursor pagination. Its router validates with
`getAllMetricsViaCursorSchema`, built on a `.strict()` object accepting only `limit`, `sort`, `q`,
`after`, `includeTotal` and `filter[...]` — so four of the five keys are refused:

```
Unrecognized key(s) in object: 'name', 'page', 'sortBy', 'sortOrder'
```

The offset schema `getAllMetricsSchema` is registered on no route at all. The check therefore 400'd
on every keystroke, found nothing, and **let conflicting names through** — failing open, which is
the worst direction for a uniqueness check.

Confirmed against the running backend rather than inferred:

| Request | Status |
| --- | --- |
| `page=1&limit=1&sortBy=createdAt&sortOrder=DESC&name=Sleep` | **400** |
| `limit=10&sort=-createdAt&filter[name]=Sleep` | **200**, returns `["Sleep"]` |

## The fix

- [x] `useMetricNameLookup` (`hooks/name-lookup.query.ts`) queries the cursor endpoint with
      `filter[name]`, under its own cache key so a keystroke-driven lookup cannot evict the list the
      user is looking at.
- [x] `MetricForm` uses it. The exact, case-insensitive comparison stays in the form, which also
      excludes the metric being edited.
- [x] **Asks for 10 candidates, not 1.** `filter[name]` is a `LIKE` on the server
      (`MetricReadRepoSequelize`: `and.push({ name: like(filter.name) })`). The old code's `limit: 1`
      could return "Sleep Quality" while an exact "Sleep" existed, so it would have been wrong even
      against a working endpoint.

## Dead code removed

The offset path existed solely for this check and could only ever 400:

- [x] `getMetricLibraryList`, `hooks/list.offset.query.ts`, and `metricsKeys.list` / `normalizeList`
- [x] `metric-categories/hooks/list.offset.query.ts` — a wrapper around the same call, already
      marked "Currently not being used"

`metricsKeys.lists` and `metricsKeys.all` stay: `invalidateMetricLists` and the tenant-scoping test
use them.

## The test was mocking the broken contract

This is why the bug survived. `mockDuplicateMetricLookup` read `?name=` and answered
`{ metrics: [...] }` — the offset shape. A mock that answers a request the server refuses keeps a
broken feature green indefinitely.

- [x] Rewritten to the cursor contract: reads `filter[name]`, returns `{ items, sort, limit }`, and
      matches on substring so it behaves like the server's `LIKE`.
- [x] New test asserts the **request**, not just the outcome: `filter[name]` is set, none of
      `name` / `page` / `sortBy` / `sortOrder` is present, and `limit > 1`.

## Verification

| Gate | Result |
| --- | --- |
| `lint` | 0 errors, 17 warnings (`dev` baseline 21) |
| `lint:css` | clean |
| `typecheck` | clean |
| `test:unit` | 77 suites, 646 tests |
| `test:integration` | 18 suites, 92 tests (was 91) |
| `coverage:check --strict` | all goals met |
| `build` | passes |

Plus the live request comparison above.

## Status

**Complete.** One caveat on evidence: the new request-shape test was not demonstrated failing
against the old code, because restoring the old hook alone breaks compilation (it references a cache
key this change removes). The live 400-vs-200 comparison is the substitute, and it is stronger — it
exercises the real backend rather than a mock.

Typing into the form in the browser to watch the inline error appear was not achieved either: the
Ariakit dialog manages focus and the synthetic key events did not reach the controlled input. The
form behaviour is covered by the integration suite instead.
