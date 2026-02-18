"use client";

import { useRouter } from "next/navigation";
import { memo, useCallback } from "react";

import type { MetricCategoryVM } from "@/features/metric-categories/view-models";
import { metricCategoryRoutes } from "@/lib/routes";

interface Props {
  category: MetricCategoryVM;
  onClick?: (metric: MetricCategoryVM) => void;
}

export const MetricCategoryMobileCardBase = ({ category, onClick }: Props) => {
  const router = useRouter();

  const { id, name, color, icon, metricCount } = category;
  const openLabel = `Open category ${name}`;
  const metricsLabel = `${metricCount} metrics`;

  const handleCardClick = useCallback(() => {
    if (onClick) return onClick(category); // prefer parent handler
    router.push(metricCategoryRoutes.detail(id)); // fallback behaviour
  }, [onClick, router, id, category]);

  return (
    <article className="w-full">
      <button
        type="button"
        onClick={handleCardClick}
        className="flex w-full flex-row items-center justify-between gap-2"
        aria-label={openLabel}
      >
        <span className="flex w-full flex-row gap-4">
          <span className="flex flex-row items-center gap-2">
            <span className="relative bottom-0.5 line-clamp-1 inline-block max-w-full">{icon}</span>
          </span>

          <span className="flex flex-row items-center gap-2">
            <span
              className="relative inline-block h-5 w-5 rounded-full border border-border"
              style={{ backgroundColor: color }}
              aria-hidden="true"
            />
          </span>

          <span className="line-clamp-1 font-medium">{name}</span>
        </span>

        <span className="flex flex-row items-center gap-2">
          <span className="text-overline">metrics</span>
          <span className="relative bottom-0.5 inline-block font-bold" aria-label={metricsLabel}>
            {metricCount}
          </span>
        </span>
      </button>
    </article>
  );
};
MetricCategoryMobileCardBase.displayName = "MetricCategoryMobileCard";

const MetricCategoryMobileCard = memo(MetricCategoryMobileCardBase);
MetricCategoryMobileCard.displayName = "MetricCategoryMobileCard";
export default MetricCategoryMobileCard;
