import MetricFormDialog from "@/features/metrics/components/MetricFormDialog";

// Opened directly, the dialog is the whole page, so its title is the page's h1 (ADR-0032).
const MetricCreatePage = () => {
  return <MetricFormDialog initialMetric={null} titleAs="h1" />;
};

export default MetricCreatePage;
