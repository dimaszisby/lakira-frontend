import { Bell, Calendar, PencilSimple, Presentation, Target } from "phosphor-react";
import { memo, useState } from "react";

import MetricSettingsForm from "@/features/metric-settings/components/MetricSettingsForm";
import type { MetricSettingsExtendedVM } from "@/features/metric-settings/view-models";
import Button from "@/ui/Button";
import Card, { CardContent, CardHeader, CardTitle } from "@/ui/Card";
import DataLabel from "@/ui/DataLabel";
import { formatHuman } from "@/utils/date-io";
import { safeLabel } from "@/utils/label";

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

      <Card className="flex flex-col ">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-h3">Metric Setting</CardTitle>
          <Button
            variant="tertiary"
            aria-label="Edit Metric Settings"
            onClick={() => setModalOpen(true)}
          >
            <PencilSimple size={22} />
          </Button>
        </CardHeader>

        <div className="flex w-full flex-row flex-wrap gap-4">
          {/* Goals: Goal, Timeframe, Alert-treshold*/}
          <Card variant="secondary" size="xs" className="flex h-fit flex-auto flex-col">
            <CardHeader className="flex flex-row items-center gap-2">
              <Target size={20} weight="bold" />
              <CardTitle>Goal Settings</CardTitle>
            </CardHeader>
            <Card variant="primary" size="xs" className="flex flex-auto flex-col">
              <div className="flex flex-row flex-wrap px-4">
                <DataLabel
                  title="Goal Type"
                  value={safeLabel(data?.goalType, "Not Set")}
                  className="flex-grow"
                />
                <DataLabel
                  title="Goal Value"
                  value={safeLabel(data?.goalValue, "Not Set")}
                  className="flex-grow"
                />
              </div>

              <Card variant="secondary" size="xs">
                <CardHeader className="flex flex-row items-center gap-2">
                  <Calendar size={18} weight="bold" />
                  <CardTitle className="text-h6">Time Constraint</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-row flex-wrap">
                  <DataLabel
                    title="Start Date"
                    value={safeLabel(formatHuman(data?.startDate), "Not Set")}
                    className="flex-grow"
                  />
                  <DataLabel
                    title="Deadline Date"
                    value={safeLabel(formatHuman(data?.deadlineDate), "Not Set")}
                    className="flex-grow"
                  />
                </CardContent>
              </Card>

              <Card variant="secondary" size="xs">
                <CardHeader className="flex flex-row items-center gap-2">
                  <Bell size={18} weight="bold" />
                  <CardTitle className="text-h6">Alert</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-row flex-wrap">
                  <DataLabel
                    title="Warn"
                    value={safeLabel(data?.alertThresholds)}
                    className="flex-grow"
                  />
                  <DataLabel
                    title="Alert"
                    value={safeLabel(data?.alertEnabled)}
                    className="flex-grow"
                  />
                </CardContent>
              </Card>
            </Card>
          </Card>

          {/* Display Options */}
          <Card variant="secondary" size="xs" className="flex h-fit flex-auto">
            <CardHeader className="flex flex-row items-center gap-2">
              <Presentation size={20} weight="bold" />
              <CardTitle>Display Options</CardTitle>
            </CardHeader>
            <Card variant="primary" size="xs" className="grid grid-flow-row grid-cols-2 flex-wrap">
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
            </Card>
          </Card>
        </div>
      </Card>
    </>
  );
};
MetricSettingsSectionBase.displayName = "MetricSettingsSection";

const MetricSettingsSection = memo(MetricSettingsSectionBase);
MetricSettingsSection.displayName = "MetricSettingsSection";
export default MetricSettingsSection;
