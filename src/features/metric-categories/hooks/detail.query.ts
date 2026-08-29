import { useQuery } from "@tanstack/react-query";

import { useOrganizationId } from "@/features/organizations/context";

import { getMetricCategoryById } from "../api";
import { metricCategoriesKeys } from "../keys";
import { toVM } from "../mappers";
import type { MetricCategoryVM } from "../view-models";

export const useMetricCategoryById = (categoryId: string) => {
  const organizationId = useOrganizationId();

  return useQuery<MetricCategoryVM, Error>({
    queryKey: metricCategoriesKeys.detail(organizationId, categoryId),
    queryFn: async () => toVM(await getMetricCategoryById(categoryId)),
    enabled: !!categoryId,
  });
};
