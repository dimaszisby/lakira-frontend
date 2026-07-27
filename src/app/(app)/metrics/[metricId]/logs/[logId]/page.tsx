import { notFound } from "next/navigation";

import MetricLogFormDialog from "@/features/metric-logs/components/MetricLogFormDialog";
import { getMetricLogDetail } from "@/features/metric-logs/api";
import { toMetricLogVM } from "@/features/metric-logs/mappers";
import { getServerAuthHeaders } from "@/services/api/serverHeaders";

const MetricLogEditPage = async ({
  params,
}: {
  params: Promise<{ metricId: string; logId: string }>;
}) => {
  const { metricId, logId } = await params;
  const serverHeaders = await getServerAuthHeaders();
  const log = await getMetricLogDetail(
    { logId, metricId },
    { headers: serverHeaders },
  ).catch(() => null);

  if (!log) {
    notFound();
  }

  return <MetricLogFormDialog metricId={metricId} initialLog={toMetricLogVM(log)} />;
};

export default MetricLogEditPage;
