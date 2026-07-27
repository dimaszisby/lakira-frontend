import type { QueryClient } from "@tanstack/react-query";

import { vizKeys } from "./keys";

const VIZ_KEY_ROOT = vizKeys.all[0];

export const invalidateMetricVisualization = async (qc: QueryClient, metricId: string) => {
  await qc.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey;
      if (!Array.isArray(key)) return false;
      if (key.length < 3) return false;
      return key[0] === VIZ_KEY_ROOT && key[1] === "metric" && key[2] === metricId;
    },
  });
};
