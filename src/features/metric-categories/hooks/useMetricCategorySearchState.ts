"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import type { ListMode } from "@/hooks/useListMode";
import { useRouteSync } from "@/hooks/useRouteSync";
import type { QueryParams } from "@/lib/routes";
import { metricCategoryRoutes } from "@/lib/routes";

import type { MetricCategoryListSearchParams } from "../listSearchParams";
import {
  DEFAULT_CATEGORY_LIST_PARAMS,
  parseCategoryListSearchParams,
  serializeCategoryListSearchParams,
} from "../listSearchParams";

export const useMetricCategorySearchState = (
  initial: MetricCategoryListSearchParams = DEFAULT_CATEGORY_LIST_PARAMS,
) => {
  const [initialParams] = useState(initial);
  const searchParams = useSearchParams();

  const params = useMemo(() => {
    if (!searchParams) return initialParams;
    return parseCategoryListSearchParams(searchParams, initialParams);
  }, [initialParams, searchParams]);

  const listHrefBuilder = useCallback((query: QueryParams) => metricCategoryRoutes.list(query), []);
  const syncCategoryList = useRouteSync<MetricCategoryListSearchParams>({
    serialize: serializeCategoryListSearchParams,
    buildHref: listHrefBuilder,
  });

  const replaceParams = useCallback(
    (next: MetricCategoryListSearchParams) => {
      syncCategoryList(next, { scroll: false });
    },
    [syncCategoryList],
  );

  const setMode = useCallback(
    (mode: ListMode) => {
      replaceParams({ ...params, mode });
    },
    [params, replaceParams],
  );

  return { params, replaceParams, mode: params.mode, setMode };
};
