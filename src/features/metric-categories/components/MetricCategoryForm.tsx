import { zodResolver } from "@hookform/resolvers/zod";
import { FloppyDisk, Folder, Trash } from "phosphor-react";
import { useCallback, useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";

import { CATEGORY_DEFAULTS } from "@/features/metric-categories/constants";
import {
  useCreateMetricCategory,
  useDeleteMetricCategory,
  useUpdateMetricCategory,
} from "@/features/metric-categories/hooks/index";
import type { MetricCategoryFormInput } from "@/features/metric-categories/types";
import { metricCategoryFormSchema } from "@/features/metric-categories/types";
import type { MetricCategoryVM } from "@/features/metric-categories/view-models";
import { cn } from "@/src/lib/cn";
import type { CreateMetricCategoryRequestDTO } from "@/types/dtos/metric-category.dto";
import Button from "@/ui/Button";
import ColorField from "@/ui/ColorField";
import ErrorMessage from "@/ui/ErrorMessage";
import { FormField } from "@/ui/FormField";
import Modal from "@/ui/Modal";
import TextField from "@/ui/TextField";

interface Props {
  onClose: () => void;
  initialCategory: MetricCategoryVM | null;
}

const MetricCategoryForm = ({ onClose, initialCategory }: Props) => {
  const isEditMode = !!initialCategory;

  // * Form
  const makeDefaults = useCallback(
    (m: MetricCategoryVM | null): CreateMetricCategoryRequestDTO => ({
      name: m?.name ?? "",
      color: m?.color ?? CATEGORY_DEFAULTS.color,
      icon: m?.icon ?? CATEGORY_DEFAULTS.icon,
    }),
    [],
  );

  const defaults = useMemo(() => makeDefaults(initialCategory), [initialCategory, makeDefaults]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
    control,
  } = useForm<CreateMetricCategoryRequestDTO>({
    resolver: zodResolver(metricCategoryFormSchema),
    mode: "onChange",
    defaultValues: defaults,
  });

  useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  // * Mutations
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
      // TODO: Normalize DTO payload helper
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
      void onSubmitForm(e);
    },
    [onSubmitForm],
  );

  // Delete
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

  // Close
  const handleCloseClick = useCallback(() => {
    onClose();
    reset();
  }, [onClose, reset]);

  // Computed Values
  const errorMsg = createError?.message || updateError?.message || deleteError?.message || "";

  // Styles
  const inputBg = "bg-gray-50";

  return (
    <Modal isOpen onClose={handleCloseClick}>
      <form noValidate className="mx-auto bg-white p-4 sm:p-4 lg:p-6" onSubmit={handleFormSubmit}>
        <h2 className="mb-4 text-xl font-semibold">Manage Category</h2>

        {/* Error Message */}
        <ErrorMessage message={errorMsg}></ErrorMessage>

        <ul className="flex flex-col gap-4 sm:gap-4 lg:gap-6">
          <FormField invalid={!!errors.name} error={errors.name?.message}>
            <FormField.Label>Category Name</FormField.Label>
            <FormField.Control>
              <TextField
                placeholder="i.e Muscle Group Growth"
                registration={register("name")}
                leftAddon={<Folder weight="duotone" className="text-violet-500" />}
                hasError={!!errors.name}
                disabled={isBusyInputs}
                clearable
                required
                wrapperClassName={cn(inputBg, "w-full")}
              />
            </FormField.Control>
          </FormField>

          <span className="flex gap-4 sm:gap-4 lg:gap-6">
            <FormField invalid={!!errors.icon} error={errors.icon?.message}>
              <FormField.Label>Icon</FormField.Label>
              <FormField.Control>
                <TextField
                  placeholder="i.e Muscle Group Growth"
                  registration={register("icon")}
                  // leftAddon={<Folder weight="duotone" className="text-violet-500" />}
                  hasError={!!errors.icon}
                  disabled={isBusyInputs}
                  clearable
                  minLength={1}
                  maxLength={1}
                  wrapperClassName={cn(inputBg, "flex-none w-full")}
                />
              </FormField.Control>
            </FormField>

            <Controller
              name="color"
              control={control}
              render={({ field }) => (
                <FormField invalid={!!errors.color} error={errors.color?.message}>
                  <FormField.Label>Color</FormField.Label>
                  <FormField.Control>
                    <ColorField
                      value={field.value ?? CATEGORY_DEFAULTS.color}
                      onChange={field.onChange}
                      disabled={isBusyInputs}
                      className={cn(inputBg, "flex-shrink")}
                      aria-label="Chart color"
                    />
                  </FormField.Control>
                </FormField>
              )}
            />
          </span>
        </ul>

        {/* Buttons */}
        <div className="mt-8 space-y-4">
          <Button
            type="submit"
            variant="primary"
            leftIcon={<FloppyDisk size={20} />}
            disabled={isSubmitting || isCreating || isUpdating || !isValid}
            block
          >
            {isSubmitting || isCreating || isUpdating ? "Saving..." : isEditMode ? "Save" : "Add"}
          </Button>

          {/* Delete button (edit mode only) */}
          {isEditMode ? (
            <Button
              type="button"
              variant="destructive"
              leftIcon={<Trash size={20} />}
              onClick={handleDeleteClick}
              disabled={isSubmitting || isDeleting}
              block
            >
              {isDeleting ? "Deleting..." : "Delete Metric"}
            </Button>
          ) : null}
        </div>
      </form>
    </Modal>
  );
};

export default MetricCategoryForm;
