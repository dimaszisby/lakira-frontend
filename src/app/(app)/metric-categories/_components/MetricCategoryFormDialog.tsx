"use client";

import { useRouter } from "next/navigation";

import MetricCategoryForm from "@/features/metric-categories/components/MetricCategoryForm";
import type { MetricCategoryVM } from "@/features/metric-categories/view-models";

const MetricCategoryFormDialog = ({ initialCategory }: { initialCategory: MetricCategoryVM | null }) => {
  const router = useRouter();

  return (
    <MetricCategoryForm
      initialCategory={initialCategory}
      onClose={() => {
        router.back();
      }}
    />
  );
};

export default MetricCategoryFormDialog;
