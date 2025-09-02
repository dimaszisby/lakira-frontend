import { QueryClient } from "@tanstack/react-query";
import { metricLogsKeys } from "./keys";
import { MetricLogVM } from "./view-models";

/** Rooted + surgical invalidations (no heavy global predicate) */
export const invalidateLogLists = (qc: QueryClient) => {
  // Offset-based
  qc.invalidateQueries({ queryKey: metricLogsKeys.lists(), exact: false });
  // Cursor-based (pages + infinite share the same root)
  qc.invalidateQueries({
    queryKey: metricLogsKeys.cursor.root(),
    exact: false,
  });
};

export const invalidateLogDetail = (qc: QueryClient, categoryId: string) => {
  qc.invalidateQueries({
    queryKey: metricLogsKeys.detailByIdRoot(categoryId),
    exact: false,
  });
};

export const removeLogDetail = (qc: QueryClient, categoryId: string) => {
  qc.removeQueries({
    queryKey: metricLogsKeys.detailByIdRoot(categoryId),
    exact: false,
  });
};

/** Typed accessors for the common detail variant used by the composite hook */
export const detailKey = (categoryId: string) =>
  metricLogsKeys.detail(categoryId);

export const getMetricLogDetailVM = (qc: QueryClient, categoryId: string) =>
  qc.getQueryData<MetricLogVM>(detailKey(categoryId));

export const setMetricLogVM = (
  qc: QueryClient,
  categoryId: string,
  next: MetricLogVM
) => qc.setQueryData<MetricLogVM>(detailKey(categoryId), next);

/** Safe optimistic header patcher (keeps settings untouched) */
export const patchLogHeaderOptimistic = (
  qc: QueryClient,
  categoryId: string,
  patch: Partial<Pick<MetricLogVM, "logValue" | "loggedAt">>
) => {
  const key = detailKey(categoryId);
  const prev = qc.getQueryData<MetricLogVM>(key);
  if (!prev) return { key, prev };

  const nextHeader: MetricLogVM = { ...prev, ...patch };
  qc.setQueryData<MetricLogVM>(key, nextHeader);
  return { key, prev };
};
