"use client";

import { Eye, EyeSlash, PencilSimple } from "phosphor-react";
import { memo, useState } from "react";

import CategoryChip from "@/features/metric-categories/components/CategoryChip";
import { toCategoryUI } from "@/features/metric-categories/presenters/toCategoryUI";
import { fromDetail } from "@/features/metrics";
import MetricForm from "@/features/metrics/components/MetricForm";
import type { MetricHeaderVM } from "@/features/metrics/view-models";
import Button from "@/ui/Button";
import Card from "@/ui/Card";
import DataLabel from "@/ui/DataLabel";
import IconLabel from "@/ui/IconLabel";
import { formatHuman } from "@/utils/date-io";
import { safeLabel } from "@/utils/label";

export const MetricHeaderSectionBase = ({ data }: { data: MetricHeaderVM }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const initialMetric = fromDetail(data);

  const category = toCategoryUI(initialMetric.category);

  return (
    <>
      {modalOpen ? (
        <MetricForm onClose={() => setModalOpen(false)} initialMetric={initialMetric} />
      ) : null}

      <Card className="relative w-full">
        {/* Edit Button */}
        <Button
          className="absolute right-5 top-5"
          variant="tertiary"
          aria-label="Edit Metric"
          onClick={() => setModalOpen(true)}
        >
          <PencilSimple size={22} />
        </Button>

        {/* Metric Title */}
        <DataLabel
          title="Metric Name"
          value={safeLabel(data?.name, "Not Set")}
          size="lg"
          className="mb-4"
        />

        {/* Metric Unit, Category, Visibility */}
        <div className="mb-4 flex flex-wrap content-start items-start justify-start gap-8 sm:gap-8 lg:gap-12">
          <DataLabel title="Default Unit" value={safeLabel(data?.defaultUnit, "Not Set")} />
          <DataLabel
            title="Category"
            value={safeLabel(data?.category?.name, "Not Set")}
            renderValue={<CategoryChip category={category}></CategoryChip>}
          />
          <DataLabel
            title="Visibility"
            value={safeLabel(data?.isPublic, "Not Set")}
            renderValue={
              <IconLabel
                icon={data.isPublic ? Eye : EyeSlash}
                label={data.isPublic ? "Public" : "Private"}
                tone={data.isPublic ? "success" : "danger"}
                size="md"
              />
            }
          />
        </div>
        <DataLabel
          title="Description"
          value={safeLabel(data?.description, "Not Description Provided")}
          size="sm"
        />

        {/* Created/Updated At */}
        <div className="flex flex-row gap-4 text-caption">
          <span>
            Created at&nbsp;
            {formatHuman(data?.createdAt)}
          </span>
          <span>
            Updated at&nbsp;
            {formatHuman(data?.updatedAt)}
          </span>
        </div>
      </Card>
    </>
  );
};
MetricHeaderSectionBase.displayName = "MetricHeaderSection";

const MetricHeaderSection = memo(
  MetricHeaderSectionBase,
  (a, b) => Object.is(a.data?.id, b.data?.id) && a.data?.updatedAt === b.data?.updatedAt,
);
MetricHeaderSection.displayName = "MetricHeaderSection";
export default MetricHeaderSection;
