import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { getMetricCategoryById } from "@/features/metric-categories/api";
import { toVM } from "@/features/metric-categories/mappers";
import { getServerAuthHeaders } from "@/services/api/serverHeaders";

import { MetricCategoryDetailProvider } from "./_components/MetricCategoryDetailContext";

type MetricCategoryLayoutProps = {
  children: ReactNode;
  modal: ReactNode;
  params: Promise<{
    categoryId: string;
  }>;
};

const MetricCategoryLayout = async ({
  children,
  modal,
  params,
}: MetricCategoryLayoutProps) => {
  const { categoryId } = await params;
  const serverHeaders = await getServerAuthHeaders();
  const category = await getMetricCategoryById(categoryId, { headers: serverHeaders }).catch(
    () => null,
  );

  if (!category) {
    notFound();
  }

  const value = toVM(category);

  return (
    <MetricCategoryDetailProvider value={value}>
      <div className="mx-auto flex flex-col gap-6">{children}</div>
      {modal}
    </MetricCategoryDetailProvider>
  );
};

export default MetricCategoryLayout;
