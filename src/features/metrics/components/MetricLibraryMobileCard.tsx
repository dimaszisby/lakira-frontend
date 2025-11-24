import { useRouter } from "next/navigation";
import { CalendarBlank, Eye, Tag } from "phosphor-react";
import { memo, useCallback } from "react";

import CategoryChip from "@/features/metric-categories/components/CategoryChip";
import { toCategoryUI } from "@/features/metric-categories/presenters/toCategoryUI";
import type { MetricPreviewVM } from "@/features/metrics/view-models";
import IconLabel from "@/ui/IconLabel";

export interface MetricLibraryCardProps {
  metric: MetricPreviewVM;
  onClick?: (metric: MetricPreviewVM) => void;
}

export const MetricLibraryMobileCardBase = ({ metric, onClick }: MetricLibraryCardProps) => {
  const router = useRouter();
  const { id, name, defaultUnit, isPublic, category, logCount } = metric;

  // Handler
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
      className="flex flex-col gap-2"
      aria-label={`Open metric ${name}`}
    >
      <h6 className="line-clamp-1" title={name}>
        {name}
      </h6>

      <div className="flex items-center justify-between">
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
