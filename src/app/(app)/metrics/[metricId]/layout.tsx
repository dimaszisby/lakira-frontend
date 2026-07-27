import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { toMetricSettingsVM } from "@/features/metric-settings/mappers";
import { toMetricHeaderVM } from "@/features/metrics/mappers";
import { getUserMetricDetails } from "@/features/metrics/metric.api";
import { getServerAuthHeaders } from "@/services/api/serverHeaders";

import Breadcrumbs from "./_components/Breadcrumbs";
import { MetricDetailProvider } from "./_components/MetricDetailContext";
import MetricDetailTabs from "./_components/MetricDetailTabs";
import MetricHeaderSection from "./_components/MetricHeaderSection";

type MetricDetailLayoutProps = {
  children: ReactNode;
  modal: ReactNode;
  params: Promise<{
    metricId: string;
  }>;
};

const MetricDetailLayout = async ({ children, modal, params }: MetricDetailLayoutProps) => {
  const { metricId } = await params;
  const serverHeaders = await getServerAuthHeaders();

  const detail = await getUserMetricDetails(
    metricId,
    {
      includes: ["category", "settings"],
    },
    { headers: serverHeaders },
  ).catch(() => null);

  if (!detail) {
    notFound();
  }

  const header = toMetricHeaderVM(detail);
  const settings = detail.settings ? toMetricSettingsVM(detail.settings) : null;

  return (
    <MetricDetailProvider value={{ metricId, header, settings }}>
      <div className="mx-auto flex w-full flex-col gap-4 pb-24 lg:pb-0">
        <Breadcrumbs />
        <MetricHeaderSection />
        <div className="flex flex-col">
          <MetricDetailTabs />
          <section className="min-h-0 flex-1">{children}</section>
        </div>
      </div>
      {modal}
    </MetricDetailProvider>
  );
};

export default MetricDetailLayout;
