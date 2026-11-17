"use client";

import type { ReactNode } from "react";
import { useMemo, useRef, useState } from "react";

import { DASHBOARD_VIZ_LIMIT } from "@/features/data-visualizations/dashboardConfig";
import { useDashboardVisualizations } from "@/features/data-visualizations/hooks";
import type { VizQuery } from "@/features/data-visualizations/types";
import { useDashboardFilters } from "@/features/data-visualizations/useDashboardFilters";
import {
  buildVizQuery,
  DEFAULT_FILL,
  DEFAULT_TZ,
} from "@/features/data-visualizations/viz-helpers";
import { useOrganizationId } from "@/features/organizations/context";
import { handleApiError } from "@/services/api/handleApiError";

import FallbackBanner from "./FallbackBanner";
import MetricCardFromBatch from "./MetricCardFromBatch";

const DashboardContent = () => {
  const { bucket, range } = useDashboardFilters();
  const organizationId = useOrganizationId();

  const base = buildVizQuery(range, bucket, DEFAULT_TZ, DEFAULT_FILL) as VizQuery & {
    limit?: number;
  };
  const query = { ...base, limit: DASHBOARD_VIZ_LIMIT } as const;

  const { data, isFetching, isError, error, isPlaceholderData } = useDashboardVisualizations(
    query,
    { staleTime: 60_000, gcTime: 5 * 60_000 },
  );

  const errorMsg = useMemo(
    () => (error ? handleApiError(error).join(", ") : "Failed to load dashboard"),
    [error],
  );

  // A dismissed banner stays hidden until the organization, range or bucket changes; nothing is
  // stored. While the previous filters' data stands in for the new, the banner is not shown, so it
  // never states the old count for the new range.
  const filtersKey = JSON.stringify({ organizationId, range, bucket });
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const cardsRef = useRef<HTMLElement>(null);

  let body: ReactNode;
  let fallbackCount = 0;
  if (isFetching && !data) {
    body = <SkeletonGrid />;
  } else if (isError) {
    body = <ErrorState message={errorMsg} />;
  } else if (!data?.items.length) {
    body = <EmptyState />;
  } else {
    fallbackCount = isPlaceholderData ? 0 : data.meta.fallbackMetrics;
    body = (
      <section
        ref={cardsRef}
        tabIndex={-1}
        aria-label="Dashboard metrics"
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        {data.items.map((item) => (
          <MetricCardFromBatch key={item.metricId} item={item} tz={data.meta.tz} />
        ))}
      </section>
    );
  }

  const handleDismiss = () => {
    setDismissedKey(filtersKey);
    // The dismiss button unmounts; hand focus to the cards rather than dropping it to the page.
    cardsRef.current?.focus();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Mounted from the first render, so the banner is announced when it appears in it. */}
      <div role="status">
        {fallbackCount > 0 && dismissedKey !== filtersKey ? (
          <FallbackBanner count={fallbackCount} onDismiss={handleDismiss} />
        ) : null}
      </div>
      {body}
    </div>
  );
};
export default DashboardContent;

const SkeletonGrid = () => {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-64 rounded-2xl border bg-surface p-3 shadow-sm">
          <div className="h-full animate-pulse rounded-md bg-surface2" />
        </div>
      ))}
    </section>
  );
};

const ErrorState = ({ message }: { message: string }) => {
  return (
    <div className="rounded-xl border border-status-error p-6 text-center">
      <p className="text-base font-medium">Something went wrong</p>
      <p className="mt-1 text-sm text-ink-error">{message}</p>
    </div>
  );
};

const EmptyState = () => {
  return (
    <div className="rounded-xl border p-6 text-center">
      <p className="text-base font-medium">No dashboard metrics yet</p>
      <p className="mt-1 text-sm text-ink-secondary">
        Mark some metrics to show on the dashboard in their settings.
      </p>
    </div>
  );
};
