import type { InfiniteData, QueryKey } from "@tanstack/react-query";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import {
  createMetricCategory,
  createMetricCategoryDummy,
  deleteMetricCategory,
  getMetricCategoryById,
  listMetricCategories,
  updateMetricCategory,
} from "@/features/metric-categories/api";
import type {
  MetricCategoryResponseDTO,
  UpdateMetricCategoryRequestDTO,
} from "@/types/dtos/metric-category.dto";
import type { CursorPage } from "@/types/generics/CursorPage";

import { useMetricsListViaOffset } from "../metrics/hooks";
import type { MetricsListParams } from "../metrics/types";
import {
  invalidateMetricCategoryDetail,
  invalidateMetricCategoryLists,
  patchCategoryOptimistic,
  removeMetricCategoryDetail,
} from "./cache";
import { metricCategoriesKeys } from "./keys";
import { toVM } from "./mappers";
import type { MetricCategoryFilter, MetricCategorySort } from "./sort";
import type { MetricCategoryVM } from "./view-models";

// TODO: Overhaul,use Metric's hook(s) as an example

// Types
type UseMetricCategoriesArgs = {
  limit?: number;
  sort?: MetricCategorySort;
  q?: string;
  filter?: MetricCategoryFilter;
};

type CursorResult = CursorPage<MetricCategoryResponseDTO>;

// * =========== Query Hooks ===========

export function useMetricCategoryCursorPagination(params: {
  limit: number;
  sort: MetricCategorySort;
  q?: string;
  filter?: MetricCategoryFilter;
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
  }, [params.limit, params.sort, params.q, params.filter?.name]);

  const query = useQuery({
    queryKey: metricCategoriesKeys.cursor.pages({
      ...params,
      page,
      includeTotal: true,
    }),
    queryFn: async () => {
      const after = cursorByPage[page] ?? undefined;
      const res = await listMetricCategories({
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
  const totalPages = totalCount ? Math.max(1, Math.ceil(totalCount / params.limit)) : undefined;

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

// Infinite Mobile
const useMetricCategoriesCursorInfinite = (
  opts: UseMetricCategoriesArgs & { enabled: boolean },
) => {
  const { limit = 20, sort = "-createdAt", q, filter, enabled = true } = opts;

  const query = useInfiniteQuery<
    CursorResult, // TQueryFnData
    Error, // TError
    InfiniteData<CursorResult, string | undefined>, // TData (no select -> keep InfiniteData)
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
    enabled: enabled,
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  const hasNextPage = query.hasNextPage;
  const loadMore = () => query.fetchNextPage();

  return { ...query, items, hasNextPage, loadMore };
};

// MetricCategoryDetailPage
const useMetricCategoryById = (categoryId: string) => {
  return useQuery<MetricCategoryVM, Error>({
    queryKey: metricCategoriesKeys.detail(categoryId),
    queryFn: async () => toVM(await getMetricCategoryById(categoryId)),
    enabled: !!categoryId,
  });
};

// Adapter for MetricLibraryList
// Dev Note: Currently not being used
type CategoryMetricsParams = Omit<MetricsListParams, "categoryId">;

export const useCategoryMetrics = (
  categoryId: string | undefined,
  params: CategoryMetricsParams = {},
  opts?: { enabled?: boolean; staleTime?: number },
) => {
  const merged = useMemo(() => ({ ...params, categoryId }), [params, categoryId]);

  return useMetricsListViaOffset(merged, {
    enabled: (opts?.enabled ?? true) && !!categoryId,
    staleTime: opts?.staleTime,
  });
};

// * =========== Mutation Hooks ===========

const useCreateMetricCategory = (
  onSuccess?: (created: MetricCategoryResponseDTO) => void,
  onError?: (error: Error) => void,
) => {
  const qc = useQueryClient();

  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation({
    mutationFn: createMetricCategory,
    onSuccess: async (created) => {
      await invalidateMetricCategoryLists(qc);
      onSuccess?.(created);
    },
    onError,
  });

  return {
    createMetricCategory: mutateAsync,
    onSuccess,
    onError,
    isError,
    isSuccess,
    error,
    isPending,
  };
};

type UpdateCategoryVars = {
  categoryId: string;
  category: UpdateMetricCategoryRequestDTO;
};
type UpdateCtx = { key: QueryKey; prev?: MetricCategoryVM };

const useUpdateMetricCategory = (
  onSuccess?: (updated: MetricCategoryResponseDTO) => void,
  onErrorCb?: (error: Error) => void,
) => {
  const qc = useQueryClient();
  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation<
    MetricCategoryResponseDTO,
    Error,
    UpdateCategoryVars,
    UpdateCtx
  >({
    mutationFn: updateMetricCategory,
    onMutate: async ({ categoryId, category }) => {
      await qc.cancelQueries({
        queryKey: metricCategoriesKeys.detailByIdRoot(categoryId),
      });

      const patch: Partial<Pick<MetricCategoryVM, "name" | "icon" | "color">> = {
        name: category.name,
        icon: category.icon,
        color: category.color,
      };

      return patchCategoryOptimistic(qc, categoryId, patch);
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData<MetricCategoryVM>(ctx.key, ctx.prev);
      }
      onErrorCb?.(err);
    },
    onSettled: async (_data, _err, vars) => {
      await invalidateMetricCategoryDetail(qc, vars.categoryId);
      await invalidateMetricCategoryLists(qc);
    },
    // (Optional) Setup for a success callback for UI toasts
    onSuccess: (updated) => {
      onSuccess?.(updated);
    },
  });

  return {
    updateMetricCategory: mutateAsync,
    onSuccess,
    isError,
    isSuccess,
    error,
    isPending,
  };
};

type DeleteCtx = {
  details: Array<{ key: QueryKey; prev: unknown }>;
};

const useDeleteMetricCategory = (
  onSuccess?: (deletedId: string) => void,
  onErrorCb?: (error: Error) => void,
) => {
  const qc = useQueryClient();
  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation<
    MetricCategoryResponseDTO,
    Error,
    string,
    DeleteCtx
  >({
    mutationFn: deleteMetricCategory,
    onMutate: async (categoryId) => {
      await qc.cancelQueries({
        queryKey: metricCategoriesKeys.detailByIdRoot(categoryId),
      });

      const details = qc
        .getQueriesData({
          queryKey: metricCategoriesKeys.detailByIdRoot(categoryId),
        })
        .map(([key, prev]) => {
          qc.setQueryData(key, undefined);
          return { key, prev };
        });

      return { details };
    },
    onError: (err, _categoryId, ctx) => {
      ctx?.details.forEach(({ key, prev }) => {
        qc.setQueryData(key, prev);
      });
      onErrorCb?.(err);
    },
    onSuccess: (_void, categoryId) => {
      removeMetricCategoryDetail(qc, categoryId);
      onSuccess?.(categoryId);
    },
    onSettled: async () => {
      await invalidateMetricCategoryLists(qc);
    },
  });

  return {
    deleteMetricCategory: mutateAsync,
    onSuccess,
    isError,
    isSuccess,
    error,
    isPending,
  };
};

const useCreateMetricCategoryDummy = (onSuccess?: () => void, onError?: (error: Error) => void) => {
  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation({
    mutationFn: createMetricCategoryDummy,
    onSuccess,
    onError,
  });

  return {
    createCategoryDummy: mutateAsync,
    onSuccess,
    onError,
    isError,
    isSuccess,
    error,
    isPending,
  };
};

export {
  useCreateMetricCategory,
  useCreateMetricCategoryDummy,
  useDeleteMetricCategory,
  useMetricCategoriesCursorInfinite as useMetricCategories,
  useMetricCategoryById,
  useUpdateMetricCategory,
};
