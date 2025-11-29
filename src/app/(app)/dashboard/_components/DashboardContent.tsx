"use client";

import { useDashboardVisualizations } from "@/features/data-visualizations/hooks";
import { useDashboardFilters } from "@/features/data-visualizations/useDashboardFilters";
import type { VizQuery } from "@/features/data-visualizations/types";
import {
  buildVizQuery,
  DEFAULT_FILL,
  DEFAULT_TZ,
} from "@/features/data-visualizations/viz-helpers";
import { DASHBOARD_VIZ_LIMIT } from "@/features/data-visualizations/dashboardConfig";

import MetricCardFromBatch from "./MetricCardFromBatch";

const DashboardContent = () => {
  const { bucket, range } = useDashboardFilters();

  const base = buildVizQuery(range, bucket, DEFAULT_TZ, DEFAULT_FILL) as VizQuery & {
    limit?: number;
  };
  const query = { ...base, limit: DASHBOARD_VIZ_LIMIT } as const;

  const { data, isFetching, isError, error } = useDashboardVisualizations(query, {
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });

  if (isFetching && !data) return <SkeletonGrid />;
  if (isError) return <ErrorState message={error?.message ?? "Failed to load dashboard"} />;

  const items = data?.items ?? [];
  if (!items.length) return <EmptyState />;

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <MetricCardFromBatch
          key={item.metricId}
          item={item}
          bucket={data!.meta.bucket}
          tz={data!.meta.tz}
          range={data!.meta.range}
        />
      ))}
    </section>
  );
};
export default DashboardContent;

const SkeletonGrid = () => {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-card h-64 rounded-2xl border p-3 shadow-sm">
          <div className="bg-muted h-full animate-pulse rounded-md" />
        </div>
      ))}
    </section>
  );
};

const ErrorState = ({ message }: { message: string }) => {
  return (
    <div className="rounded-xl border p-6 text-center">
      <p className="text-base font-medium">Something went wrong</p>
      <p className="text-destructive mt-1 text-sm">{message}</p>
    </div>
  );
};

const EmptyState = () => {
  return (
    <div className="rounded-xl border p-6 text-center">
      <p className="text-base font-medium">No dashboard metrics yet</p>
      <p className="text-muted-foreground mt-1 text-sm">
        Mark some metrics to show on the dashboard in their settings.
      </p>
    </div>
  );
};
