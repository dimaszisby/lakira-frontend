import type { QueryClient } from "@tanstack/react-query";

import { metricLogsKeys } from "./keys";
import type { MetricLogVM } from "./view-models";

/** Rooted + surgical invalidations (no heavy global predicate) */
export const invalidateLogLists = async (qc: QueryClient) => {
  // Offset-based
  await qc.invalidateQueries({ queryKey: metricLogsKeys.lists(), exact: false });
  // Cursor-based (pages + infinite share the same root)
  await qc.invalidateQueries({
    queryKey: metricLogsKeys.cursor.root(),
    exact: false,
  });
};

export const invalidateLogDetail = async (qc: QueryClient, logId: string) => {
  await qc.invalidateQueries({
    queryKey: metricLogsKeys.detailByIdRoot(logId),
    exact: false,
  });
};

export const removeLogDetail = (qc: QueryClient, logId: string) => {
  qc.removeQueries({
    queryKey: metricLogsKeys.detailByIdRoot(logId),
    exact: false,
  });
};

/** Typed accessors for the common detail variant used by the composite hook */
export const detailKey = (logId: string) => metricLogsKeys.detail(logId);

export const getMetricLogDetailVM = (qc: QueryClient, logId: string) =>
  qc.getQueryData<MetricLogVM>(detailKey(logId));

export const setMetricLogVM = (qc: QueryClient, logId: string, next: MetricLogVM) =>
  qc.setQueryData<MetricLogVM>(detailKey(logId), next);

/** Safe optimistic header patcher (keeps settings untouched) */
export const patchLogHeaderOptimistic = (
  qc: QueryClient,
  logId: string,
  patch: Partial<Pick<MetricLogVM, "logValue" | "loggedAt">>,
) => {
  const key = detailKey(logId);
  const prev = qc.getQueryData<MetricLogVM>(key);
  if (!prev) return { key, prev };

  const nextHeader: MetricLogVM = { ...prev, ...patch };
  qc.setQueryData<MetricLogVM>(key, nextHeader);
  return { key, prev };
};
