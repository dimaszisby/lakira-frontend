import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  InfiniteData,
  useQueryClient,
  QueryKey,
} from "@tanstack/react-query";
import {
  MetricLogResponseDTO,
  PaginatedMetricLogListResponseDTO,
  UpdateMetricLogRequestDTO,
} from "@/src/types/dtos/metric-log.dto";
import {
  getMetricLogs,
  createMetricLog,
  createMetricLogDummy,
  deleteMetricLog,
  updateMetricLog,
  getMetricLogsListViaCursor,
} from "@/src/features/metricLogs/api";
import { MetricLogFilterViaCursor, MetricLogSortViaCursor } from "./sort";
import { CursorPage } from "@/src/types/generics/CursorPage";
import { useEffect, useState } from "react";
import { metricLogsKeys } from "./keys";
import { MetricLogVM } from "./view-models";
import {
  invalidateLogDetail,
  invalidateLogLists,
  patchLogHeaderOptimistic,
  removeLogDetail,
} from "./cache";

// Types
type UseMetricLogArgs = {
  limit?: number;
  sort?: MetricLogSortViaCursor;
  q?: string;
  filter?: MetricLogFilterViaCursor;
};

type CursorResult = CursorPage<MetricLogResponseDTO>;

// * =========== Query Hooks ===========

/**
 * @deprecated Use cursor-based pagination instead (useMetricLogsListPaginationViaCursor)
 */
const useMetricLogs = (metricId: string, page: number, limit: number = 20) => {
  const { data, isLoading, isError } = useQuery<
    PaginatedMetricLogListResponseDTO | undefined,
    Error
  >({
    // Commented due to caching issue when creating new logs
    queryKey: ["metricLogs", metricId, page, limit],
    // queryKey: ["metricLogs", metricId],
    queryFn: () => getMetricLogs({ metricId, page, limit }),
    placeholderData: (
      previousData: PaginatedMetricLogListResponseDTO | undefined
    ) => previousData, // for smooth pagination UX
  });

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;

  return {
    logs,
    total,
    isLoading,
    isError,
  };
};

export function useMetricLogsListPaginationViaCursor(params: {
  limit: number;
  sort: MetricLogSortViaCursor;
  q?: string;
  filter?: MetricLogFilterViaCursor;
  enabled: boolean;
}) {
  type Map = Record<number, string | null>;
  const [page, setPage] = useState(1);
  const [cursorByPage, setCursorByPage] = useState<Map>({ 1: null });
  const { enabled = true } = params;

  // reset cursors when query changes
  useEffect(() => {
    setPage(1);
    setCursorByPage({ 1: null });
  }, [
    params.limit,
    params.sort,
    params.q,
    params.filter?.name,
    params.filter?.metricId,
  ]);

  console.log(`----- [Hook]: Filter`, params.filter);

  const query = useQuery({
    queryKey: metricLogsKeys.cursor.pages({
      ...params,
      page,
      includeTotal: true,
    }),
    queryFn: async () => {
      const after = cursorByPage[page] ?? undefined;
      const res = await getMetricLogsListViaCursor({
        ...params,
        after,
        includeTotal: true,
      });
      if (res.nextCursor && cursorByPage[page + 1] !== res.nextCursor) {
        setCursorByPage((m) => ({ ...m, [page + 1]: res.nextCursor! }));
      }
      return res;
    },
    enabled: enabled,
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
  });

  const items = query.data?.items ?? [];
  const totalCount = query.data?.totalCount;
  const totalPages = totalCount
    ? Math.max(1, Math.ceil(totalCount / params.limit))
    : undefined;

  // navigation helpers (works even if total unknown)
  const canPrev = page > 1;
  const canNext = Boolean(cursorByPage[page + 1] ?? query.data?.nextCursor);

  return {
    items,
    page,
    setPage,
    isFetching: query.isFetching,
    totalCount,
    totalPages,
    canPrev,
    canNext,
  };
}

export function useMetricLogInfiniteViaCursor(
  opts: UseMetricLogArgs & { enabled: boolean }
) {
  const { limit = 20, sort = "-createdAt", q, filter, enabled = true } = opts;

  const query = useInfiniteQuery<
    CursorResult, // TQueryFnData
    Error, // TError
    InfiniteData<CursorResult, string | undefined>, // TData (no select -> keep InfiniteData)
    ReturnType<typeof metricLogsKeys.cursor.infinite>, // TQueryKey
    string | undefined // TPageParam
  >({
    queryKey: metricLogsKeys.cursor.infinite({ limit, sort, q, filter }),
    queryFn: ({ pageParam }) =>
      getMetricLogsListViaCursor({
        limit,
        sort,
        q,
        filter,
        after: pageParam, // pageParam is TParam here
      }),
    enabled: enabled,
    initialPageParam: undefined, // REQUIRED in v5
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  const hasNextPage = query.hasNextPage;
  const loadMore = () => query.fetchNextPage();

  return { ...query, items, hasNextPage, loadMore };
}

// * =========== Mutation Hooks ===========

// CREATE hook
const useCreateMetricLog = (
  onSuccess?: (created: MetricLogResponseDTO) => void,
  onError?: (error: Error) => void
) => {
  const qc = useQueryClient();
  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation({
    mutationFn: createMetricLog,
    onSuccess: (created) => {
      invalidateLogLists(qc);
      onSuccess?.(created);
    },
    onError,
  });

  return {
    createMetricLog: mutateAsync,
    onSuccess,
    onError,
    isError,
    isSuccess,
    error,
    isPending,
  };
};

// UPDATE hook with optimistic update
type UpdateLogVars = {
  logId: string;
  log: UpdateMetricLogRequestDTO;
};

type UpdateCtx = { key: QueryKey; prev?: MetricLogVM };

const useUpdateMetricLog = (
  onSuccess?: (updated: MetricLogResponseDTO) => void,
  onErrorCb?: (error: Error) => void
) => {
  const qc = useQueryClient();
  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation<
    MetricLogResponseDTO,
    Error,
    UpdateLogVars,
    UpdateCtx
  >({
    mutationFn: ({ logId, log }) =>
      updateMetricLog({ metricLogId: logId, metricLog: log }),
    onMutate: async ({ logId, log }) => {
      await qc.cancelQueries({
        queryKey: metricLogsKeys.detail(logId),
      });

      const patch: Partial<Pick<MetricLogVM, "logValue" | "loggedAt">> = {
        logValue: log.logValue,
        loggedAt: log.loggedAt,
      };
      return patchLogHeaderOptimistic(qc, logId, patch);
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData<MetricLogVM>(ctx.key, ctx.prev);
      }
      onErrorCb?.(err);
    },
    onSettled: (_data, _err, vars) => {
      invalidateLogDetail(qc, vars.logId);
      invalidateLogLists(qc);
    },

    onSuccess: (updated) => {
      onSuccess?.(updated);
    },
  });

  return {
    updateMetricLog: mutateAsync,
    onSuccess,
    isError,
    isSuccess,
    error,
    isPending,
  };
};

// DELETE hook with optimistic update
type DeleteCtx = {
  // Temp snapshot all detail variants for restoration
  details: Array<{ key: QueryKey; prev: unknown }>;
};

const useDeleteMetricLog = (
  onSuccess?: (deletedId: string) => void,
  onErrorCb?: (error: Error) => void
) => {
  const qc = useQueryClient();
  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation<
    MetricLogResponseDTO,
    Error,
    string,
    DeleteCtx
  >({
    mutationFn: deleteMetricLog,
    onMutate: async (logId) => {
      await qc.cancelQueries({
        queryKey: metricLogsKeys.detail(logId),
      });

      const details = qc
        .getQueriesData({ queryKey: metricLogsKeys.detailByIdRoot(logId) })
        .map(([key, prev]) => {
          qc.setQueryData(key, undefined); // Temp clearing
          return { key, prev };
        });

      return { details };
    },
    onError: (err, _logId, ctx) => {
      ctx?.details.forEach(({ key, prev }) => {
        qc.setQueryData(key, prev);
      });
      onErrorCb?.(err);
    },
    onSuccess: (_void, logId) => {
      removeLogDetail(qc, logId);
      onSuccess?.(logId);
    },
    onSettled: () => {
      invalidateLogLists(qc);
    },
  });

  return {
    deleteMetricLog: mutateAsync,
    onSuccess,
    isError,
    isSuccess,
    error,
    isPending,
  };
};

// Custom hook to create dummy metric logs.
const useCreateMetricLogDummy = (
  onSuccess?: (created: MetricLogResponseDTO[]) => void,
  onError?: (error: Error) => void
) => {
  const qc = useQueryClient();
  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation({
    mutationFn: createMetricLogDummy,
    onSuccess: (created) => {
      invalidateLogLists(qc);
      onSuccess?.(created.logs);
    },
    onError,
  });

  return {
    createMetricLogDummy: mutateAsync,
    onSuccess,
    onError,
    isError,
    isSuccess,
    error,
    isPending,
  };
};

export {
  useMetricLogs,
  useCreateMetricLog,
  useUpdateMetricLog,
  useDeleteMetricLog,
  useCreateMetricLogDummy,
};
