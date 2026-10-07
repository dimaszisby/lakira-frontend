import type { QueryClient } from "@tanstack/react-query";

import { vizKeys } from "./keys";

const VIZ_KEY_ROOT = "viz";

/**
 * Invalidate one metric's visualizations, within one organization.
 *
 * This matches **by position**, so it is coupled to the shape of `vizKeys`.
 * The organization id sits at index 1, which shifted `"metric"` and the metric
 * id to 2 and 3. Get the offsets wrong and this silently matches nothing —
 * stale charts, no error. `keys.ts` and this predicate change together.
 */
export const invalidateMetricVisualization = async (
  qc: QueryClient,
  organizationId: string,
  metricId: string,
) => {
  await qc.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey;
      if (!Array.isArray(key)) return false;
      if (key.length < 4) return false;
      return (
        key[0] === VIZ_KEY_ROOT &&
        key[1] === organizationId &&
        key[2] === "metric" &&
        key[3] === metricId
      );
    },
  });
};

/**
 * Invalidate every dashboard visualization query of one organization, whatever
 * its range, bucket or limit.
 *
 * Until 2026-10-07 nothing did, so a dashboard that was mounted, or restored
 * by back/forward navigation, kept its old charts for up to a minute.
 *
 * Call it from every mutation that writes a field of the dashboard payload.
 * That is wider than it sounds: a metric's settings decide whether it appears
 * at all, and each item carries its category's name and colour. Fifteen
 * mutations call it today, each pinned by a `dashboard-invalidation` test.
 *
 * This matches by **key prefix**, so it is coupled to `vizKeys.dashboard`
 * starting with the organization's root followed by `"dashboard"`.
 */
export const invalidateDashboardVisualizations = async (
  qc: QueryClient,
  organizationId: string,
) => {
  await qc.invalidateQueries({ queryKey: [...vizKeys.all(organizationId), "dashboard"] });
};
