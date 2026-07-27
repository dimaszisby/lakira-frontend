import type { Metadata } from "next";

import MetricsPageClient from "@/app/(app)/metrics/_components/MetricsPageClient";
import {
  DEFAULT_METRIC_LIST_PARAMS,
  parseMetricListSearchParams,
} from "@/features/metrics/listSearchParams";

export const metadata: Metadata = {
  title: "Metrics • Lakira",
};

type MetricsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const MetricsPage = async ({ searchParams }: MetricsPageProps) => {
  const resolvedSearchParams = (await searchParams) ?? {};
  const initialParams = parseMetricListSearchParams(resolvedSearchParams, DEFAULT_METRIC_LIST_PARAMS);

  return <MetricsPageClient initialParams={initialParams} />;
};

export default MetricsPage;
