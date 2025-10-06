import { PencilSimple } from "phosphor-react";
import { useState } from "react";

import { useMetricCategoryById } from "@/src/features/metric-categories/hooks";
import DataLabel from "@/ui/DataLabel";
import SkeletonLoader from "@/ui/SekeletonLoader";
import { formatDate } from "@/utils/helpers/dateHelper";
import { safeLabel } from "@/utils/helpers/labelHelper";

import MetricCategoryForm from "../MetricCategoryForm";

// TODO: (Question) Should use ViewModel instead as static params. Data should be fetched on main Page?
const MetricCategoryHeaderSection = ({ categoryId }: { categoryId: string }) => {
  const [modalOpen, setModalOpen] = useState(false);

  const { data: category, isLoading, error } = useMetricCategoryById(categoryId);

  const handleUpdateCategory = () => {
    setModalOpen(true);
  };

  if (isLoading) return <SkeletonLoader />;
  if (error) return <div>Error loading metric category details: {error.message}</div>;

  return (
    <>
      <MetricCategoryForm
        categoryId={category ? category.id : null}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialCategory={category ? category : null}
      />

      <section className="relative w-full rounded-2xl bg-white p-6 shadow">
        {/* Edit Button */}
        <button
          className="absolute right-5 top-5 rounded-full bg-[#F4C3CD] p-2 text-[#C76576] transition hover:bg-[#E897A3]"
          aria-label="Edit Metric"
          onClick={handleUpdateCategory}
        >
          <PencilSimple size={22} />
        </button>

        {/* Metric Title */}
        <DataLabel
          title="NAME"
          value={safeLabel(category?.name, "Not Set")}
          valueStyle="xl"
          className="mb-4"
        />

        {/* Metric Unit, Category, Visibility */}
        <div className="mb-4 flex content-start items-start justify-start gap-8 sm:flex-wrap lg:flex-row">
          <DataLabel title="COLOR" value={safeLabel(category?.color, "Not Set")} />

          <DataLabel title="ICON" value={safeLabel(category?.icon, "Not Set")} />
        </div>

        {/* Created/Updated At */}
        <div className="mt-3 flex gap-6 text-xs text-gray-400">
          <span>
            Created at&nbsp;
            {formatDate(category?.createdAt, true)}
          </span>
          <span>
            Updated at&nbsp;
            {formatDate(category?.updatedAt, true)}
          </span>
        </div>
      </section>
    </>
  );
};

export default MetricCategoryHeaderSection;
