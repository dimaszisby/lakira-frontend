import type { QueryClient } from "@tanstack/react-query";

import { metricsKeys } from "./keys";
import type { IncludeKey } from "./types";
import type { MetricDetailCompositeVM, MetricHeaderVM } from "./view-models";

/** Rooted + surgical invalidations (no heavy global predicate) */
export const invalidateMetricLists = async (qc: QueryClient, organizationId: string) => {
  // Offset-based
  await qc.invalidateQueries({ queryKey: metricsKeys.lists(organizationId), exact: false });
  // Cursor-based (pages + infinite share the same root)
  await qc.invalidateQueries({ queryKey: metricsKeys.cursor.root(organizationId), exact: false });
};

export const invalidateMetricDetail = async (
  qc: QueryClient,
  organizationId: string,
  metricId: string,
) => {
  await qc.invalidateQueries({
    queryKey: metricsKeys.detailByIdRoot(organizationId, metricId),
    exact: false,
  });
};

export const removeMetricDetail = (qc: QueryClient, organizationId: string, metricId: string) => {
  qc.removeQueries({
    queryKey: metricsKeys.detailByIdRoot(organizationId, metricId),
    exact: false,
  });
};

/** Typed accessors for the common detail variant used by the composite hook */
export const detailKey = (
  organizationId: string,
  metricId: string,
  includes: IncludeKey[] = ["category", "settings"],
  logsLimit?: number,
) => metricsKeys.detail(organizationId, metricId, includes, logsLimit);

export const getMetricDetailVM = (
  qc: QueryClient,
  organizationId: string,
  metricId: string,
  includes: IncludeKey[] = ["category", "settings"],
  logsLimit?: number,
) =>
  qc.getQueryData<MetricDetailCompositeVM>(
    detailKey(organizationId, metricId, includes, logsLimit),
  );

export const setMetricDetailVM = (
  qc: QueryClient,
  organizationId: string,
  metricId: string,
  next: MetricDetailCompositeVM,
  includes: IncludeKey[] = ["category", "settings"],
  logsLimit?: number,
) =>
  qc.setQueryData<MetricDetailCompositeVM>(
    detailKey(organizationId, metricId, includes, logsLimit),
    next,
  );

/** Safe optimistic header patcher (keeps settings untouched) */
export const patchMetricHeaderOptimistic = (
  qc: QueryClient,
  organizationId: string,
  metricId: string,
  patch: Partial<Pick<MetricHeaderVM, "name" | "defaultUnit" | "isPublic" | "description">>,
) => {
  const key = detailKey(organizationId, metricId, ["category", "settings"]);
  const prev = qc.getQueryData<MetricDetailCompositeVM>(key);
  if (!prev) return { key, prev };

  const nextHeader: MetricHeaderVM = { ...prev.header, ...patch };
  qc.setQueryData<MetricDetailCompositeVM>(key, {
    header: nextHeader,
    settings: prev.settings,
  });
  return { key, prev };
};
