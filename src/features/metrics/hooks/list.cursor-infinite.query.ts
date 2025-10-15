import type { InfiniteData } from "@tanstack/react-query";
import { useInfiniteQuery } from "@tanstack/react-query";

import { metricsKeys } from "../keys";
import { toMetricPreviewVM } from "../mappers";
import { getMetricLibraryViaCursor } from "../metric.api";
import type { MetricCursorPage, MetricFilterViaCursor, MetricSortViaCursor } from "../sort";
import type { MetricCursorPageVM } from "../view-models";

type UseMetricArgs = {
  limit?: number;
  sort?: MetricSortViaCursor;
  q?: string;
  filter?: MetricFilterViaCursor;
};

export function useMetricListInfiniteViaCursor(opts: UseMetricArgs & { enabled: boolean }) {
  const { limit = 20, sort = "-createdAt", q, filter, enabled = true } = opts;

  const query = useInfiniteQuery<
    MetricCursorPage, // TQueryFnData
    Error, // TError
    InfiniteData<MetricCursorPageVM, string | undefined>, // TData (no select -> keep InfiniteData)
    ReturnType<typeof metricsKeys.cursor.infinite>, // TQueryKey
    string | undefined // TPageParam
  >({
    queryKey: metricsKeys.cursor.infinite({ limit, sort, q, filter }),
    queryFn: ({ pageParam }) =>
      getMetricLibraryViaCursor({
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
        items: p.items.map(toMetricPreviewVM),
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
}
