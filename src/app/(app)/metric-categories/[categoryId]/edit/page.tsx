import { notFound } from "next/navigation";

import MetricCategoryFormDialog from "@/app/(app)/metric-categories/_components/MetricCategoryFormDialog";
import { getMetricCategoryById } from "@/features/metric-categories/api";
import { toVM } from "@/features/metric-categories/mappers";
import { getServerAuthHeaders } from "@/services/api/serverHeaders";

const MetricCategoryEditPage = async ({ params }: { params: Promise<{ categoryId: string }> }) => {
  const { categoryId } = await params;
  const serverHeaders = await getServerAuthHeaders();
  const category = await getMetricCategoryById(categoryId, { headers: serverHeaders }).catch(
    () => null,
  );
  if (!category) {
    notFound();
  }

  return <MetricCategoryFormDialog initialCategory={toVM(category)} />;
};

export default MetricCategoryEditPage;
