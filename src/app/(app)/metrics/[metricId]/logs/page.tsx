import MetricLogsClient from "./_components/MetricLogsClient";
import { DEFAULT_METRIC_LOG_LIST_PARAMS, parseMetricLogSearchParams } from "@/features/metric-logs/listSearchParams";

type MetricLogsPageProps = {
  params: Promise<{ metricId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const MetricLogsPage = async ({ params, searchParams }: MetricLogsPageProps) => {
  await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const initialParams = parseMetricLogSearchParams(resolvedSearchParams, DEFAULT_METRIC_LOG_LIST_PARAMS);

  return <MetricLogsClient initialParams={initialParams} />;
};

export default MetricLogsPage;
