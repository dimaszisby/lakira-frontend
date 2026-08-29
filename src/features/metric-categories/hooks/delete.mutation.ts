import type { QueryKey } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useOrganizationId } from "@/features/organizations/context";
import type { MetricCategoryResponseDTO } from "@/types/dtos/metric-category.dto";

import { deleteMetricCategory } from "../api";
import { invalidateMetricCategoryLists, removeMetricCategoryDetail } from "../cache";
import { metricCategoriesKeys } from "../keys";

type DeleteCtx = {
  details: Array<{ key: QueryKey; prev: unknown }>;
};

export const useDeleteMetricCategory = (
  onSuccess?: (deletedId: string) => void,
  onErrorCb?: (error: Error) => void,
) => {
  const qc = useQueryClient();
  const organizationId = useOrganizationId();
  const { mutateAsync, isError, isSuccess, error, isPending } = useMutation<
    MetricCategoryResponseDTO,
    Error,
    string,
    DeleteCtx
  >({
    mutationFn: (categoryId) => deleteMetricCategory(categoryId),
    onMutate: async (categoryId) => {
      await qc.cancelQueries({
        queryKey: metricCategoriesKeys.detailByIdRoot(organizationId, categoryId),
      });

      const details = qc
        .getQueriesData({
          queryKey: metricCategoriesKeys.detailByIdRoot(organizationId, categoryId),
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
      removeMetricCategoryDetail(qc, organizationId, categoryId);
      onSuccess?.(categoryId);
    },
    onSettled: async () => {
      await invalidateMetricCategoryLists(qc, organizationId);
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
