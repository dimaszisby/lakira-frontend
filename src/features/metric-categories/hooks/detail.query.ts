import { useQuery } from "@tanstack/react-query";

import { getMetricCategoryById } from "../api";
import { metricCategoriesKeys } from "../keys";
import { toVM } from "../mappers";
import type { MetricCategoryVM } from "../view-models";

// MetricCategoryDetailPage
export const useMetricCategoryById = (categoryId: string) => {
  return useQuery<MetricCategoryVM, Error>({
    queryKey: metricCategoriesKeys.detail(categoryId),
    queryFn: async () => toVM(await getMetricCategoryById(categoryId)),
    enabled: !!categoryId,
  });
};
