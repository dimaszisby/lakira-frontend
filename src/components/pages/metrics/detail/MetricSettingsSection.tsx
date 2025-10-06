import { PencilSimple } from "phosphor-react";
import { memo, useState } from "react";

import type { MetricSettingsExtendedVM } from "@/features/metric-settings/view-models";
import DataLabel from "@/ui/DataLabel";
import SectionCard from "@/ui/SectionCard";
import SubsectionCard from "@/ui/SubsectionCard";
import { formatDate } from "@/utils/helpers/dateHelper";
import { safeLabel } from "@/utils/helpers/labelHelper";

import MetricSettingsForm from "../MetricSettingsForm";

export const MetricSettingsSectionBase = ({ data }: { data: MetricSettingsExtendedVM }) => {
  const [modalOpen, setModalOpen] = useState(false);

  const handleModalOpen = () => {
    setModalOpen(true);
  };

  return (
    <>
      <MetricSettingsForm
        // key={modalOpen ? data?.id ?? "create" : "closed"}
        key={data?.id ?? `metric-${data.metricId}-create`}
        metricId={data.metricId}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialSettings={data}
      />

      <SectionCard
        title="Metric Settings"
        headerComponent={
          <div>
            {/* Edit Button */}
            <button
              className="flex w-full rounded-full bg-[#F4C3CD] p-2 text-[#C76576] transition hover:bg-[#E897A3]"
              aria-label="Edit Metric"
              onClick={handleModalOpen}
            >
              <PencilSimple size={22} />
            </button>
          </div>
        }
      >
        {/* Settings Segment */}
        <div className="flex-col">
          {/* Goal & Alert */}
          <div className="mb-2 grid grid-flow-col gap-2 rounded-xl">
            {/* Goal */}
            <SubsectionCard title="Goal Settings">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <DataLabel title="Goal Type" value={safeLabel(data?.goalType, "Not Set")} />
                <DataLabel title="Goal Value" value={safeLabel(data?.goalValue, "Not Set")} />
                <DataLabel
                  title="Start Date"
                  value={safeLabel(formatDate(data?.startDate), "Not Set")}
                />
                <DataLabel
                  title="Deadline Date"
                  value={safeLabel(formatDate(data?.deadlineDate), "Not Set")}
                />
              </div>
            </SubsectionCard>

            {/* Alert */}
            <SubsectionCard title="Alert Settings">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <DataLabel title="Warn" value={safeLabel(data?.alertThresholds)} />
                <DataLabel title="Alert" value={safeLabel(data?.alertEnabled)} />
              </div>
            </SubsectionCard>
          </div>

          {/* Display Options */}
          <SubsectionCard title="Display Options">
            <div className="wrap grid grid-flow-col gap-x-4 gap-y-2">
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
