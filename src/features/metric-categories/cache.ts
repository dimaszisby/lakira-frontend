import type { QueryClient } from "@tanstack/react-query";

import { metricCategoriesKeys } from "./keys";
import type { MetricCategoryVM } from "./view-models";

// * Invalidation Helper
export const invalidateMetricCategoryLists = async (qc: QueryClient, organizationId: string) => {
  await qc.invalidateQueries({
    queryKey: metricCategoriesKeys.cursor.root(organizationId),
    exact: false,
  });
};

export const invalidateMetricCategoryDetail = async (
  qc: QueryClient,
  organizationId: string,
  categoryId: string,
) => {
  await qc.invalidateQueries({
    queryKey: metricCategoriesKeys.detailByIdRoot(organizationId, categoryId),
    exact: false,
  });
};

export const removeMetricCategoryDetail = (
  qc: QueryClient,
  organizationId: string,
  categoryId: string,
) => {
  qc.removeQueries({
    queryKey: metricCategoriesKeys.detailByIdRoot(organizationId, categoryId),
    exact: false,
  });
};

// * Typed Accessors
export const detailKey = (organizationId: string, categoryId: string) =>
  metricCategoriesKeys.detail(organizationId, categoryId);

// TODO: set VM here

export const patchCategoryOptimistic = (
  qc: QueryClient,
  organizationId: string,
  categoryId: string,
  patch: Partial<Pick<MetricCategoryVM, "name" | "icon" | "color">>,
) => {
  const key = detailKey(organizationId, categoryId);
  const prev = qc.getQueryData<MetricCategoryVM>(key);
  if (!prev) return { key, prev };

  const nextBody: MetricCategoryVM = { ...prev, ...patch };
  qc.setQueryData<MetricCategoryVM>(key, {
    ...nextBody,
  });

  return { key, prev };
};

// TODO: invalidation/optimistic strategy for category's metrics list
