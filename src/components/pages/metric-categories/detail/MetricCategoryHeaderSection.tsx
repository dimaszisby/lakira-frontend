import { PencilSimple } from "phosphor-react";
import { useState } from "react";

import MetricCategoryForm from "@/features/metric-categories/components/MetricCategoryForm";
import { useMetricCategoryById } from "@/features/metric-categories/hooks/index";
import { formatHuman } from "@/src/utils/date-io";
import { safeLabel } from "@/src/utils/label";
import DataLabel from "@/ui/DataLabel";
import SkeletonLoader from "@/ui/SekeletonLoader";

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
      {modalOpen ? (
        <MetricCategoryForm
          onClose={() => setModalOpen(false)}
          initialCategory={category ? category : null}
        />
      ) : null}

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
          size="lg"
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
            {formatHuman(category?.createdAt)}
          </span>
          <span>
            Updated at&nbsp;
            {formatHuman(category?.updatedAt)}
          </span>
        </div>
      </section>
    </>
  );
};

export default MetricCategoryHeaderSection;
