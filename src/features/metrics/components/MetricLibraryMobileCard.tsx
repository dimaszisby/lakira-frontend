import { useRouter } from "next/navigation";
import { CalendarBlank, Eye, Tag } from "phosphor-react";
import { memo, useCallback } from "react";

import CategoryChip from "@/features/metric-categories/components/CategoryChip";
import { toCategoryUI } from "@/src/features/metric-categories/presenters/toCategoryUI";
import type { MetricPreviewVM } from "@/src/features/metrics/view-models";
import IconLabel from "@/ui/IconLabel";

export interface MetricLibraryCardProps {
  metric: MetricPreviewVM;
  onClick?: (metric: MetricPreviewVM) => void;
}

export const MetricLibraryMobileCardBase = ({ metric, onClick }: MetricLibraryCardProps) => {
  const router = useRouter();
  const { id, name, defaultUnit, isPublic, category, logCount } = metric;

  // * Sizing
  // Trim to avoid overflow
  // const maxDescriptionLength = 100;
  // const truncatedDescription =
  //   displayDescription.length > maxDescriptionLength
  //     ? `${displayDescription.slice(0, maxDescriptionLength)}…`
  //     : displayDescription;

  // * Handler
  const handleCardClick = useCallback(() => {
    if (onClick) return onClick(metric); // prefer parent handler
    router.push(`/metrics/${id}`); // fallback behaviour
  }, [onClick, router, id, metric]);

  const categoryUI = toCategoryUI(category);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
      // className="cursor-pointer flex items-center p-4 bg-gray-500 rounded-2xl shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      className=""
      aria-label={`Open metric ${name}`}
    >
      {/* Metric name */}
      <span className="truncate text-lg font-semibold" title={name}>
        {name}
      </span>

      {/* Metric description */}
      {/* <span
          className="text-sm text-gray-600 truncate"
          title={displayDescription}
        >
          {truncatedDescription}
        </span> */}

      <div className="mt-2 flex items-center justify-between">
        <span>
          <CategoryChip category={categoryUI} />
        </span>

        {/* Default Unit */}
        <span>
          <IconLabel
            icon={Tag}
            label={defaultUnit ?? "-"}
            tone="muted"
            size="sm"
            iconClassName="mr-1"
          />
        </span>

        {/* Visibility */}
        <span>
          <IconLabel
            icon={Eye}
            label={isPublic ? "Public" : "Private"}
            tone="muted"
            size="sm"
            iconClassName="mr-1"
          />
        </span>

        {/* Log Count */}
        <span>
          <IconLabel
            icon={CalendarBlank}
            label={logCount}
            tone="muted"
            size="sm"
            iconClassName="mr-1"
          />
        </span>
      </div>
    </div>
  );
};
MetricLibraryMobileCardBase.displayName = "MetricLibraryCard";

const MetricLibraryMobileCard = memo(
  MetricLibraryMobileCardBase,
  (prev, next) => prev.metric.id === next.metric.id && prev.onClick === next.onClick,
);
MetricLibraryMobileCard.displayName = "MetricLibraryCard";
export default MetricLibraryMobileCard;
