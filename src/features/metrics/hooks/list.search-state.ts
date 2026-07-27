"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { useRouteSync } from "@/hooks/useRouteSync";
import type { QueryParams } from "@/lib/routes";
import { metricRoutes } from "@/lib/routes";

import type { MetricListSearchParams } from "../listSearchParams";
import { parseMetricListSearchParams, serializeMetricListParams } from "../listSearchParams";

export const useMetricListSearchState = (initial: MetricListSearchParams) => {
  const [initialParams] = useState(initial);
  const searchParams = useSearchParams();

  const params = useMemo(() => {
    if (!searchParams) return initialParams;
    return parseMetricListSearchParams(searchParams, initialParams);
  }, [initialParams, searchParams]);

  const buildListHref = useCallback((query: QueryParams) => metricRoutes.list(query), []);
  const syncListParams = useRouteSync<MetricListSearchParams>({
    serialize: serializeMetricListParams,
    buildHref: buildListHref,
  });

  const replaceParams = useCallback(
    (next: MetricListSearchParams) => {
      syncListParams(next, { scroll: false });
    },
    [syncListParams],
  );

  return { params, replaceParams };
};
