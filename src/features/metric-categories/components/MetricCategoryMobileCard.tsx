import { useRouter } from "next/navigation";
import { memo, useCallback } from "react";

import type { MetricCategoryVM } from "@/features/metric-categories/view-models";

interface Props {
  category: MetricCategoryVM;
  onClick?: (metric: MetricCategoryVM) => void;
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
      className="flex flex-row items-center justify-between gap-2"
      aria-label={`Open category ${name}`}
    >
      <section className="flex w-full flex-row gap-4">
        <div className="flex flex-row items-center gap-2">
          <p className="relative bottom-0.5 line-clamp-1 inline-block max-w-full">{icon}</p>
        </div>

        <div className="flex flex-row items-center gap-2">
          <span
            className="border-1 relative inline-block h-5 w-5 rounded-full border-border"
            style={{ backgroundColor: color }}
            aria-label={color}
          />
        </div>

        <h6 className="line-clamp-1">{name}</h6>
      </section>

      <div className="flex flex-row items-center gap-2">
        <p className="text-overline">metrics</p>
        <p className="relative bottom-0.5 inline-block font-bold">{metricCount}</p>
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
