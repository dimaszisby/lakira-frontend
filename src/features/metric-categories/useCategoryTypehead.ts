import type { InfiniteData } from "@tanstack/react-query";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useDebounce } from "react-use";

import type { MetricCategoryResponseDTO } from "@/src/types/dtos/metric-category.dto";

import { listMetricCategories } from "./api";
import { metricCategoriesKeys } from "./keys";
import type { MetricCategoryCursorPage } from "./sort";

export type CategoryOption = {
  value: string;
  label: string;
  color: string;
  icon: string;
  metricCount: number;
};

const toOption = (c: MetricCategoryResponseDTO): CategoryOption => ({
  value: c.id,
  label: c.name,
  color: c.color,
  icon: c.icon,
  metricCount: c.metricCount ?? 0,
});

export function useCategoryTypeahead(rawQuery: string, limit = 15) {
  const [q, setQ] = useState<string>(rawQuery.trim());
  useDebounce(() => setQ(rawQuery.trim()), 250, [rawQuery]);

  const query = useInfiniteQuery<
    MetricCategoryCursorPage, // TQueryFnData (server response page)
    Error, // TError
    InfiniteData<MetricCategoryCursorPage, string | undefined>, // TData
    ReturnType<typeof metricCategoriesKeys.cursor.infinite>, // TQueryKey
    string | undefined // TPageParam
  >({
    queryKey: metricCategoriesKeys.cursor.infinite({
      limit,
      sort: "-metricCount", // sorted from the most used
      q: q || undefined,
      filter: undefined,
    }),
    queryFn: ({ pageParam }) =>
      listMetricCategories({
        limit,
        sort: "-metricCount",
        q: q || undefined,
        after: pageParam,
      }),
    initialPageParam: undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const options = useMemo(
    () => query.data?.pages.flatMap((p) => p.items).map(toOption) ?? [],
    [query.data],
  );

  return {
    q,
    options,
    hasNextPage: query.hasNextPage,
    isFetching: query.isFetching,
    isLoading: query.isLoading,
    isError: query.isError,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
}
