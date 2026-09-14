import { notFound } from "next/navigation";

import MetricFormDialog from "@/features/metrics/components/MetricFormDialog";
import { fromDetail } from "@/features/metrics/form.initial";
import { toMetricHeaderVM } from "@/features/metrics/mappers";
import { getUserMetricDetails } from "@/features/metrics/metric.api";
import { NEW_RECORD_SEGMENT } from "@/lib/routes";
import { getServerAuthHeaders } from "@/services/api/serverHeaders";

/**
 * Serves both "add a metric to this category" and "edit one of its metrics".
 *
 * Collapsed into one route for the same reason as
 * `metrics/[metricId]/logs/[logId]/page.tsx`: a parallel slot cannot hold two
 * interceptors that match the same segment. This slot had `(.)new` beside
 * `(.)[metricId]`, so Next built `…/metrics/(.)(.)new` and threw
 * `Invalid interception route`, falling back to a full page load on every click.
 *
 * This second occurrence was not reported by anyone — it was found by
 * `src/app/__tests__/parallel-route-interceptors.test.ts`, which is why that
 * test reads the directory tree rather than rendering anything.
 */
const CategoryMetricDialogPage = async ({
  params,
}: {
  params: Promise<{ metricId: string }>;
}) => {
  const { metricId } = await params;

  if (metricId === NEW_RECORD_SEGMENT) {
    return <MetricFormDialog initialMetric={null} />;
  }

  const serverHeaders = await getServerAuthHeaders();
  const detail = await getUserMetricDetails(metricId, undefined, {
    headers: serverHeaders,
  }).catch(() => null);

  if (!detail) {
    notFound();
  }

  return <MetricFormDialog initialMetric={fromDetail(toMetricHeaderVM(detail))} />;
};

export default CategoryMetricDialogPage;
