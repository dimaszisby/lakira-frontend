"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { useRouteSync } from "@/hooks/useRouteSync";
import type { QueryParams } from "@/lib/routes";
import { metricCategoryRoutes } from "@/lib/routes";

import type { MetricListSearchParams } from "../listSearchParams";
import {
  DEFAULT_METRIC_LIST_PARAMS,
  parseMetricListSearchParams,
  serializeMetricListParams,
} from "../listSearchParams";

export const useCategoryMetricSearchState = (
  categoryId: string,
  initial: MetricListSearchParams = DEFAULT_METRIC_LIST_PARAMS,
) => {
  const [initialParams] = useState<MetricListSearchParams>(initial);
  const searchParams = useSearchParams();
  const returnParams = searchParams?.get("returnParams") ?? undefined;

  const params = useMemo(() => {
    if (!searchParams) return initialParams;
    return parseMetricListSearchParams(searchParams, initialParams);
  }, [initialParams, searchParams]);

  const detailHrefBuilder = useCallback(
    (query: QueryParams) => {
      const finalQuery = returnParams ? { ...query, returnParams } : query;
      return metricCategoryRoutes.detail(categoryId, finalQuery);
    },
    [categoryId, returnParams],
  );

  const syncCategoryMetrics = useRouteSync<MetricListSearchParams>({
    serialize: serializeMetricListParams,
    buildHref: detailHrefBuilder,
  });

  const replaceParams = useCallback(
    (next: MetricListSearchParams) => {
      syncCategoryMetrics(next, { scroll: false });
    },
    [syncCategoryMetrics],
  );

  return { params, replaceParams };
};
