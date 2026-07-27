"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { useRouteSync } from "@/hooks/useRouteSync";
import type { QueryParams } from "@/lib/routes";
import { metricRoutes } from "@/lib/routes";

import type { MetricLogListSearchParams } from "./listSearchParams";
import {
  DEFAULT_METRIC_LOG_LIST_PARAMS,
  parseMetricLogSearchParams,
  serializeMetricLogSearchParams,
} from "./listSearchParams";

export const useMetricLogSearchState = (
  metricId: string,
  initial: MetricLogListSearchParams = DEFAULT_METRIC_LOG_LIST_PARAMS,
) => {
  const [initialParams] = useState(initial);
  const searchParams = useSearchParams();

  const params = useMemo(() => {
    if (!searchParams) return initialParams;
    return parseMetricLogSearchParams(searchParams, initialParams);
  }, [initialParams, searchParams]);

  const logsHrefBuilder = useCallback(
    (query: QueryParams) => metricRoutes.logs(metricId, query),
    [metricId],
  );

  const syncLogParams = useRouteSync<MetricLogListSearchParams>({
    serialize: serializeMetricLogSearchParams,
    buildHref: logsHrefBuilder,
  });

  const replaceParams = useCallback(
    (next: MetricLogListSearchParams) => {
      syncLogParams(next, { scroll: false });
    },
    [syncLogParams],
  );

  return { params, replaceParams };
};
