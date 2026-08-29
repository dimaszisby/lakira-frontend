import type { QueryClient } from "@tanstack/react-query";

import { metricSettingsKeys } from "./keys";
import type { MetricSettingsExtendedVM } from "./view-models";

/** Rooted + surgical invalidations (no heavy global predicate) */
export const invalidateMetricSettingsLists = async (qc: QueryClient, organizationId: string) => {
  // Offset-based
  await qc.invalidateQueries({ queryKey: metricSettingsKeys.lists(organizationId), exact: false });
  // Cursor-based (pages + infinite share the same root)
  await qc.invalidateQueries({
    queryKey: metricSettingsKeys.cursor.root(organizationId),
    exact: false,
  });
};

export const invalidateMetricSettingsDetail = async (
  qc: QueryClient,
  organizationId: string,
  metricId: string,
) => {
  await qc.invalidateQueries({
    queryKey: metricSettingsKeys.detailByIdRoot(organizationId, metricId),
    exact: false,
  });
};

export const removeMetricSettingsDetail = (
  qc: QueryClient,
  organizationId: string,
  metricId: string,
) => {
  qc.removeQueries({
    queryKey: metricSettingsKeys.detailByIdRoot(organizationId, metricId),
    exact: false,
  });
};

/** Typed accessors for the common detail variant used by the composite hook */
export const detailKey = (organizationId: string, metricId: string) =>
  metricSettingsKeys.detail(organizationId, metricId);

export const getMetricSettingsDetailVM = (
  qc: QueryClient,
  organizationId: string,
  metricId: string,
) => qc.getQueryData<MetricSettingsExtendedVM>(detailKey(organizationId, metricId));

export const setMetricSettingsVM = (
  qc: QueryClient,
  organizationId: string,
  metricId: string,
  next: MetricSettingsExtendedVM,
) => qc.setQueryData<MetricSettingsExtendedVM>(detailKey(organizationId, metricId), next);

/** Safe optimistic header patcher (keeps settings untouched) */
export const patchMetricSettingsOptimistic = (
  qc: QueryClient,
  organizationId: string,
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
  >,
) => {
  const key = detailKey(organizationId, metricId);
  const prev = qc.getQueryData<MetricSettingsExtendedVM>(key);
  if (!prev) return { key, prev };

  const nextHeader: MetricSettingsExtendedVM = { ...prev, ...patch };
  qc.setQueryData<MetricSettingsExtendedVM>(key, nextHeader);
  return { key, prev };
};
