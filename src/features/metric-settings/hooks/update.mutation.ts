import type { QueryKey } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toIsoFromLocalInput } from "@/src/utils/date-io";
import type {
  MetricSettingsResponseDTO,
  UpdateMetricSettingsRequestDTO,
} from "@/types/dtos/metric-settings.dto";

import { updateMetricSettings } from "../api";
import {
  invalidateMetricSettingsDetail,
  invalidateMetricSettingsLists,
  patchMetricSettingsOptimistic,
} from "../cache";
import { metricSettingsKeys } from "../keys";
import type { MetricSettingsExtendedVM } from "../view-models";

type UpdateSettingsVars = {
  settingsId: string;
  metricId: string;
  settings: UpdateMetricSettingsRequestDTO;
};

type UpdateCtx = { key: QueryKey; prev?: MetricSettingsExtendedVM };

export function useUpdateMetricSettings(
  onSuccess?: (updated: MetricSettingsResponseDTO) => void,
  onErrorCb?: (error: Error) => void,
) {
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
}
