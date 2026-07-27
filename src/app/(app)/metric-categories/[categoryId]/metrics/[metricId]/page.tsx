import { notFound } from "next/navigation";

import MetricFormDialog from "@/features/metrics/components/MetricFormDialog";
import { fromDetail } from "@/features/metrics/form.initial";
import { toMetricHeaderVM } from "@/features/metrics/mappers";
import { getUserMetricDetails } from "@/features/metrics/metric.api";
import { getServerAuthHeaders } from "@/services/api/serverHeaders";

const CategoryMetricEditPage = async ({ params }: { params: Promise<{ metricId: string }> }) => {
  const { metricId } = await params;
  const serverHeaders = await getServerAuthHeaders();
  const detail = await getUserMetricDetails(metricId, undefined, {
    headers: serverHeaders,
  }).catch(() => null);
  if (!detail) {
    notFound();
  }
  const header = toMetricHeaderVM(detail);
  const initialMetric = fromDetail(header);

  return <MetricFormDialog initialMetric={initialMetric} />;
};

export default CategoryMetricEditPage;
