import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useId, useMemo } from "react";
import { useForm } from "react-hook-form";

import { CATEGORY_DEFAULTS } from "@/features/metric-categories/constants";
import {
  useCreateMetricCategory,
  useDeleteMetricCategory,
  useUpdateMetricCategory,
} from "@/features/metric-categories/hooks/index";
import type { MetricCategoryFormInput } from "@/features/metric-categories/types";
import { metricCategoryFormSchema } from "@/features/metric-categories/types";
import type { MetricCategoryVM } from "@/features/metric-categories/view-models";
import type { CreateMetricCategoryRequestDTO } from "@/types/dtos/metric-category.dto";
import ErrorMessage from "@/ui/ErrorMessage";
import Modal from "@/ui/Modal";
import PrimaryButton from "@/ui/PrimaryButton";
import TextField from "@/ui/TextField";

// TODO: Create a proper Color Picker component then refactorizes

interface Props {
  open: boolean;
  onClose: () => void;
  initialCategory: MetricCategoryVM | null;
}

const MetricCategoryForm = ({ open, onClose, initialCategory }: Props) => {
  const isEditMode = !!initialCategory;

  // Form Defaults handling
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
  } = useForm<CreateMetricCategoryRequestDTO>({
    resolver: zodResolver(metricCategoryFormSchema),
    mode: "onChange",
    defaultValues: makeDefaults(initialCategory),
  });

  // * Rehydrate
  // Field: Build unique ids per field -> prevents collisions if multiple forms render
  const uid = useId();
  const fieldId = (name: string) => `category-${uid}-${name}`;

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

  const isBusyInputs = isSubmitting || isCreating || isUpdating || isDeleting;

  // * Handlers
  const onValid = useCallback(
    async (data: MetricCategoryFormInput) => {
      try {
        if (isEditMode && initialCategory) {
          await updateMetricCategory({ categoryId: initialCategory.id, category: data });
        } else {
          await createMetricCategory(data);
        }

        reset();
        onClose();
      } catch (error) {
        console.error("Error creating metric log:", error);
      }
    },
    [initialCategory, isEditMode, updateMetricCategory, createMetricCategory, reset, onClose],
  );

  const onInvalid = useCallback((formErrors: typeof errors) => {
    console.warn("Form has errors, preventing submission.", formErrors);
  }, []);

  const onSubmitForm = useMemo(
    () => handleSubmit(onValid, onInvalid),
    [handleSubmit, onValid, onInvalid],
  );

  const handleFormSubmit: React.FormEventHandler<HTMLFormElement> = useCallback(
    (e) => {
      void onSubmitForm(e); // forward the event -> RHF will call preventDefault()
    },
    [onSubmitForm],
  );

  // Delete handler
  const deleteCategoryAsync = useCallback(async () => {
    if (!initialCategory) return;
    try {
      await deleteMetricCategory(initialCategory.id);
      reset();
      onClose();
    } catch (error) {
      console.error("Error deleting metric log:", error);
    }
  }, [initialCategory, deleteMetricCategory, reset, onClose]);

  const handleDeleteClick = useCallback(() => {
    void deleteCategoryAsync();
  }, [deleteCategoryAsync]);

  // Computed Value
  const errorMsg = createError?.message || updateError?.message || deleteError?.message || "";

  return (
    <Modal isOpen={open} onClose={onClose}>
      {open ? (
        <form
          key={initialCategory?.id ?? "create"}
          noValidate
          className="mx-auto min-w-96 max-w-lg bg-white p-4 sm:p-4 lg:p-6"
          onSubmit={handleFormSubmit}
        >
          <h2 className="mb-4 text-xl font-semibold">Manage Category</h2>

          {/* Error Message */}
          <ErrorMessage message={errorMsg}></ErrorMessage>

          <ul className="flex flex-col gap-4 sm:gap-4 lg:gap-6">
            <TextField
              id={fieldId("name")}
              label="Name"
              type="text"
              registration={register("name")}
              placeholder="i.e Muscle Group Growth"
              error={errors.name?.message}
              disabled={isBusyInputs}
              required
            />

            <span className="flex gap-4 sm:gap-4 lg:gap-6">
              <TextField
                id={fieldId("icon")}
                label="Icon"
                type="text"
                registration={register("icon")}
                placeholder="e.g., km, reps, hours"
                error={errors.icon?.message}
                disabled={isBusyInputs}
              />

              <TextField
                id={fieldId("color")}
                label="color"
                type="text"
                registration={register("color")}
                placeholder="#000000"
                error={errors.color?.message}
                disabled={isBusyInputs}
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
              <ul>
                <hr style={{ borderTop: "1px solid lightgrey" }} className="my-4" />
                <button
                  type="button"
                  className="w-full rounded-xl bg-red-50 px-4 py-2 text-red-500 hover:bg-red-100"
                  onClick={handleDeleteClick}
                  disabled={isSubmitting || isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete Category"}
                </button>
              </ul>
            ) : null}
          </ul>
        </form>
      ) : null}
    </Modal>
  );
};

export default MetricCategoryForm;
