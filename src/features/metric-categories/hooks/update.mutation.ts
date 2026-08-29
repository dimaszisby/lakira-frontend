import type { QueryKey } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useOrganizationId } from "@/features/organizations/context";
import type {
  MetricCategoryResponseDTO,
  UpdateMetricCategoryRequestDTO,
} from "@/types/dtos/metric-category.dto";

import { updateMetricCategory } from "../api";
import {
  invalidateMetricCategoryDetail,
  invalidateMetricCategoryLists,
  patchCategoryOptimistic,
} from "../cache";
import { metricCategoriesKeys } from "../keys";
import type { MetricCategoryVM } from "../view-models";

type UpdateCategoryVars = {
  categoryId: string;
  category: UpdateMetricCategoryRequestDTO;
};
type UpdateCtx = { key: QueryKey; prev?: MetricCategoryVM };

export const useUpdateMetricCategory = (
  onSuccess?: (updated: MetricCategoryResponseDTO) => void,
  onErrorCb?: (error: Error) => void,
) => {
  const qc = useQueryClient();
  const organizationId = useOrganizationId();
  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation<
    MetricCategoryResponseDTO,
    Error,
    UpdateCategoryVars,
    UpdateCtx
  >({
    mutationFn: (vars) => updateMetricCategory(vars),
    onMutate: async ({ categoryId, category }) => {
      await qc.cancelQueries({
        queryKey: metricCategoriesKeys.detailByIdRoot(organizationId, categoryId),
      });

      const patch: Partial<Pick<MetricCategoryVM, "name" | "icon" | "color">> = {
        name: category.name,
        icon: category.icon,
        color: category.color,
      };

      return patchCategoryOptimistic(qc, organizationId, categoryId, patch);
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData<MetricCategoryVM>(ctx.key, ctx.prev);
      }
      onErrorCb?.(err);
    },
    onSettled: async (_data, _err, vars) => {
      await invalidateMetricCategoryDetail(qc, organizationId, vars.categoryId);
      await invalidateMetricCategoryLists(qc, organizationId);
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
