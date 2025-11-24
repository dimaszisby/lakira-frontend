import { Lightning } from "phosphor-react";
import { memo, useCallback } from "react";

import type { MetricLogVM } from "@/src/features/metric-logs/view-models";

interface LogMobileCardProps {
  log: MetricLogVM;
  onClick?: (log: MetricLogVM) => void;
}

const LogMobileCardBase = ({ log, onClick }: LogMobileCardProps) => {
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
      className="flex flex-row flex-wrap justify-between"
      aria-label={`Open category ${name}`}
    >
      <section className="flex flex-row items-center gap-2">
        <Lightning size={18} weight="fill" className="text-status-warning" />
        <p>{loggedAt}</p>
      </section>
      <h6 className="font-bold">{logValue}</h6>
    </div>
  );
};

LogMobileCardBase.displayName = "MetricCategoryMobileCard";

const LogMobileCard = memo(
  LogMobileCardBase,
  (prev, next) => prev.log.id === next.log.id && prev.onClick === next.onClick,
);
LogMobileCard.displayName = "MetricCategoryMobileCard";
export default LogMobileCard;
