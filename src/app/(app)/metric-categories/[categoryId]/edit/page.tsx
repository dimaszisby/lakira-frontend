import CategoryEditDialogRoute from "@/app/(app)/metric-categories/_components/CategoryEditDialogRoute";

// Opened directly, the dialog is the whole page, so its title is the page's h1 (ADR-0032).
const MetricCategoryEditPage = async ({ params }: { params: Promise<{ categoryId: string }> }) => {
  const { categoryId } = await params;
  return <CategoryEditDialogRoute categoryId={categoryId} titleAs="h1" />;
};

export default MetricCategoryEditPage;
