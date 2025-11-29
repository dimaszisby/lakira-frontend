"use client";

import { useParams } from "next/navigation";

import MetricCategoryHeaderSection from "@/src/app/(app)/metric-categories/[id]/_components/MetricCategoryHeaderSection";
import MetricListSection from "@/src/app/(app)/metric-categories/[id]/_components/MetricListSection";
import { withAuth } from "@/src/components/hoc/withAuth";

const MetricCategoryDetailPageBase = () => {
  const params = useParams();
  const categoryId = params?.id as string;

  return (
    <div className="mx-auto flex flex-col gap-6">
      <MetricCategoryHeaderSection categoryId={categoryId} />

      {/** Metrics List Associated with current Category */}
      <MetricListSection categoryId={categoryId} />
    </div>
  );
};

const MetricCategoryDetailPage = withAuth(MetricCategoryDetailPageBase);
export default MetricCategoryDetailPage;
