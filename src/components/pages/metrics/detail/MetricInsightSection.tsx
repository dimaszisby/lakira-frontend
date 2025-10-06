import classNames from "classnames";

import type { MetricLogResponseDTO } from "@/types/dtos/metric-log.dto";
import SectionCard from "@/ui/SectionCard";

/**
 * Metric insight (chart/aggregate stats) section.
 */

// TODO: Create a helper to check value if it's positive or negative

const MetricInsightSection: React.FC<{ logs: MetricLogResponseDTO[] }> = ({ logs }) => (
  <SectionCard
    title="Metric Insight"
    headerComponent={
      <div className="flex gap-8 text-xs">
        <StatInsight label="Overall" value="9%" positive />
        <StatInsight label="Average" value="4%" />
        <StatInsight label="Delta" value="4%" negative />
      </div>
    }
  >
    {/* Chart placeholder */}
    <div className="flex h-[240px] items-center justify-center rounded-lg bg-[#EDE8E4] text-gray-400">
      {/* Replace with Chart.js, recharts, etc */}
      <span>Data visualization coming soon…</span>
    </div>
  </SectionCard>
);

/** Stat widget for aggregate stats above the chart */
const StatInsight: React.FC<{
  label: string;
  value: string;
  positive?: boolean;
  negative?: boolean;
}> = ({ label, value, positive, negative }) => (
  <div className="flex min-w-[60px] flex-col items-center">
    <span className="font-bold uppercase tracking-wide text-gray-500">{label}</span>
    <span
      className={classNames(
        "font-bold text-lg text-gray-600",
        positive && "text-[#a8c28b]",
        negative && "text-[#e26d6d]",
      )}
    >
      {value}
    </span>
  </div>
);

export default MetricInsightSection;
