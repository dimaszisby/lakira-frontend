import MetricCategoryFormDialog from "@/app/(app)/metric-categories/_components/MetricCategoryFormDialog";

// Over the categories list, which has its own h1, so the dialog's title is an h2 (ADR-0032).
const InterceptedMetricCategoryCreatePage = () => {
  return <MetricCategoryFormDialog initialCategory={null} titleAs="h2" />;
};

export default InterceptedMetricCategoryCreatePage;
