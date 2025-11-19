"use client";

import { useParams } from "next/navigation";

import Breadcrumbs from "@/components/pages/metrics/detail/Breadcrumbs";
import MetricHeaderSection from "@/components/pages/metrics/detail/MetricHeaderSection";
import MetricLogsSection from "@/components/pages/metrics/detail/MetricLogSection";
import MetricSettingsSection from "@/components/pages/metrics/detail/MetricSettingsSection";
import VisualizationSection from "@/components/pages/metrics/detail/VisualizationSection";
import useMetricDetailComposite from "@/features/metrics/hooks/detail.query";
import SkeletonLoader from "@/ui/SekeletonLoader";

const MetricDetailContent = () => {
  const params = useParams();
  const metricId = params?.id as string;

  const { data, isLoading, error } = useMetricDetailComposite(metricId);

  if (isLoading) return <SkeletonLoader />;
  if (error) return <div>Error loading metric details: {error.message}</div>;
  if (!data) return <div>Empty metric details</div>;

  return (
    <div className="mx-auto flex flex-col gap-4">
      <Breadcrumbs category={data.header.category} metricName={data.header.name} />

      <MetricHeaderSection data={data?.header} />

      <VisualizationSection metricId={metricId} goalValue={data.settings?.goalValue ?? null} />

      <MetricLogsSection metricId={metricId} />

      <MetricSettingsSection metricId={metricId} data={data.settings} />
    </div>
  );
};

export default MetricDetailContent;
