"use client";

import { useRouter } from "next/navigation";
import { CalendarBlank, Eye, Tag } from "phosphor-react";
import { memo, useCallback, useEffect, useRef } from "react";

import CategoryChip from "@/features/metric-categories/components/CategoryChip";
import { toCategoryUI } from "@/features/metric-categories/presenters/toCategoryUI";
import type { MetricPreviewVM } from "@/features/metrics/view-models";
import { metricRoutes } from "@/lib/routes";
import IconLabel from "@/ui/IconLabel";

export interface MetricLibraryCardProps {
  metric: MetricPreviewVM;
  onClick?: (metric: MetricPreviewVM) => void;
  onPrefetch?: (metric: MetricPreviewVM) => void;
}

export const MetricLibraryMobileCardBase = ({
  metric,
  onClick,
  onPrefetch,
}: MetricLibraryCardProps) => {
  const router = useRouter();
  const { id, name, defaultUnit, isPublic, category, logCount } = metric;
  const prefetchedRef = useRef(false);

  useEffect(() => {
    prefetchedRef.current = false;
  }, [metric.id]);

  const triggerPrefetch = useCallback(() => {
    if (prefetchedRef.current) return;
    prefetchedRef.current = true;
    onPrefetch?.(metric);
  }, [metric, onPrefetch]);

  // Handler
  const handleCardClick = useCallback(() => {
    triggerPrefetch();
    if (onClick) return onClick(metric); // prefer parent handler
    router.push(metricRoutes.detail(id)); // fallback behaviour
  }, [triggerPrefetch, onClick, router, id, metric]);

  const categoryUI = toCategoryUI(category);

  return (
    <button
      type="button"
      onClick={handleCardClick}
      onMouseEnter={triggerPrefetch}
      onFocus={triggerPrefetch}
      onTouchStart={triggerPrefetch}
      className="flex w-full flex-col gap-2 text-left"
      aria-label={`Open metric ${name}`}
    >
      <span className="line-clamp-1 text-base font-semibold" title={name}>
        {name}
      </span>

      <span className="flex flex-wrap items-center gap-3">
        <span>
          <CategoryChip category={categoryUI} />
        </span>

        <IconLabel
          icon={Tag}
          label={defaultUnit ?? "-"}
          tone="muted"
          size="sm"
          iconClassName="mr-1"
        />

        <IconLabel
          icon={Eye}
          label={isPublic ? "Public" : "Private"}
          tone="muted"
          size="sm"
          iconClassName="mr-1"
        />

        <IconLabel
          icon={CalendarBlank}
          label={logCount}
          tone="muted"
          size="sm"
          iconClassName="mr-1"
        />
      </span>
    </button>
  );
};
MetricLibraryMobileCardBase.displayName = "MetricLibraryCard";

const MetricLibraryMobileCard = memo(MetricLibraryMobileCardBase);
MetricLibraryMobileCard.displayName = "MetricLibraryCard";
export default MetricLibraryMobileCard;
