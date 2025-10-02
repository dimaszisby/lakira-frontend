import type { InfiniteData, QueryKey } from "@tanstack/react-query";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import {
  createMetricSettings,
  deleteMetricSettings,
  getMetricSettingsListViaCursor,
  updateDisplayOptions,
  updateGoalAchievement,
  updateMetricSettings,
} from "@/src/features/metric-settings/api";
import type {
  DisplayOptionsDTO,
  MetricSettingsResponseDTO,
  UpdateMetricSettingsRequestDTO,
} from "@/src/types/dtos/metric-settings.dto";
import type { CursorPage } from "@/src/types/generics/CursorPage";
import { toIsoFromLocalInput } from "@/src/utils/date-io";

import {
  invalidateMetricSettingsDetail,
  invalidateMetricSettingsLists,
  patchMetricSettingsOptimistic,
  removeMetricSettingsDetail,
} from "./cache";
import { metricSettingsKeys } from "./keys";
import type { MetricSettingsFilterViaCursor, MetricSettingsSortViaCursor } from "./sort";
import type { MetricSettingsExtendedVM } from "./view-models";

// Types
type UseMetricSettingsArgs = {
  limit?: number;
  sort?: MetricSettingsSortViaCursor;
  filter?: MetricSettingsFilterViaCursor;
};

type CursorResult = CursorPage<MetricSettingsExtendedVM>;

// * =========== Query Hooks ===========

function useMetricSettingsListPaginationViaCursor(params: {
  limit: number;
  sort: MetricSettingsSortViaCursor;
  filter?: MetricSettingsFilterViaCursor;
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
  }, [params.limit, params.sort, params.filter?.metricId]);

  const query = useQuery({
    queryKey: metricSettingsKeys.cursor.pages({
      ...params,
      page,
      includeTotal: true,
    }),
    queryFn: async () => {
      const after = cursorByPage[page] ?? undefined;
      const res = await getMetricSettingsListViaCursor({
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
    isError: query.isError, // Add isError to the returned object
    totalCount,
    totalPages,
    canPrev,
    canNext,
  };
}

function useMetricSettingsInfiniteViaCursor(opts: UseMetricSettingsArgs & { enabled: boolean }) {
  const { limit = 20, sort = "-createdAt", filter, enabled = true } = opts;

  const query = useInfiniteQuery<
    CursorResult, // TQueryFnData
    Error, // TError
    InfiniteData<CursorResult, string | undefined>, // TData (no select -> keep InfiniteData)
    ReturnType<typeof metricSettingsKeys.cursor.infinite>, // TQueryKey
    string | undefined // TPageParam
  >({
    queryKey: metricSettingsKeys.cursor.infinite({ limit, sort, filter }),
    queryFn: ({ pageParam }) =>
      getMetricSettingsListViaCursor({
        limit,
        sort,
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
const useCreateMetricSettings = (
  onSuccess?: (created: MetricSettingsResponseDTO) => void,
  onError?: (error: Error) => void,
) => {
  const qc = useQueryClient();
  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation({
    mutationFn: createMetricSettings,
    onSuccess: async (created) => {
      await invalidateMetricSettingsLists(qc);
      await onSuccess?.(created);
    },
    onError,
  });

  return {
    createMetricSettings: mutateAsync,
    onSuccess,
    onError,
    isError,
    isSuccess,
    error,
    isPending,
  };
};

// UPDATE hook with optimistic update
type UpdateSettingsVars = {
  settingsId: string;
  metricId: string;
  settings: UpdateMetricSettingsRequestDTO;
};

type UpdateCtx = { key: QueryKey; prev?: MetricSettingsExtendedVM };

const useUpdateMetricSettings = (
  onSuccess?: (updated: MetricSettingsResponseDTO) => void,
  onErrorCb?: (error: Error) => void,
) => {
  const qc = useQueryClient();
  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation<
    MetricSettingsResponseDTO,
    Error,
    UpdateSettingsVars,
    UpdateCtx
  >({
    mutationFn: ({ settingsId, metricId, settings }) =>
      updateMetricSettings(settingsId, metricId, settings),
    onMutate: async ({ settingsId, settings }) => {
      await qc.cancelQueries({
        queryKey: metricSettingsKeys.detail(settingsId),
      });

      const patch: Partial<
        Pick<
          MetricSettingsExtendedVM,
          | "goalEnabled"
          | "goalType"
          | "goalValue"
          | "timeFrameEnabled"
          | "startDate"
          | "deadlineDate"
          | "alertEnabled"
          | "alertThresholds"
          | "isAchieved"
          | "isActive"
          | "displayOptions"
        >
      > = {
        goalEnabled: settings.goalEnabled,
        goalType: settings.goalType,
        goalValue: settings.goalValue,
        timeFrameEnabled: settings.timeFrameEnabled,
        startDate: settings.startDate ? toIsoFromLocalInput(settings.startDate) : null,
        deadlineDate: settings.deadlineDate ? toIsoFromLocalInput(settings.deadlineDate) : null,
        alertEnabled: settings.alertEnabled,
        alertThresholds: settings.alertThresholds,
        displayOptions: {
          showOnDashboard: settings.displayOptions?.showOnDashboard ?? false,
          priority: settings.displayOptions?.priority ?? null,
          chartType: settings.displayOptions?.chartType ?? null,
          color: settings.displayOptions?.color ?? null,
        },
      };
      return patchMetricSettingsOptimistic(qc, settingsId, patch);
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData<MetricSettingsExtendedVM>(ctx.key, ctx.prev);
      }
      onErrorCb?.(err);
    },
    onSettled: async (_data, _err, vars) => {
      await invalidateMetricSettingsDetail(qc, vars.settingsId);
      await invalidateMetricSettingsLists(qc);
    },

    onSuccess: (updated) => {
      onSuccess?.(updated);
    },
  });

  return {
    updateMetricSettings: mutateAsync,
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

const useDeleteMetricSettings = (
  onSuccess?: (deletedId: string) => void,
  onErrorCb?: (error: Error) => void,
) => {
  const qc = useQueryClient();
  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation<
    MetricSettingsResponseDTO,
    Error,
    { id: string; metricId: string },
    DeleteCtx
  >({
    mutationFn: ({ id, metricId }) => deleteMetricSettings(id, metricId),
    onMutate: async ({ id }) => {
      await qc.cancelQueries({
        queryKey: metricSettingsKeys.detail(id),
      });

      const details = qc
        .getQueriesData({ queryKey: metricSettingsKeys.detailByIdRoot(id) })
        .map(([key, prev]) => {
          qc.setQueryData(key, undefined); // Temp clearing
          return { key, prev };
        });

      return { details };
    },
    onError: (err, _vars, ctx) => {
      ctx?.details.forEach(({ key, prev }) => {
        qc.setQueryData(key, prev);
      });
      onErrorCb?.(err);
    },
    onSuccess: (_void, vars) => {
      removeMetricSettingsDetail(qc, vars.id);
      onSuccess?.(vars.id);
    },
    onSettled: async () => {
      await invalidateMetricSettingsLists(qc);
    },
  });

  return {
    deleteMetricSettings: mutateAsync,
    onSuccess,
    isError,
    isSuccess,
    error,
    isPending,
  };
};

// PATCH goal achievements hook
const useUpdateGoalAchievement = (
  onSuccess?: (updated: MetricSettingsResponseDTO) => void,
  onError?: (error: Error) => void,
) => {
  const qc = useQueryClient();
  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation({
    mutationFn: ({ id, metricId }: { id: string; metricId: string }) =>
      updateGoalAchievement(id, metricId),
    onSuccess: async (updated) => {
      await invalidateMetricSettingsDetail(qc, updated.id);
      await invalidateMetricSettingsLists(qc);
      onSuccess?.(updated);
    },
    onError,
  });

  return {
    updateGoalAchievement: mutateAsync,
    onSuccess,
    onError,
    isError,
    isSuccess,
    error,
    isPending,
  };
};

// PATCH display options hook
const useUpdateDisplayOptions = (
  onSuccess?: (updated: MetricSettingsResponseDTO) => void,
  onError?: (error: Error) => void,
) => {
  const qc = useQueryClient();
  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation({
    mutationFn: ({
      id,
      metricId,
      displayOptions,
    }: {
      id: string;
      metricId: string;
      displayOptions: DisplayOptionsDTO;
    }) => updateDisplayOptions(id, metricId, displayOptions),
    onSuccess: async (updated) => {
      await invalidateMetricSettingsDetail(qc, updated.id);
      await invalidateMetricSettingsLists(qc);
      onSuccess?.(updated);
    },
    onError,
  });

  return {
    updateDisplayOptions: mutateAsync,
    onSuccess,
    onError,
    isError,
    isSuccess,
    error,
    isPending,
  };
};

export {
  useCreateMetricSettings,
  useDeleteMetricSettings,
  useMetricSettingsInfiniteViaCursor,
  useMetricSettingsListPaginationViaCursor,
  useUpdateDisplayOptions,
  useUpdateGoalAchievement,
  useUpdateMetricSettings,
};
