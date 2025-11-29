"use client";

import { withAuth } from "@/components/hoc/withAuth";
import MetricDetailContent from "@/src/app/(app)/metrics/[id]/_components/MetricDetailContent";

const MetricDetailPageBase = () => {
  return <MetricDetailContent></MetricDetailContent>;
};

const MetricDetailPage = withAuth(MetricDetailPageBase);
export default MetricDetailPage;
