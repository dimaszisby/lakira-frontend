import MetricFormDialog from "@/features/metrics/components/MetricFormDialog";

// Over the metrics list, which has its own h1, so the dialog's title is an h2 (ADR-0032).
const InterceptedMetricCreatePage = () => {
  return <MetricFormDialog initialMetric={null} titleAs="h2" />;
};

export default InterceptedMetricCreatePage;
