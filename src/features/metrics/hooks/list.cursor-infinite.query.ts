import type { InfiniteData } from "@tanstack/react-query";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { httpStatusFrom } from "@/services/api/http-status";

import { metricsKeys } from "../keys";
import { toMetricPreviewVM } from "../mappers";
import { getMetricLibraryViaCursor } from "../metric.api";
import type { MetricCursorPage, MetricFilterViaCursor, MetricSortViaCursor } from "../sort";
import type { MetricCursorPageVM } from "../view-models";
import { getNextCursor, makeInfiniteItemsSelect } from "@/src/utils/cursor/page-map";

type UseMetricArgs = {
  limit?: number;
  sort?: MetricSortViaCursor;
  q?: string;
  filter?: MetricFilterViaCursor;
};

export function useMetricListInfiniteViaCursor(opts: UseMetricArgs & { enabled: boolean }) {
  const { limit = 20, sort = "-createdAt", q, filter, enabled = true } = opts;

  type TQueryFnData = MetricCursorPage; // DTO from API
  type TPageParam = string | undefined; // cursor type
  type TData = InfiniteData<MetricCursorPageVM, TPageParam>; // ViewModel after mapping

  const query = useInfiniteQuery<
    TQueryFnData,
    unknown, // keep transport-agnostic
    TData,
    ReturnType<typeof metricsKeys.cursor.infinite>,
    TPageParam
  >({
    queryKey: metricsKeys.cursor.infinite({ limit, sort, q, filter }),
    queryFn: ({ pageParam }) =>
      getMetricLibraryViaCursor({
        limit,
        sort,
        q,
        filter,
        after: pageParam, // cursor for next page
      }),

    initialPageParam: undefined as TPageParam,
    getNextPageParam: getNextCursor,
    select: makeInfiniteItemsSelect(toMetricPreviewVM),

    /**
     * Dev Note:
     * For infinite queries, don't need placeholderData to keep older pages.
     * While fetching the next page, TanStack already retains existing pages.
     * PlaceholderData can be removed to avoid mismatched shapes with `select`.
     */

    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,

    retry: (count, err) => {
      const status = httpStatusFrom(err);
      if (status && status < 500 && status !== 429) return false;
      return count < 2;
    },

    enabled: enabled,
  });

  const items = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data?.pages]);
  const hasNextPage = query.hasNextPage;
  const loadMore = () => query.fetchNextPage();

  return { ...query, items, hasNextPage, loadMore };
}
