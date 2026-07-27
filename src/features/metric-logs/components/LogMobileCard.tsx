import { Lightning } from "phosphor-react";
import { memo, useCallback } from "react";

import type { MetricLogVM } from "@/features/metric-logs/view-models";
import { formatHuman } from "@/utils/date-io";

interface LogMobileCardProps {
  log: MetricLogVM;
  onClick?: (log: MetricLogVM) => void;
}

const LogMobileCardBase = ({ log, onClick }: LogMobileCardProps) => {
  const { logValue, loggedAt } = log;
  const loggedAtLabel = formatHuman(loggedAt);

  const handleCardClick = useCallback(() => {
    onClick?.(log);
  }, [onClick, log]);

  return (
    <button
      type="button"
      onClick={handleCardClick}
      className="flex w-full flex-row flex-wrap justify-between gap-2 text-left"
      aria-label={`Open log from ${loggedAtLabel}`}
    >
      <span className="flex flex-row items-center gap-2">
        <Lightning size={18} weight="fill" className="text-status-warning" />
        <span>{loggedAtLabel}</span>
      </span>
      <span className="font-bold">{logValue}</span>
    </button>
  );
};

LogMobileCardBase.displayName = "LogMobileCard";

const LogMobileCard = memo(
  LogMobileCardBase,
  (prev, next) =>
    prev.log.id === next.log.id &&
    prev.log.logValue === next.log.logValue &&
    prev.log.loggedAt === next.log.loggedAt &&
    prev.onClick === next.onClick,
);
LogMobileCard.displayName = "LogMobileCard";
export default LogMobileCard;
