import { memo, useCallback } from "react";
import { MetricLogResponseDTO } from "@/src/types/dtos/metric-log.dto";

interface LogMobileCardProps {
  log: MetricLogResponseDTO;
  onClick?: (log: MetricLogResponseDTO) => void;
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
        <span className="text-gray-900 text-base font-semibold">
          {loggedAt}
        </span>

        <span className="text-gray-500 text-sm font-regular">{logValue}</span>
      </div>
    );
  },
  (prev, next) => prev.log.id === next.log.id && prev.onClick === next.onClick
);

LogMobileCard.displayName = "MetricCategoryMobileCard";

export default LogMobileCard;
