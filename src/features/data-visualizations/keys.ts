import type { VizQuery } from "./types";

const normalize = (q: VizQuery) =>
  "last" in q
    ? {
        last: q.last,
        bucket: q.bucket,
        tz: q.tz ?? "Asia/Jakarta",
        fill: q.fill ?? "none",
      }
    : {
        start: q.start,
        end: q.end,
        bucket: q.bucket,
        tz: q.tz ?? "Asia/Jakarta",
        fill: q.fill ?? "none",
      };

/**
 * Cache keys for visualization data.
 *
 * Every key carries the organization id at index 1, immediately after the
 * resource root. Without it, a user who belongs to two organizations would be
 * served one org's cached payload while acting as the other — the defect
 * `lakira-backend` shipped and patched as findings N1/N2.
 *
 * Index 1 rather than 0 so `key[0]` keeps naming the resource, which
 * `cache.ts` relies on when matching by position.
 */
export const vizKeys = {
  all: (organizationId: string) => ["viz", organizationId] as const,

  byMetric: (organizationId: string, metricId: string, q: VizQuery) =>
    [...vizKeys.all(organizationId), "metric", metricId, normalize(q)] as const,

  dashboard: (organizationId: string, q: VizQuery & { limit?: number }) =>
    [...vizKeys.all(organizationId), "dashboard", normalize(q), q.limit ?? 24] as const,
};
