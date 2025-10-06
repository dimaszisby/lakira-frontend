import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import {
  useCreateMetricCategory,
  useDeleteMetricCategory,
  useUpdateMetricCategory,
} from "@/features/metric-categories/hooks";
import type { MetricCategoryFormInput } from "@/features/metric-categories/types";
import { metricCategoryFormSchema } from "@/features/metric-categories/types";
import { CATEGORY_DEFAULTS } from "@/src/features/metric-categories/constants";
import type { MetricCategoryVM } from "@/src/features/metric-categories/view-models";
import type { CreateMetricCategoryRequestDTO } from "@/types/dtos/metric-category.dto";
import ErrorMessage from "@/ui/ErrorMessage";
import Modal from "@/ui/Modal";
import PrimaryButton from "@/ui/PrimaryButton";
import ReusableFormField from "@/ui/ReusableFormField";

// TODO: Create Color Picker component

interface Props {
  open: boolean;
  onClose: () => void;
  categoryId: string | null;
  initialCategory: MetricCategoryVM | null;
}

const MetricCategoryForm = ({ open, onClose, categoryId, initialCategory }: Props) => {
  const isEditMode = !!initialCategory;

  const makeDefaults = (m: MetricCategoryVM | null): CreateMetricCategoryRequestDTO => ({
    name: m?.name ?? "",
    color: m?.color ?? CATEGORY_DEFAULTS.color,
    icon: m?.icon ?? CATEGORY_DEFAULTS.icon,
  });

  // * Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
    setValue,
  } = useForm<CreateMetricCategoryRequestDTO>({
    resolver: zodResolver(metricCategoryFormSchema),
    mode: "onChange",
    defaultValues: makeDefaults(initialCategory),
  });

  useEffect(() => {
    if (open && isEditMode && initialCategory) {
      setValue("name", initialCategory?.name ?? "");
      setValue("color", initialCategory?.color ?? CATEGORY_DEFAULTS.color);
      setValue("icon", initialCategory?.icon ?? CATEGORY_DEFAULTS.icon);
    }
  }, [open, isEditMode, initialCategory, categoryId, setValue, reset]);

  // * Mutation Hooks
  const {
    createMetricCategory,
    isPending: isCreating,
    error: createError,
  } = useCreateMetricCategory();

  const {
    updateMetricCategory,
    isPending: isUpdating,
    error: updateError,
  } = useUpdateMetricCategory();

  const {
    deleteMetricCategory,
    isPending: isDeleting,
    error: deleteError,
  } = useDeleteMetricCategory();

  // * Handlers
  const onSubmit = async (data: MetricCategoryFormInput) => {
    if (!isValid) {
      console.warn("Form is not valid, preventing submission.");
      return;
    }

    try {
      if (isEditMode && initialCategory && categoryId) {
        await updateMetricCategory({ categoryId: categoryId, category: data });
      } else {
        await createMetricCategory(data);
      }
      reset();
      onClose();
    } catch (error) {
      console.error("Error creating metric log:", error);
    }
  };

  const onDeleteSubmit = async () => {
    if (!initialCategory) return;
    try {
      await deleteMetricCategory(initialCategory.id);
      reset();
      onClose();
    } catch (error) {
      console.error("Error deleting metric log:", error);
    }
  };

  // * Computed Value
  const errorMsg = createError?.message || updateError?.message || deleteError?.message || "";

  return (
    <Modal isOpen={open} onClose={onClose}>
      <form
        className="mx-auto min-w-96 max-w-lg bg-white p-4 sm:p-4 lg:p-6"
        onSubmit={
          void handleSubmit((data) => {
            if (Object.keys(errors).length > 0) {
              console.warn("Form has errors, preventing submission.");
              return;
            }
            void onSubmit(data);
          })
        }
      >
        <h2 className="mb-4 text-xl font-semibold">Manage Category</h2>

        {/* Error Message */}
        <ErrorMessage message={errorMsg}></ErrorMessage>

        <ul className="flex flex-col gap-4 sm:gap-4 lg:gap-6">
          <ReusableFormField
            label="Name"
            type="text"
            register={register("name")}
            placeholder="i.e Muscle Group Growth"
            isSubmitting={isSubmitting || isCreating || isUpdating}
          />

          <span className="flex gap-4 sm:gap-4 lg:gap-6">
            <ReusableFormField
              label="Icon"
              type="text"
              register={register("icon")}
              placeholder="e.g., km, reps, hours"
              error={errors.icon?.message}
              isSubmitting={isSubmitting || isCreating || isUpdating}
            />

            <ReusableFormField
              label="color"
              type="text"
              register={register("color")}
              placeholder="#000000"
              error={errors.color?.message}
              isSubmitting={isSubmitting || isCreating || isUpdating}
            />
          </span>
        </ul>

        {/* Buttons */}
        <ul className="lg:gap-6c mt-12 flex-row gap-4 sm:gap-4">
          <PrimaryButton type="submit" disabled={isSubmitting || !isValid} className="w-full">
            {isSubmitting || isCreating || isUpdating ? "Saving..." : isEditMode ? "Save" : "Add"}
          </PrimaryButton>

          {/* Delete button (edit mode only) */}
          {isEditMode ? (
            <>
              <hr style={{ borderTop: "1px solid lightgrey" }} className="my-4" />
              <button
                type="button"
                className="w-full rounded-xl bg-red-50 px-4 py-2 text-red-500 hover:bg-red-100"
                onClick={void onDeleteSubmit}
                disabled={isSubmitting || isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Category"}
              </button>
            </>
          ) : null}
        </ul>
      </form>
    </Modal>
  );
};

export default MetricCategoryForm;
