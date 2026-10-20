import { notFound } from "next/navigation";

import MetricCategoryFormDialog from "@/app/(app)/metric-categories/_components/MetricCategoryFormDialog";
import { getMetricCategoryById } from "@/features/metric-categories/api";
import { toVM } from "@/features/metric-categories/mappers";
import { getServerAuthHeaders } from "@/services/api/serverHeaders";
import type { ModalTitleLevel } from "@/ui/Modal";

/**
 * The edit-category dialog, for `[categoryId]/edit` (`titleAs="h1"`, the dialog is the page) and
 * its intercept (`"h2"`, over the category's page). ADR-0032.
 */
const CategoryEditDialogRoute = async ({
  categoryId,
  titleAs,
}: {
  categoryId: string;
  titleAs: ModalTitleLevel;
}) => {
  const serverHeaders = await getServerAuthHeaders();
  const category = await getMetricCategoryById(categoryId, { headers: serverHeaders }).catch(
    () => null,
  );
  if (!category) {
    notFound();
  }

  return <MetricCategoryFormDialog initialCategory={toVM(category)} titleAs={titleAs} />;
};

export default CategoryEditDialogRoute;
