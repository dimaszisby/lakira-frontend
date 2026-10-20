import CategoryMetricDialogRoute from "@/app/(app)/metric-categories/_components/CategoryMetricDialogRoute";

// Over the category's page, which has its own h1, so the dialog's title is an h2 (ADR-0032).
const InterceptedCategoryMetricDialogPage = async ({
  params,
}: {
  params: Promise<{ metricId: string }>;
}) => {
  const { metricId } = await params;
  return <CategoryMetricDialogRoute metricId={metricId} titleAs="h2" />;
};

export default InterceptedCategoryMetricDialogPage;
