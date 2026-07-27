import MetricLogFormDialog from "@/features/metric-logs/components/MetricLogFormDialog";

const MetricLogCreatePage = async ({ params }: { params: Promise<{ metricId: string }> }) => {
  const { metricId } = await params;
  return <MetricLogFormDialog metricId={metricId} />;
};

export default MetricLogCreatePage;
