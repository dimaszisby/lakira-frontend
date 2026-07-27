import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";

import DashboardContent from "@/src/app/(app)/dashboard/_components/DashboardContent";
import { getDashboardVisualizations } from "@/features/data-visualizations/api";
import { DASHBOARD_VIZ_LIMIT } from "@/features/data-visualizations/dashboardConfig";
import { parseDashboardFilters } from "@/features/data-visualizations/dashboardFilters";
import { vizKeys } from "@/features/data-visualizations/keys";
import { buildVizQuery, DEFAULT_FILL, DEFAULT_TZ } from "@/features/data-visualizations/viz-helpers";
import { getServerAuthHeaders } from "@/services/api/serverHeaders";

export const metadata = {
  title: "Dashboard • Lakira",
};

type DashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const DashboardPage = async ({ searchParams }: DashboardPageProps) => {
  const resolvedSearchParams = (await searchParams) ?? {};
  const resolveValue = (value?: string | string[]) =>
    Array.isArray(value) ? value[0] ?? null : value ?? null;

  const filters = parseDashboardFilters({
    bucket: resolveValue(resolvedSearchParams.bucket),
    range: resolveValue(resolvedSearchParams.range),
    rangeStart: resolveValue(resolvedSearchParams.rangeStart),
    rangeEnd: resolveValue(resolvedSearchParams.rangeEnd),
  });

  const serverHeaders = await getServerAuthHeaders();

  const queryClient = new QueryClient();
  const vizQuery = buildVizQuery(filters.range, filters.bucket, DEFAULT_TZ, DEFAULT_FILL);
  const dashboardQuery = { ...vizQuery, limit: DASHBOARD_VIZ_LIMIT };

  await queryClient.prefetchQuery({
    queryKey: vizKeys.dashboard(dashboardQuery),
    queryFn: () => getDashboardVisualizations(dashboardQuery, { headers: serverHeaders }),
  });

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <DashboardContent />
    </HydrationBoundary>
  );
};

export default DashboardPage;
