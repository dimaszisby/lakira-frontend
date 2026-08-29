import type { InfiniteData } from "@tanstack/react-query";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useOrganizationId } from "@/features/organizations/context";
import { httpStatusFrom } from "@/services/api/http-status";
import { getNextCursor, makeInfiniteItemsSelect } from "@/utils/cursor/page-map";

import { getMetricSettingsListViaCursor } from "../api";
import { metricSettingsKeys } from "../keys";
import { toMetricSettingsVM } from "../mappers";
import type {
  MetricSettingsCursorPageResponse,
  MetricSettingsFilter,
  MetricSettingsSortParam,
} from "../sort";
import { DEFAULT_METRIC_SETTINGS_SORT } from "../sort";
import type { MetricSettingsCursorPageVM } from "../view-models";

type UseMetricSettingsArgs = {
  limit?: number;
  sort?: MetricSettingsSortParam;
  filter?: MetricSettingsFilter;
};

export function useMetricSettingsListCursorInfinite(
  opts: UseMetricSettingsArgs & { enabled: boolean },
) {
  const organizationId = useOrganizationId();
  const { limit = 20, sort = DEFAULT_METRIC_SETTINGS_SORT, filter, enabled = true } = opts;

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
    queryKey: metricSettingsKeys.cursor.infinite(organizationId, { limit, sort, filter }),
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
