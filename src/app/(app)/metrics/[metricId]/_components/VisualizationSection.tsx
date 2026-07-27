"use client";

import Card from "@/ui/Card";
import Visualization from "@/ui/Visualization";

import { useMetricDetail } from "./MetricDetailContext";

const VisualizationSection = () => {
  const { metricId, settings } = useMetricDetail();

  return (
    <Card>
      <Visualization metricId={metricId} goalValue={settings?.goalValue ?? null} searchParamKey="viz" />
    </Card>
  );
};

export default VisualizationSection;
