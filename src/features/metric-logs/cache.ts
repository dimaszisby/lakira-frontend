import type { QueryClient } from "@tanstack/react-query";

import { metricLogsKeys } from "./keys";
import type { MetricLogVM } from "./view-models";

/** Rooted + surgical invalidations (no heavy global predicate) */
export const invalidateLogLists = async (qc: QueryClient, organizationId: string) => {
  // Offset-based
  await qc.invalidateQueries({ queryKey: metricLogsKeys.lists(organizationId), exact: false });
  // Cursor-based (pages + infinite share the same root)
  await qc.invalidateQueries({
    queryKey: metricLogsKeys.cursor.root(organizationId),
    exact: false,
  });
};

export const invalidateLogDetail = async (
  qc: QueryClient,
  organizationId: string,
  logId: string,
) => {
  await qc.invalidateQueries({
    queryKey: metricLogsKeys.detailByIdRoot(organizationId, logId),
    exact: false,
  });
};

export const removeLogDetail = (qc: QueryClient, organizationId: string, logId: string) => {
  qc.removeQueries({
    queryKey: metricLogsKeys.detailByIdRoot(organizationId, logId),
    exact: false,
  });
};

/** Typed accessors for the common detail variant used by the composite hook */
export const detailKey = (organizationId: string, logId: string) =>
  metricLogsKeys.detail(organizationId, logId);

export const getMetricLogDetailVM = (qc: QueryClient, organizationId: string, logId: string) =>
  qc.getQueryData<MetricLogVM>(detailKey(organizationId, logId));

export const setMetricLogVM = (
  qc: QueryClient,
  organizationId: string,
  logId: string,
  next: MetricLogVM,
) => qc.setQueryData<MetricLogVM>(detailKey(organizationId, logId), next);

/** Safe optimistic header patcher (keeps settings untouched) */
export const patchLogHeaderOptimistic = (
  qc: QueryClient,
  organizationId: string,
  logId: string,
  patch: Partial<Pick<MetricLogVM, "logValue" | "loggedAt">>,
) => {
  const key = detailKey(organizationId, logId);
  const prev = qc.getQueryData<MetricLogVM>(key);
  if (!prev) return { key, prev };

  const nextHeader: MetricLogVM = { ...prev, ...patch };
  qc.setQueryData<MetricLogVM>(key, nextHeader);
  return { key, prev };
};
