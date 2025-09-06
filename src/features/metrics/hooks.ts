import {
  InfiniteData,
  QueryKey,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  MetricPreviewResponseDTO,
  MetricResponseDTO,
  PaginatedMetricListResponseDTO,
  UpdateMetricRequestDTO,
  UserMetricDetailResponseDTO,
} from "@/src/features/metrics/metric.dto";
import {
  createMetric,
  createMetricDummy,
  deleteMetric,
  getMetricLibraryList,
  getMetricLibraryViaCursor,
  getUserMetricDetails,
  updateMetric,
} from "@/src/features/metrics/metric.api";
import { metricsKeys } from "./keys";
import { IncludeKey, ListOptions, MetricsListParams } from "./types";
import { useEffect, useState } from "react";
import { CursorPage } from "@/src/types/generics/CursorPage";
import { MetricFilterViaCursor, MetricSortViaCursor } from "./sort";
import { toMetricHeaderVM, toMetricSettingsVM } from "./mappers";
import { MetricDetailCompositeVM, MetricHeaderVM } from "./view-models";
import { MetricSettingsExtendedVM } from "../metric-settings/view-models";
import {
  invalidateMetricDetail,
  invalidateMetricLists,
  patchMetricHeaderOptimistic,
  removeMetricDetail,
} from "./cache";

// Types
type UseMetricArgs = {
  limit?: number;
  sort?: MetricSortViaCursor;
  q?: string;
  filter?: MetricFilterViaCursor;
};

type CursorResult = CursorPage<MetricPreviewResponseDTO>;

// * =========== Query Hooks ===========

const useMetricsLibrary = (
  params: MetricsListParams,
  opts: ListOptions = {}
) => {
  const { data, isLoading, isError } = useQuery<
    PaginatedMetricListResponseDTO | undefined,
    Error
  >({
    queryKey: metricsKeys.list(params),
    queryFn: () => getMetricLibraryList(params),
    placeholderData: (
      previousData: PaginatedMetricListResponseDTO | undefined
    ) => previousData, // for smooth pagination UX
    enabled: opts.enabled ?? true,
    staleTime: opts.staleTime ?? 15_000,
  });

  const metrics = data?.metrics ?? [];
  const total = data?.total ?? 0;

  return {
    metrics,
    total,
    isLoading,
    isError,
  };
};

/**
 * @deprecated
 */
function useMetricDetails(
  metricId: string,
  includes: IncludeKey[] = [],
  logsLimit?: number
) {
  return useQuery<UserMetricDetailResponseDTO, Error>({
    queryKey: metricsKeys.detail(metricId, includes, logsLimit),
    queryFn: () => getUserMetricDetails(metricId, { includes, logsLimit }),
    enabled: !!metricId,
  });
}

function useMetricDetailComposite(metricId: string) {
  return useQuery({
    queryKey: metricsKeys.detail(metricId, ["category", "settings"]),
    queryFn: () =>
      getUserMetricDetails(metricId, { includes: ["category", "settings"] }),
    select: (dto) => ({
      header: toMetricHeaderVM(dto),
      settings: toMetricSettingsVM(dto) as MetricSettingsExtendedVM,
    }),
    enabled: !!metricId,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

export function useMetricsListPaginationViaCursor(params: {
  limit: number;
  sort: MetricSortViaCursor;
  q?: string;
  filter?: MetricFilterViaCursor;
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
    params.filter?.categoryId,
  ]);

  console.log(`----- [Hook]: Filter`, params.filter);

  const query = useQuery({
    queryKey: metricsKeys.cursor.pages({ ...params, page, includeTotal: true }),
    queryFn: async () => {
      const after = cursorByPage[page] ?? undefined;
      const res = await getMetricLibraryViaCursor({
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

export function useMetricInfiniteViaCursor(
  opts: UseMetricArgs & { enabled: boolean }
) {
  const { limit = 20, sort = "-createdAt", q, filter, enabled = true } = opts;

  const query = useInfiniteQuery<
    CursorResult, // TQueryFnData
    Error, // TError
    InfiniteData<CursorResult, string | undefined>, // TData (no select -> keep InfiniteData)
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

const useCreateMetric = (
  onSuccess?: (created: MetricResponseDTO) => void,
  onError?: (error: Error) => void
) => {
  const qc = useQueryClient();
  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation({
    mutationFn: createMetric,
    onSuccess: (created) => {
      invalidateMetricLists(qc);

      // Optional: optimistic stitch into the *current* first page if you want:
      // qc.setQueryData(metricsKeys.list({ page: 1, limit: 20, sortBy: "createdAt", sortOrder: "DESC" }), (old: any) => ...);

      onSuccess?.(created);
    },
    onError,
  });

  return { createMetric: mutateAsync, isError, isSuccess, error, isPending };
};

type UpdateMetricVars = {
  metricId: string;
  metric: UpdateMetricRequestDTO;
};

type UpdateCtx = { key: QueryKey; prev?: MetricDetailCompositeVM };

const useUpdateMetric = (
  onSuccess?: (updated: MetricResponseDTO) => void,
  onErrorCb?: (error: Error) => void
) => {
  const qc = useQueryClient();

  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation<
    MetricResponseDTO,
    Error,
    UpdateMetricVars,
    UpdateCtx
  >({
    mutationFn: updateMetric,
    // optimistic patch
    onMutate: async ({ metricId, metric }) => {
      await qc.cancelQueries({
        queryKey: metricsKeys.detailByIdRoot(metricId),
      });

      const patch: Partial<
        Pick<
          MetricHeaderVM,
          "name" | "defaultUnit" | "isPublic" | "description"
        >
      > = {
        name: metric.name,
        defaultUnit: metric.defaultUnit,
        isPublic: metric.isPublic,
        description: metric.description,
      };

      return patchMetricHeaderOptimistic(qc, metricId, patch); // return context for rollback
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData<MetricDetailCompositeVM>(ctx.key, ctx.prev);
      }
      onErrorCb?.(err);
    },
    onSettled: (_data, _err, vars) => {
      invalidateMetricDetail(qc, vars.metricId);
      invalidateMetricLists(qc);
    },
    // (Optional) Setup for a success callback for UI toasts
    onSuccess: (updated) => {
      onSuccess?.(updated);
    },
  });

  return { updateMetric: mutateAsync, isError, isSuccess, error, isPending };
};

type DeleteCtx = {
  // Temp snapshot all detail variants for restoration
  details: Array<{ key: QueryKey; prev: unknown }>;
};

const useDeleteMetric = (
  onSuccess?: (deletedId: string) => void,
  onErrorCb?: (error: Error) => void
) => {
  const qc = useQueryClient();
  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation<
    MetricResponseDTO, // TData
    Error, // TError
    string, // TVariables (metricId)
    DeleteCtx // TContext
  >({
    mutationFn: deleteMetric,
    // Optimistic delete
    onMutate: async (metricId) => {
      await qc.cancelQueries({
        queryKey: metricsKeys.detailByIdRoot(metricId),
      });

      const details = qc
        .getQueriesData({ queryKey: metricsKeys.detailByIdRoot(metricId) })
        .map(([key, prev]) => {
          qc.setQueryData(key, undefined); // Temp clearing
          return { key, prev };
        });

      return { details };
    },
    onError: (err, _metricId, ctx) => {
      ctx?.details.forEach(({ key, prev }) => {
        qc.setQueryData(key, prev);
      });
      onErrorCb?.(err);
    },
    onSuccess: (_void, metricId) => {
      removeMetricDetail(qc, metricId);
      onSuccess?.(metricId);
    },
    onSettled: () => {
      invalidateMetricLists(qc);
    },
  });

  return { deleteMetric: mutateAsync, isError, isSuccess, error, isPending };
};

const useCreateMetricDummy = (
  onSuccess?: () => void,
  onError?: (error: Error) => void
) => {
  const qc = useQueryClient();
  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation({
    mutationFn: createMetricDummy,
    onSuccess: () => {
      invalidateMetricLists(qc);
      onSuccess?.();
    },
    onError,
  });

  return {
    createMetricDummy: mutateAsync,
    isError,
    isSuccess,
    error,
    isPending,
  };
};

export {
  useMetricsLibrary,
  useMetricDetails,
  useMetricDetailComposite,
  useCreateMetric,
  useUpdateMetric,
  useDeleteMetric,
  useCreateMetricDummy,
};
