import type { InfiniteData } from "@tanstack/react-query";
import { useInfiniteQuery } from "@tanstack/react-query";

import { useOrganizationId } from "@/features/organizations/context";

import { getMetricLogsListViaCursor } from "../api";
import { metricLogsKeys } from "../keys";
import { toMetricLogVM } from "../mappers";
import type { MetricLogCursorPageResponse, MetricLogFilter, MetricLogSortParam } from "../sort";
import { DEFAULT_METRIC_LOG_SORT } from "../sort";
import type { MetricLogCursorPageVM } from "../view-models";

type UseMetricLogArgs = {
  limit?: number;
  sort?: MetricLogSortParam;
  q?: string;
  filter?: MetricLogFilter;
};

export function useMetricLogListCursorInfinite(opts: UseMetricLogArgs & { enabled: boolean }) {
  const organizationId = useOrganizationId();
  const { limit = 20, sort = DEFAULT_METRIC_LOG_SORT, q, filter, enabled = true } = opts;

  const query = useInfiniteQuery<
    MetricLogCursorPageResponse, // TQueryFnData
    Error, // TError
    InfiniteData<MetricLogCursorPageVM, string | undefined>, // TData (no select -> keep InfiniteData)
    ReturnType<typeof metricLogsKeys.cursor.infinite>, // TQueryKey
    string | undefined // TPageParam
  >({
    queryKey: metricLogsKeys.cursor.infinite(organizationId, { limit, sort, q, filter }),
    queryFn: ({ pageParam }) =>
      getMetricLogsListViaCursor({
        limit,
        sort,
        q,
        filter,
        after: pageParam, // pageParam is TParam here
      }),

    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,

    select: (data) => ({
      pageParams: data.pageParams,
      pages: data.pages.map((p) => ({
        ...p,
        items: p.items.map(toMetricLogVM),
      })),
    }),

    // Keep previous pages visible while fetching the next one
    placeholderData: (prev) => prev,

    enabled: enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  const hasNextPage = query.hasNextPage;
  const loadMore = () => query.fetchNextPage();

  return { ...query, items, hasNextPage, loadMore };
}
