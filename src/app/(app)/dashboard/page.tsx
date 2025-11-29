import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";

import DashboardContent from "@/src/app/(app)/dashboard/_components/DashboardContent";
import { getDashboardVisualizations } from "@/features/data-visualizations/api";
import { DASHBOARD_VIZ_LIMIT } from "@/features/data-visualizations/dashboardConfig";
import { parseDashboardFilters } from "@/features/data-visualizations/dashboardFilters";
import { vizKeys } from "@/features/data-visualizations/keys";
import { buildVizQuery, DEFAULT_FILL, DEFAULT_TZ } from "@/features/data-visualizations/viz-helpers";

export const metadata = {
  title: "Dashboard • Lakira",
};

type DashboardPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const DashboardPage = async ({ searchParams = {} }: DashboardPageProps) => {
  const resolveValue = (value?: string | string[]) =>
    Array.isArray(value) ? value[0] ?? null : value ?? null;

  const filters = parseDashboardFilters({
    bucket: resolveValue(searchParams.bucket),
    range: resolveValue(searchParams.range),
    rangeStart: resolveValue(searchParams.rangeStart),
    rangeEnd: resolveValue(searchParams.rangeEnd),
  });

  const queryClient = new QueryClient();
  const vizQuery = buildVizQuery(filters.range, filters.bucket, DEFAULT_TZ, DEFAULT_FILL);
  const dashboardQuery = { ...vizQuery, limit: DASHBOARD_VIZ_LIMIT };

  await queryClient.prefetchQuery({
    queryKey: vizKeys.dashboard(dashboardQuery),
    queryFn: () => getDashboardVisualizations(dashboardQuery),
  });

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <DashboardContent />
    </HydrationBoundary>
  );
};

export default DashboardPage;
