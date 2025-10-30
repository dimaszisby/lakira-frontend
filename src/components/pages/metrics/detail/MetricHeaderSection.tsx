import { PencilSimple } from "phosphor-react";
import { memo, useState } from "react";

import { fromDetail } from "@/features/metrics";
import MetricForm from "@/features/metrics/components/MetricForm";
import type { MetricHeaderVM } from "@/features/metrics/view-models";
import DataLabel from "@/ui/DataLabel";
import { formatDate } from "@/utils/helpers/dateHelper";
import { safeLabel } from "@/utils/helpers/labelHelper";

export const MetricHeaderSectionBase = ({ data }: { data: MetricHeaderVM }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const initialMetric = fromDetail(data);

  return (
    <>
      {modalOpen ? (
        <MetricForm onClose={() => setModalOpen(false)} initialMetric={initialMetric} />
      ) : null}

      <section className="relative w-full rounded-2xl bg-white p-6 shadow">
        {/* Edit Button */}
        <button
          className="absolute right-5 top-5 rounded-full bg-[#F4C3CD] p-2 text-[#C76576] transition hover:bg-[#E897A3]"
          aria-label="Edit Metric"
          onClick={() => setModalOpen(true)}
        >
          <PencilSimple size={22} />
        </button>

        {/* Metric Title */}
        <DataLabel
          title="Metric Name"
          value={safeLabel(data?.name, "Not Set")}
          size="lg"
          className="mb-4"
        />

        {/* Metric Unit, Category, Visibility */}
        <div className="mb-4 flex content-start items-start justify-start gap-8 sm:flex-wrap lg:flex-row">
          <DataLabel title="Default Unit" value={safeLabel(data?.defaultUnit, "Not Set")} />
          <DataLabel
            title="Category"
            value={safeLabel(data?.category?.name, "Not Set")}
            renderValue={
              <span className={`block rounded-xl bg-gray-200 px-3  py-1`}>
                {data.category ? data.category.name : "No Category"}
              </span>
            }
          />
          <DataLabel
            title="Visibility"
            value={safeLabel(data?.isPublic, "Not Set")}
            renderValue={
              <div className={data.isPublic ? "text-green-600" : "text-red-600"}>
                {data.isPublic ? "Public" : "Private"}
              </div>
            }
          />
        </div>
        <DataLabel
          title="Description"
          value={safeLabel(data?.description, "Not Description Provided")}
          size="sm"
        />

        {/* Created/Updated At */}
        <div className="mt-3 flex gap-6 text-xs text-gray-400">
          <span>
            Created at&nbsp;
            {formatDate(data?.createdAt, true)}
          </span>
          <span>
            Updated at&nbsp;
            {formatDate(data?.updatedAt, true)}
          </span>
        </div>
      </section>
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
