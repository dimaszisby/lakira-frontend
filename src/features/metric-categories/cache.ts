import type { QueryClient } from "@tanstack/react-query";

import { metricCategoriesKeys } from "./keys";
import type { MetricCategoryVM } from "./view-models";

// * Invalidation Helper
export const invalidateMetricCategoryLists = async (qc: QueryClient) => {
  await qc.invalidateQueries({
    queryKey: metricCategoriesKeys.cursor.root(),
    exact: false,
  });
};

export const invalidateMetricCategoryDetail = async (qc: QueryClient, categoryId: string) => {
  await qc.invalidateQueries({
    queryKey: metricCategoriesKeys.detailByIdRoot(categoryId),
    exact: false,
  });
};

export const removeMetricCategoryDetail = (qc: QueryClient, categoryId: string) => {
  qc.removeQueries({
    queryKey: metricCategoriesKeys.detailByIdRoot(categoryId),
    exact: false,
  });
};

// * Typed Accessors
export const detailKey = (categoryId: string) => metricCategoriesKeys.detail(categoryId);

// TODO: set VM here

export const patchCategoryOptimistic = (
  qc: QueryClient,
  categoryId: string,
  patch: Partial<Pick<MetricCategoryVM, "name" | "icon" | "color">>,
) => {
  const key = detailKey(categoryId);
  const prev = qc.getQueryData<MetricCategoryVM>(key);
  if (!prev) return { key, prev };

  const nextBody: MetricCategoryVM = { ...prev, ...patch };
  qc.setQueryData<MetricCategoryVM>(key, {
    ...nextBody,
  });

  return { key, prev };
};

// TODO: invalidation/optimistic strategy for category's metrics list
