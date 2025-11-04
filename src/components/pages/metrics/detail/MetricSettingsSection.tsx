import { PencilSimple } from "phosphor-react";
import { memo, useState } from "react";

import MetricSettingsForm from "@/features/metric-settings/components/MetricSettingsForm";
import type { MetricSettingsExtendedVM } from "@/features/metric-settings/view-models";
import { formatHuman } from "@/src/utils/date-io";
import { safeLabel } from "@/src/utils/label";
import DataLabel from "@/ui/DataLabel";
import SectionCard from "@/ui/SectionCard";
import SubsectionCard from "@/ui/SubsectionCard";

type Props = {
  metricId: string;
  data: MetricSettingsExtendedVM | null;
};

export const MetricSettingsSectionBase = ({ metricId, data }: Props) => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      {modalOpen ? (
        <MetricSettingsForm
          metricId={metricId}
          onClose={() => setModalOpen(false)}
          initialSettings={data}
        />
      ) : null}

      <SectionCard
        title="Metric Settings"
        headerComponent={
          <div>
            {/* Edit Button */}
            <button
              className="flex w-full rounded-full bg-[#F4C3CD] p-2 text-[#C76576] transition hover:bg-[#E897A3]"
              aria-label="Edit Metric"
              onClick={() => setModalOpen(true)}
            >
              <PencilSimple size={22} />
            </button>
          </div>
        }
      >
        {/* Settings Segment */}
        <div className="flex w-full gap-2 bg-red-400">
          {/* Goals: Goal, Timeframe, Alert-treshold*/}
          <div className="h-auto w-1/2 flex-row space-y-2">
            <SubsectionCard title="Goal Settings">
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                <DataLabel title="Goal Type" value={safeLabel(data?.goalType, "Not Set")} />
                <DataLabel title="Goal Value" value={safeLabel(data?.goalValue, "Not Set")} />
                <DataLabel
                  title="Start Date"
                  value={safeLabel(formatHuman(data?.startDate), "Not Set")}
                />
                <DataLabel
                  title="Deadline Date"
                  value={safeLabel(formatHuman(data?.deadlineDate), "Not Set")}
                />
              </div>
            </SubsectionCard>

            <SubsectionCard title="Alert Settings">
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                <DataLabel title="Warn" value={safeLabel(data?.alertThresholds)} />
                <DataLabel title="Alert" value={safeLabel(data?.alertEnabled)} />
              </div>
            </SubsectionCard>
          </div>

          {/* Display Options */}
          <SubsectionCard title="Display Options" className="w-1/2">
            <div className="flex-row space-y-4">
              <DataLabel
                title="Show on Dashboard"
                value={safeLabel(data?.displayOptions?.showOnDashboard)}
              />
              <DataLabel title="Priority" value={safeLabel(data?.displayOptions?.priority)} />
              <DataLabel
                title="Chart Type"
                value={safeLabel(data?.displayOptions?.chartType, "Default")}
              />
              <DataLabel title="Color" value={safeLabel(data?.displayOptions?.color, "Default")} />
            </div>
          </SubsectionCard>
        </div>
      </SectionCard>
    </>
  );
};
MetricSettingsSectionBase.displayName = "MetricSettingsSection";

const MetricSettingsSection = memo(MetricSettingsSectionBase);
MetricSettingsSection.displayName = "MetricSettingsSection";
export default MetricSettingsSection;
