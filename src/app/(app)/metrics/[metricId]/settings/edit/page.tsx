"use client";

import MetricSettingsFormDialog from "@/features/metric-settings/components/MetricSettingsFormDialog";

import { useMetricDetail } from "../../_components/MetricDetailContext";

const MetricSettingsEditPage = () => {
  const { metricId, settings } = useMetricDetail();

  return <MetricSettingsFormDialog metricId={metricId} initialSettings={settings} />;
};

export default MetricSettingsEditPage;
