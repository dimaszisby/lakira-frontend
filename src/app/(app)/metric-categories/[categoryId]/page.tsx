import MetricCategoryHeaderSection from "./_components/MetricCategoryHeaderSection";
import MetricListSection from "./_components/MetricListSection";
import {
  DEFAULT_METRIC_LIST_PARAMS,
  parseMetricListSearchParams,
} from "@/features/metrics/listSearchParams";
import { decodeCategoryReturnParams } from "@/features/metric-categories/listSearchParams";
import { MetricCategoryReturnProvider } from "./_components/MetricCategoryReturnContext";

type MetricCategoryDetailPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const MetricCategoryDetailPage = async ({ searchParams }: MetricCategoryDetailPageProps) => {
  const resolvedSearchParams = (await searchParams) ?? {};
  const initialParams = parseMetricListSearchParams(resolvedSearchParams, DEFAULT_METRIC_LIST_PARAMS);
  const rawReturnParams = Array.isArray(resolvedSearchParams.returnParams)
    ? resolvedSearchParams.returnParams[0]
    : resolvedSearchParams.returnParams;
  const returnParams = decodeCategoryReturnParams(rawReturnParams);

  return (
    <MetricCategoryReturnProvider value={returnParams}>
      <MetricCategoryHeaderSection />
      <MetricListSection initialParams={initialParams} />
    </MetricCategoryReturnProvider>
  );
};

export default MetricCategoryDetailPage;
