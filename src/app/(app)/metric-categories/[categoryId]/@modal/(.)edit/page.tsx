import CategoryEditDialogRoute from "@/app/(app)/metric-categories/_components/CategoryEditDialogRoute";

// Over the category's page, which has its own h1, so the dialog's title is an h2 (ADR-0032).
const InterceptedMetricCategoryEditPage = async ({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) => {
  const { categoryId } = await params;
  return <CategoryEditDialogRoute categoryId={categoryId} titleAs="h2" />;
};

export default InterceptedMetricCategoryEditPage;
