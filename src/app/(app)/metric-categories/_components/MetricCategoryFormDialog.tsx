"use client";

import { useRouter } from "next/navigation";

import MetricCategoryForm from "@/features/metric-categories/components/MetricCategoryForm";
import type { MetricCategoryVM } from "@/features/metric-categories/view-models";
import type { ModalTitleLevel } from "@/ui/Modal";

const MetricCategoryFormDialog = ({
  initialCategory,
  titleAs,
}: {
  initialCategory: MetricCategoryVM | null;
  /** `h1` from a route that is only this dialog, `h2` from its intercept (ADR-0032). */
  titleAs?: ModalTitleLevel;
}) => {
  const router = useRouter();

  return (
    <MetricCategoryForm
      initialCategory={initialCategory}
      titleAs={titleAs}
      onClose={() => {
        router.back();
      }}
    />
  );
};

export default MetricCategoryFormDialog;
