import type { InfiniteData } from "@tanstack/react-query";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { httpStatusFrom } from "@/services/api/http-status";

import { getMetricSettingsListViaCursor } from "../api";
import { metricSettingsKeys } from "../keys";
import { toMetricSettingsVM } from "../mappers";
import type {
  MetricSettingsCursorPageResponse,
  MetricSettingsFilterViaCursor,
  MetricSettingsSortViaCursor,
} from "../sort";
import type { MetricSettingsCursorPageVM } from "../view-models";
import { getNextCursor, makeInfiniteItemsSelect } from "@/src/utils/cursor/page-map";

type UseMetricSettingsArgs = {
  limit?: number;
  sort?: MetricSettingsSortViaCursor;
  filter?: MetricSettingsFilterViaCursor;
};

export function useMetricSettingsListCursorInfinite(
  opts: UseMetricSettingsArgs & { enabled: boolean },
) {
  const { limit = 20, sort = "-createdAt", filter, enabled = true } = opts;

  type TQueryFnData = MetricSettingsCursorPageResponse; // DTO from API
  type TPageParam = string | undefined; // cursor type
  type TData = InfiniteData<MetricSettingsCursorPageVM, TPageParam>; // ViewModel after mapping

  const query = useInfiniteQuery<
    TQueryFnData,
    Error,
    TData,
    ReturnType<typeof metricSettingsKeys.cursor.infinite>,
    TPageParam
  >({
    queryKey: metricSettingsKeys.cursor.infinite({ limit, sort, filter }),
    queryFn: ({ pageParam }) =>
      getMetricSettingsListViaCursor({
        limit,
        sort,
        filter,
        after: pageParam,
      }),

    initialPageParam: undefined as TPageParam,
    getNextPageParam: getNextCursor,
    select: makeInfiniteItemsSelect(toMetricSettingsVM),

    /**
     * Dev Note:
     * For infinite queries, don't need placeholderData to keep older pages.
     * While fetching the next page, TanStack already retains existing pages.
     * PlaceholderData can be removed to avoid mismatched shapes with `select`.
     */

    retry: (count, err) => {
      const status = httpStatusFrom(err);
      if (status && status < 500 && status !== 429) return false;
      return count < 2;
    },

    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,

    enabled: enabled,
  });

  const items = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data?.pages]);
  const hasNextPage = query.hasNextPage;
  const loadMore = () => query.fetchNextPage();

  return { ...query, items, hasNextPage, loadMore };
}
