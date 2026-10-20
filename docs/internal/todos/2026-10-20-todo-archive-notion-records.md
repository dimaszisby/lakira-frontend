# 2026-10-20 - Todo: archive the finished records on "FE and BE messages"

**Context:** debt register row F-52 said three Part 1 records on the Notion page "FE and BE
messages" waited to be archived, two of them on the backend. By 2026-10-20 the row was stale: the
backend had closed both (B-14 in backend #169, B-66 in backend #191), and the third, the
relative-range record, had been archived on 2026-10-16. The page also held five more records whose
frontend side was finished, and one Part 2 record with no register row. The owner chose to clear
both parts in one pass.

Each archive followed the page's own "How to archive" callout. The record was copied verbatim to
the top of its archive page with an `**Archived:**` line under Completion Date, its Index row was
added there, and then the record and its row were deleted from the live page. Every delete matched
the live text exactly, which is what shows the copy is verbatim. Both pages were then re-read.

## Checklist

Part 1, to "FE to BE: archive":

- [x] `@sentry/node` 11 collects request data by default: acknowledged (no frontend change; the
      frontend's own `dataCollection` block at `src/lib/monitoring/server.ts:39` is unchanged), then
      archived.
- [x] The frontend proxy no longer forwards a browser's `x-request-id`: archived. Shipped as B-14 in
      backend #169; nothing left on either side.
- [x] Pre-production smoke-check sequence: archived on its acknowledgement of 2026-10-17 (#105). The
      frontend's own half stays open as register row F-59.
- [x] The category list answers a repeated query with a 500: acknowledged for #121 (`fece23f`, F-57),
      then archived.

Part 2, to "BE to FE: archive":

- [x] A dashboard bucket that averages 0 now reads 0: acknowledged with no code change, then
      archived. `seriesToXY` (`src/features/data-visualizations/viz-helpers.ts:42-47`) draws only a
      `null` value as a gap.
- [x] `Retry-After` in the spec; the local image reports its commit: acknowledged, then set to
      Completed in the record and the Index, then archived.
  - Step 1 was #119 (`8eb99e4`): `RetryAfter` is in `src/types/api/generated/lakira-backend.d.ts`.
  - Step 2 was #120 (`cfd82a9`): `cypress/support/backend-image.ts` compares `release` by commit.
- [x] Set-Cookie and the analytics 304: already acknowledged (#97). Set to Completed in the record
      and the Index, then archived.

Left on the page:

- [x] The invite email record (Part 2, Needs decision) gets a line naming F-65 and O-14. The choice
      of remedy is the owner's.
- [x] Production backend URL, CORS (Part 1) and client IP (Part 2) are untouched; they wait on O-01.

Register:

- [x] F-52 closed.
- [x] F-65 filed in tier 5 as P3, waiting on the owner (O-14).
- [x] O-14 added to the owner's questions.
- [x] "As of" moved to `ecf6095`.
- [x] README: the closed count and the tier 5 sentence.
- [x] Gates

## Status

Done 2026-10-20 on `docs/archive-notion-records`. The live page holds four records, each waiting on
a decision: production backend URL, CORS, invite email and client IP. Both archive pages were
re-read after the edits; each record is there in full, with its Index row.
