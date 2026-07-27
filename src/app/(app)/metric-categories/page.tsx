import type { Metadata } from "next";

import MetricCategoriesPageClient from "@/app/(app)/metric-categories/_components/MetricCategoriesPageClient";
import { DEFAULT_CATEGORY_LIST_PARAMS, parseCategoryListSearchParams } from "@/features/metric-categories/listSearchParams";

export const metadata: Metadata = {
  title: "Metric Categories • Lakira",
};

type MetricCategoriesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const MetricCategoriesPage = async ({ searchParams }: MetricCategoriesPageProps) => {
  const resolvedSearchParams = (await searchParams) ?? {};
  const initialParams = parseCategoryListSearchParams(
    resolvedSearchParams,
    DEFAULT_CATEGORY_LIST_PARAMS,
  );

  return <MetricCategoriesPageClient initialParams={initialParams} />;
};

export default MetricCategoriesPage;
