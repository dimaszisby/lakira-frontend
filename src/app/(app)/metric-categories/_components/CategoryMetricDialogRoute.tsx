import { notFound } from "next/navigation";

import MetricFormDialog from "@/features/metrics/components/MetricFormDialog";
import { fromDetail } from "@/features/metrics/form.initial";
import { toMetricHeaderVM } from "@/features/metrics/mappers";
import { getUserMetricDetails } from "@/features/metrics/metric.api";
import { NEW_RECORD_SEGMENT } from "@/lib/routes";
import { getServerAuthHeaders } from "@/services/api/serverHeaders";
import type { ModalTitleLevel } from "@/ui/Modal";

/**
 * The add-or-edit-metric dialog of a category, for `[categoryId]/metrics/[metricId]`
 * (`titleAs="h1"`) and its intercept (`"h2"`). See that page for why one route serves both.
 * ADR-0032.
 */
const CategoryMetricDialogRoute = async ({
  metricId,
  titleAs,
}: {
  metricId: string;
  titleAs: ModalTitleLevel;
}) => {
  if (metricId === NEW_RECORD_SEGMENT) {
    return <MetricFormDialog initialMetric={null} titleAs={titleAs} />;
  }

  const serverHeaders = await getServerAuthHeaders();
  const detail = await getUserMetricDetails(metricId, undefined, {
    headers: serverHeaders,
  }).catch(() => null);

  if (!detail) {
    notFound();
  }

  return (
    <MetricFormDialog initialMetric={fromDetail(toMetricHeaderVM(detail))} titleAs={titleAs} />
  );
};

export default CategoryMetricDialogRoute;
