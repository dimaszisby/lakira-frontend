import { memo, useCallback } from "react";

import type { MetricLogVM } from "@/src/features/metric-logs/view-models";

interface LogMobileCardProps {
  log: MetricLogVM;
  onClick?: (log: MetricLogVM) => void;
}

const LogMobileCard = memo(
  ({ log, onClick }: LogMobileCardProps) => {
    const { logValue, loggedAt } = log;

    const handleCardClick = useCallback(() => {
      if (onClick) return onClick(log); // prefer parent handler
    }, [onClick, log]);

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
        <span className="text-base font-semibold text-gray-900">{loggedAt}</span>

        <span className="text-sm font-regular text-gray-500">{logValue}</span>
      </div>
    );
  },
  (prev, next) => prev.log.id === next.log.id && prev.onClick === next.onClick,
);

LogMobileCard.displayName = "MetricCategoryMobileCard";

export default LogMobileCard;
