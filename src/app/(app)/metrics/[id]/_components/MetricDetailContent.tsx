"use client";

import { useParams } from "next/navigation";

import useMetricDetailComposite from "@/features/metrics/hooks/detail.query";
import Breadcrumbs from "@/src/app/(app)/metrics/[id]/_components/Breadcrumbs";
import MetricHeaderSection from "@/src/app/(app)/metrics/[id]/_components/MetricHeaderSection";
import MetricLogsSection from "@/src/app/(app)/metrics/[id]/_components/MetricLogSection";
import MetricSettingsSection from "@/src/app/(app)/metrics/[id]/_components/MetricSettingsSection";
import VisualizationSection from "@/src/app/(app)/metrics/[id]/_components/VisualizationSection";
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
