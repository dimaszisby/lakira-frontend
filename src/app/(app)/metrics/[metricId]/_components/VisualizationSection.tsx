"use client";

import Visualization from "@/features/data-visualizations/components/Visualization";
import { Card } from "@/ui/Card";

import { useMetricDetail } from "./MetricDetailContext";

const VisualizationSection = () => {
  const { metricId, settings } = useMetricDetail();

  return (
    <Card>
      <Visualization
        metricId={metricId}
        goalValue={settings?.goalValue ?? null}
        searchParamKey="viz"
      />
    </Card>
  );
};

export default VisualizationSection;
