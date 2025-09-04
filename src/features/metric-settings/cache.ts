import { QueryClient } from "@tanstack/react-query";
import { metricSettingsKeys } from "./keys";
import { MetricSettingsExtendedVM } from "./view-models";

/** Rooted + surgical invalidations (no heavy global predicate) */
export const invalidateMetricSettingsLists = (qc: QueryClient) => {
  // Offset-based
  qc.invalidateQueries({ queryKey: metricSettingsKeys.lists(), exact: false });
  // Cursor-based (pages + infinite share the same root)
  qc.invalidateQueries({
    queryKey: metricSettingsKeys.cursor.root(),
    exact: false,
  });
};

export const invalidateMetricSettingsDetail = (
  qc: QueryClient,
  metricId: string
) => {
  qc.invalidateQueries({
    queryKey: metricSettingsKeys.detailByIdRoot(metricId),
    exact: false,
  });
};

export const removeMetricSettingsDetail = (
  qc: QueryClient,
  metricId: string
) => {
  qc.removeQueries({
    queryKey: metricSettingsKeys.detailByIdRoot(metricId),
    exact: false,
  });
};

/** Typed accessors for the common detail variant used by the composite hook */
export const detailKey = (metricId: string) =>
  metricSettingsKeys.detail(metricId);

export const getMetricSettingsDetailVM = (
  qc: QueryClient,
  metricId: string
) => qc.getQueryData<MetricSettingsExtendedVM>(detailKey(metricId));

export const setMetricSettingsVM = (
  qc: QueryClient,
  metricId: string,
  next: MetricSettingsExtendedVM
) => qc.setQueryData<MetricSettingsExtendedVM>(detailKey(metricId), next);

/** Safe optimistic header patcher (keeps settings untouched) */
export const patchMetricSettingsOptimistic = (
  qc: QueryClient,
  metricId: string,
  patch: Partial<
    Pick<
      MetricSettingsExtendedVM,
      | "goalEnabled"
      | "goalType"
      | "goalValue"
      | "timeFrameEnabled"
      | "startDate"
      | "deadlineDate"
      | "alertEnabled"
      | "alertThresholds"
      | "isAchieved"
      | "isActive"
      | "displayOptions"
    >
  >
) => {
  const key = detailKey(metricId);
  const prev = qc.getQueryData<MetricSettingsExtendedVM>(key);
  if (!prev) return { key, prev };

  const nextHeader: MetricSettingsExtendedVM = { ...prev, ...patch };
  qc.setQueryData<MetricSettingsExtendedVM>(key, nextHeader);
  return { key, prev };
};