import type { MetricLogVM } from "@/src/features/metric-logs/view-models";
import { formatDate } from "@/utils/helpers/dateHelper";

/**
 * Renders a row in the metric table, with navigation to the metric detail page.
 * The entire row is clickable and accessible (keyboard navigation).
 */

interface LogTableRowProps {
  log: MetricLogVM;
  onClick?: (log: MetricLogVM) => void;
}

const LogTableRow: React.FC<LogTableRowProps> = ({ log, onClick }) => {
  return (
    <tr
      tabIndex={0}
      role="button"
      className="cursor-pointer bg-white transition hover:bg-gray-50"
      onClick={() => onClick?.(log)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick?.(log);
        }
      }}
      aria-label={`View details for ${log.loggedAt}`}
      data-testid={`metric-row-${log.id}`} // Optionally add data-testid for testing
    >
      {/* Log Date */}
      <td className="px-4 py-2 font-semibold">{formatDate(log.loggedAt, true)}</td>

      {/* Log Value */}
      <td className="max-w-xs truncate px-4 py-2 text-gray-500">
        {log.logValue ?? <span className="italic text-gray-400">No Description</span>}
      </td>
    </tr>
  );
};

export default LogTableRow;
