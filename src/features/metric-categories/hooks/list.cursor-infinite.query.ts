import type { InfiniteData } from "@tanstack/react-query";
import { useInfiniteQuery } from "@tanstack/react-query";

import { listMetricCategories } from "../api";
import { metricCategoriesKeys } from "../keys";
import { toVM } from "../mappers";
import type { MetricCategoryCursorPage, MetricCategoryFilter, MetricCategorySort } from "../sort";
import type { MetricCategoryCursorPageVM } from "../view-models";

// Infinite Mobile
type UseMetricCategoriesArgs = {
  limit?: number;
  sort?: MetricCategorySort;
  q?: string;
  filter?: MetricCategoryFilter;
};

export const useMetricCategoryListCursorInfinite = (
  opts: UseMetricCategoriesArgs & { enabled: boolean },
) => {
  const { limit = 20, sort = "-createdAt", q, filter, enabled = true } = opts;

  const query = useInfiniteQuery<
    MetricCategoryCursorPage, // TQueryFnData
    Error, // TError
    InfiniteData<MetricCategoryCursorPageVM, string | undefined>, // TData (no select -> keep InfiniteData)
    ReturnType<typeof metricCategoriesKeys.cursor.infinite>, // TQueryKey
    string | undefined // TPageParam
  >({
    queryKey: metricCategoriesKeys.cursor.infinite({ limit, sort, q, filter }),
    queryFn: ({ pageParam }) =>
      listMetricCategories({
        limit,
        sort,
        q,
        filter,
        after: pageParam,
      }),

    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,

    select: (data) => ({
      pageParams: data.pageParams,
      pages: data.pages.map((p) => ({
        ...p,
        items: p.items.map(toVM),
      })),
    }),

    // Keep previous pages visible while fetching the next one
    placeholderData: (prev) => prev,

    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    enabled: enabled,
  });

  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  const hasNextPage = query.hasNextPage;
  const loadMore = () => query.fetchNextPage();

  return { ...query, items, hasNextPage, loadMore };
};
