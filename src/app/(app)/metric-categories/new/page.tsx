import MetricCategoryFormDialog from "@/app/(app)/metric-categories/_components/MetricCategoryFormDialog";

// Opened directly, the dialog is the whole page, so its title is the page's h1 (ADR-0032).
const MetricCategoryCreatePage = () => {
  return <MetricCategoryFormDialog initialCategory={null} titleAs="h1" />;
};

export default MetricCategoryCreatePage;
