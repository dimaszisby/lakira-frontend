"use client";

import { useRouter } from "next/navigation";
import { Bell, Calendar, PencilSimple, Presentation, Target } from "phosphor-react";
import { memo } from "react";

import { metricRoutes } from "@/lib/routes";
import Button from "@/ui/Button";
import Card, { CardContent, CardHeader, CardTitle } from "@/ui/Card";
import DataLabel from "@/ui/DataLabel";
import { formatHuman } from "@/utils/date-io";
import { safeLabel } from "@/utils/label";

import { useMetricDetail } from "./MetricDetailContext";

type MetricSettingsSectionProps = {
  panel?: string;
};

const MetricSettingsSectionBase = ({ panel }: MetricSettingsSectionProps) => {
  const router = useRouter();
  const { metricId, settings } = useMetricDetail();

  const handleEditClick = () => {
    router.push(`${metricRoutes.settings(metricId)}/edit`);
  };

  const goalSettingsSegment = (
    <Card variant={panel === "goal" ? "primary" : "secondary"} size="xs" className="flex flex-col">
      <CardHeader className="flex flex-row items-center gap-2">
        <Target size={20} weight="bold" />
        <CardTitle>Goal Settings</CardTitle>
      </CardHeader>

      <div className="flex flex-row flex-wrap px-4 pt-2">
        <DataLabel
          title="Goal Type"
          value={safeLabel(settings?.goalType, "Not Set")}
          className="flex-grow"
        />
        <DataLabel
          title="Goal Value"
          value={safeLabel(settings?.goalValue, "Not Set")}
          className="flex-grow"
        />
      </div>

      <div className="flex flex-row gap-4 pt-2">
        <Card variant="primary" size="xs" className="w-full">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Calendar size={18} weight="bold" />
            <CardTitle className="text-h6">Time Constraint</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-row flex-wrap">
            <DataLabel
              title="Start Date"
              value={safeLabel(formatHuman(settings?.startDate), "Not Set")}
              className="flex-grow"
            />
            <DataLabel
              title="Deadline Date"
              value={safeLabel(formatHuman(settings?.deadlineDate), "Not Set")}
              className="flex-grow"
            />
          </CardContent>
        </Card>

        <Card variant="primary" size="xs" className="w-full">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Bell size={18} weight="bold" />
            <CardTitle className="text-h6">Alert</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-row flex-wrap">
            <DataLabel
              title="Warn"
              value={safeLabel(settings?.alertThresholds)}
              className="flex-grow"
            />
            <DataLabel
              title="Alert"
              value={safeLabel(settings?.alertEnabled)}
              className="flex-grow"
            />
          </CardContent>
        </Card>
      </div>
    </Card>
  );

  const displayOptions = (
    <Card
      variant={panel === "display" ? "primary" : "secondary"}
      size="xs"
      className="flex flex-col"
    >
      <CardHeader className="flex flex-row items-center gap-2">
        <Presentation size={20} weight="bold" />
        <CardTitle>Display Options</CardTitle>
      </CardHeader>

      <Card
        variant="primary"
        size="xs"
        className="grid grid-flow-row grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-4"
      >
        <DataLabel
          title="Show on Dashboard"
          value={safeLabel(settings?.displayOptions?.showOnDashboard, "False")}
        />
        <DataLabel
          title="Priority"
          value={safeLabel(settings?.displayOptions?.priority, "Not Set")}
        />
        <DataLabel
          title="Chart Type"
          value={safeLabel(settings?.displayOptions?.chartType, "Default")}
        />
        <DataLabel title="Color" value={safeLabel(settings?.displayOptions?.color, "Default")} />
      </Card>
    </Card>
  );

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-h3">Metric Settings</CardTitle>
        <Button variant="tertiary" aria-label="Edit Metric Settings" onClick={handleEditClick}>
          <PencilSimple size={22} />
        </Button>
      </CardHeader>

      {goalSettingsSegment}
      {displayOptions}
    </Card>
  );
};
MetricSettingsSectionBase.displayName = "MetricSettingsSection";

const MetricSettingsSection = memo(MetricSettingsSectionBase);
MetricSettingsSection.displayName = "MetricSettingsSection";

export default MetricSettingsSection;
