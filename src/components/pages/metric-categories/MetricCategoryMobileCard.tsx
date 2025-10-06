import { useRouter } from "next/navigation";
import { memo, useCallback } from "react";

import type { MetricCategoryResponseDTO } from "@/types/dtos/metric-category.dto";
import OverlineLabel from "@/ui/OverlineLabel";

interface Props {
  category: MetricCategoryResponseDTO;
  onClick?: (metric: MetricCategoryResponseDTO) => void;
}

export const MetricCategoryMobileCardBase = ({ category, onClick }: Props) => {
  const router = useRouter();

  const { id, name, color, icon, metricCount } = category;

  const handleCardClick = useCallback(() => {
    if (onClick) return onClick(category); // prefer parent handler
    router.push(`/metric-categories/${id}`); // fallback behaviour
  }, [onClick, router, id, category]);

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
      aria-label={`Open category ${name}`}
    >
      <div>
        <span className="mb-2 inline-block text-base font-semibold text-gray-900">{name}</span>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <OverlineLabel text="Icon"></OverlineLabel>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200">
              {icon}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <OverlineLabel text="Color"></OverlineLabel>
            <span
              className="inline-block h-6 w-6 rounded-full border-2 border-gray-200"
              style={{ backgroundColor: color }}
              aria-label={color}
            />
          </div>

          <div className="flex items-center gap-2">
            <OverlineLabel text="metrics"></OverlineLabel>
            <span className="text-sm font-semibold text-gray-500">{metricCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
MetricCategoryMobileCardBase.displayName = "MetricCategoryMobileCard";

const MetricCategoryMobileCard = memo(
  MetricCategoryMobileCardBase,
  (prev, next) => prev.category.id === next.category.id && prev.onClick === next.onClick,
);
MetricCategoryMobileCard.displayName = "MetricCategoryMobileCard";
export default MetricCategoryMobileCard;
