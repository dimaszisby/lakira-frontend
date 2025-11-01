import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

import { useCursorPager } from "@/lib/cursor/useCursorPager";
import { httpStatusFrom } from "@/services/api/http-status";
import { computeTotalPages, makePageItemsSelect } from "@/utils/cursor/page-map";

import { getMetricSettingsListViaCursor } from "../api";
import { metricSettingsKeys } from "../keys";
import { toMetricSettingsVM } from "../mappers";
import type {
  MetricSettingsCursorPageResponse,
  MetricSettingsFilter,
  MetricSettingsSortParam,
} from "../sort";
import type { MetricSettingsCursorPageVM } from "../view-models";

type MetricSettingsCursorPageDTO = MetricSettingsCursorPageResponse;

export function useMetricSettingsListCursorPage(params: {
  limit: number;
  sort: MetricSettingsSortParam;
  filter?: MetricSettingsFilter;
  enabled: boolean;
}) {
  const { limit, sort, filter, enabled = true } = params;

  // Reset dependencies for pager when query params change
  const resetDeps = useMemo(
    () => [limit, sort, filter?.metricId ?? ""],
    [limit, sort, filter?.metricId],
  );

  // Centralized page/cursor management
  const pager = useCursorPager(resetDeps);
  const { page, after, setPage, updateNextCursor, canPrev, canNextUsing } = pager;

  const query = useQuery<MetricSettingsCursorPageDTO, unknown, MetricSettingsCursorPageVM>({
    queryKey: metricSettingsKeys.cursor.pages({
      limit,
      sort,
      filter,
      page,
      includeTotal: true,
    }),
    queryFn: async () =>
      await getMetricSettingsListViaCursor({
        limit,
        sort,
        filter,
        after,
        includeTotal: true,
      }),

    select: makePageItemsSelect(toMetricSettingsVM),
    placeholderData: keepPreviousData,
    staleTime: 30_000,

    retry: (count, err) => {
      const status = httpStatusFrom(err);
      if (status && status < 500 && status !== 429) return false;
      return count < 2;
    },

    enabled: enabled,
  });

  useEffect(() => {
    updateNextCursor(query.data?.nextCursor ?? null);
  }, [page, query.data?.nextCursor, updateNextCursor]);

  const items = useMemo(() => query.data?.items ?? [], [query.data?.items]);
  const totalCount = query.data?.totalCount;
  const totalPages = computeTotalPages(totalCount, limit);

  // navigation helpers (works even if total unknown)
  const canNext = canNextUsing(query.data?.nextCursor);

  return {
    items,
    page,
    setPage,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    totalCount,
    totalPages,
    canPrev,
    canNext,
  };
}
