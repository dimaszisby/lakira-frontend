import type { QueryClient } from "@tanstack/react-query";


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
