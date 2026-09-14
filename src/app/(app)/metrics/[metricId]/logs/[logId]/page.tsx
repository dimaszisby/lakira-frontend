import { notFound } from "next/navigation";

import { getMetricLogDetail } from "@/features/metric-logs/api";
import MetricLogFormDialog from "@/features/metric-logs/components/MetricLogFormDialog";
import { toMetricLogVM } from "@/features/metric-logs/mappers";
import { NEW_RECORD_SEGMENT } from "@/lib/routes";
import { getServerAuthHeaders } from "@/services/api/serverHeaders";

/**
 * Serves both "add a log" (`/logs/new`) and "edit a log" (`/logs/:logId`).
 *
 * ## Why one route rather than two
 *
 * This used to be two: a static `new/` beside this dynamic `[logId]/`, each
 * with its own interceptor in the `@modal` slot. **A parallel slot cannot hold
 * two interceptors that match the same segment.** With `(.)new` and
 * `(.)[logId]` as siblings, Next built the interception path with the marker
 * applied twice — `/metrics/<id>/logs/(.)(.)new` — and
 * `extractInterceptionRouteInformation` threw `Invalid interception route`,
 * because splitting that path on `(.)` leaves an empty intercepted route.
 *
 * The visible effect was subtle, which is why it survived: the throw aborted
 * the soft navigation, Next fell back to a full page load, and the modal
 * appeared anyway — over a freshly loaded page instead of over the list, with a
 * 500 in the server log on every click. Confirmed on 2026-09-15 by deleting
 * `(.)[logId]`, at which point `(.)new` intercepted cleanly and the error
 * stopped; the same holds in reverse, which is the arrangement kept here.
 *
 * Sibling interceptors are fine when only one can match a segment — the
 * `metrics/@modal` slot pairs `(.)new` with `(.)[metricId]/edit` and works,
 * because the second is a nested path rather than a bare leaf.
 *
 * `logId` is a UUID for every real log, so the `"new"` sentinel cannot collide
 * with one.
 */
const MetricLogDialogPage = async ({
  params,
}: {
  params: Promise<{ metricId: string; logId: string }>;
}) => {
  const { metricId, logId } = await params;

  if (logId === NEW_RECORD_SEGMENT) {
    return <MetricLogFormDialog metricId={metricId} />;
  }

  const serverHeaders = await getServerAuthHeaders();
  const log = await getMetricLogDetail({ logId, metricId }, { headers: serverHeaders }).catch(
    () => null,
  );

  if (!log) {
    notFound();
  }

  return <MetricLogFormDialog metricId={metricId} initialLog={toMetricLogVM(log)} />;
};

export default MetricLogDialogPage;
