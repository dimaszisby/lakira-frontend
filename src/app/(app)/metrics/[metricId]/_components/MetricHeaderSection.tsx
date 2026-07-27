"use client";

import { useRouter } from "next/navigation";
import { Eye, EyeSlash, PencilSimple } from "phosphor-react";
import { memo } from "react";

import CategoryChip from "@/features/metric-categories/components/CategoryChip";
import { toCategoryUI } from "@/features/metric-categories/presenters/toCategoryUI";
import { metricRoutes } from "@/lib/routes";
import { fromDetail } from "@/features/metrics";
import Button from "@/ui/Button";
import Card from "@/ui/Card";
import DataLabel from "@/ui/DataLabel";
import IconLabel from "@/ui/IconLabel";
import { formatHuman } from "@/utils/date-io";
import { safeLabel } from "@/utils/label";

import { useMetricDetail } from "./MetricDetailContext";

const MetricHeaderSectionBase = () => {
  const router = useRouter();
  const { header } = useMetricDetail();

  const initialMetric = fromDetail(header);
  const category = toCategoryUI(initialMetric.category);

  const handleEditClick = () => {
    router.push(metricRoutes.modal.edit(header.id));
  };

  return (
    <Card className="relative w-full">
      <Button
        className="absolute right-5 top-5"
        variant="tertiary"
        aria-label="Edit Metric"
        onClick={handleEditClick}
      >
        <PencilSimple size={22} />
      </Button>

      <DataLabel
        title="Metric Name"
        value={safeLabel(header.name, "Not Set")}
        size="lg"
        className="mb-4"
      />

      <div className="mb-4 flex flex-wrap content-start items-start justify-start gap-8 sm:gap-8 lg:gap-12">
        <DataLabel title="Default Unit" value={safeLabel(header.defaultUnit, "Not Set")} />
        <DataLabel
          title="Category"
          value={safeLabel(header.category?.name, "Not Set")}
          renderValue={<CategoryChip category={category} />}
        />
        <DataLabel
          title="Visibility"
          value={safeLabel(header.isPublic, "Not Set")}
          renderValue={
            <IconLabel
              icon={header.isPublic ? Eye : EyeSlash}
              label={header.isPublic ? "Public" : "Private"}
              tone={header.isPublic ? "success" : "danger"}
              size="md"
            />
          }
        />
      </div>

      <DataLabel
        title="Description"
        value={safeLabel(header.description, "No Description Provided")}
        size="sm"
      />

      <div className="flex flex-row gap-4 text-caption">
        <span>
          Created at&nbsp;
          {formatHuman(header.createdAt)}
        </span>
        <span>
          Updated at&nbsp;
          {formatHuman(header.updatedAt)}
        </span>
      </div>
    </Card>
  );
};
MetricHeaderSectionBase.displayName = "MetricHeaderSection";

const MetricHeaderSection = memo(MetricHeaderSectionBase);
MetricHeaderSection.displayName = "MetricHeaderSection";

export default MetricHeaderSection;
