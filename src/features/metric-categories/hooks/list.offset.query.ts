import { useMemo } from "react";

import type { MetricsListParams } from "@/features/metrics";
import { useMetricsListViaOffset } from "@/features/metrics/hooks";

// Dev Note: Currently not being used
type CategoryMetricsParams = Omit<MetricsListParams, "categoryId">;

export const useMetricCategoryListOffset = (
  categoryId: string | undefined,
  params: CategoryMetricsParams = {},
  opts?: { enabled?: boolean; staleTime?: number },
) => {
  const merged = useMemo(() => ({ ...params, categoryId }), [params, categoryId]);

  return useMetricsListViaOffset(merged, {
    enabled: (opts?.enabled ?? true) && !!categoryId,
    staleTime: opts?.staleTime,
  });
};
