"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FloppyDisk, Folder, Trash } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { CATEGORY_DEFAULTS } from "@/features/metric-categories/constants";
import {
  useCreateMetricCategory,
  useDeleteMetricCategory,
  useUpdateMetricCategory,
} from "@/features/metric-categories/hooks";
import type { MetricCategoryFormInput } from "@/features/metric-categories/types";
import { metricCategoryFormSchema } from "@/features/metric-categories/types";
import type { MetricCategoryVM } from "@/features/metric-categories/view-models";
import { cn } from "@/lib/cn";
import { handleApiError } from "@/services/api/handleApiError";
import { Button } from "@/ui/Button";
import { ColorField } from "@/ui/ColorField";
import { ErrorMessage } from "@/ui/ErrorMessage";
import { FormField } from "@/ui/FormField";
import type { ModalTitleLevel } from "@/ui/Modal";
import { Modal } from "@/ui/Modal";
import { TextField } from "@/ui/TextField";

interface Props {
  onClose: () => void;
  initialCategory: MetricCategoryVM | null;
  /** The dialog title's element; see `Modal`. */
  titleAs?: ModalTitleLevel;
}

const MetricCategoryForm = ({ onClose, initialCategory, titleAs }: Props) => {
  const isEditMode = !!initialCategory;

  const formTitle = isEditMode ? "Edit Category" : "Add Category";

  const makeDefaults = useCallback(
    (m: MetricCategoryVM | null): MetricCategoryFormInput => ({
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
  } = useForm<MetricCategoryFormInput>({
    resolver: zodResolver(metricCategoryFormSchema),
    mode: "onChange",
    defaultValues: defaults,
  });

  useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  const { createMetricCategory, isPending: isCreating } = useCreateMetricCategory();

  const { updateMetricCategory, isPending: isUpdating } = useUpdateMetricCategory();

  const { deleteMetricCategory, isPending: isDeleting } = useDeleteMetricCategory();

  // The error of the latest action. Each mutation keeps its own `error` until it runs again, so
  // picking among them would show a Save refusal after a newer Delete refusal.
  const [actionError, setActionError] = useState<Error | null>(null);

  const isBusyInputs = isSubmitting || isCreating || isUpdating || isDeleting;

  const onValid = useCallback(
    async (data: MetricCategoryFormInput) => {
      setActionError(null);
      try {
        if (isEditMode && initialCategory) {
          await updateMetricCategory({ categoryId: initialCategory.id, category: data });
        } else {
          await createMetricCategory(data);
        }

        reset();
        onClose();
      } catch (error) {
        setActionError(error as Error);
      }
    },
    [initialCategory, isEditMode, updateMetricCategory, createMetricCategory, reset, onClose],
  );

  const onSubmitForm = useMemo(() => handleSubmit(onValid), [handleSubmit, onValid]);

  const handleFormSubmit: React.FormEventHandler<HTMLFormElement> = useCallback(
    (e) => {
      void onSubmitForm(e);
    },
    [onSubmitForm],
  );

  const deleteCategoryAsync = useCallback(async () => {
    if (!initialCategory) return;
    setActionError(null);
    try {
      await deleteMetricCategory(initialCategory.id);
      reset();
      onClose();
    } catch (error) {
      setActionError(error as Error);
    }
  }, [initialCategory, deleteMetricCategory, reset, onClose]);

  const handleDeleteClick = useCallback(() => {
    void deleteCategoryAsync();
  }, [deleteCategoryAsync]);

  const handleCloseClick = useCallback(() => {
    onClose();
    reset();
  }, [onClose, reset]);

  const errorMsg = useMemo(
    () => (actionError ? handleApiError(actionError).join(", ") : ""),
    [actionError],
  );

  const inputBg = "bg-surface2";

  return (
    <Modal open onClose={handleCloseClick} title={formTitle} titleAs={titleAs}>
      <form
        noValidate
        className="mx-auto p-4 lg:p-6"
        onSubmit={handleFormSubmit}
        autoComplete="off"
      >
        <ErrorMessage message={errorMsg} className="mb-2" />

        <div className="flex flex-col gap-4 lg:gap-6">
          <FormField invalid={!!errors.name} error={errors.name?.message}>
            <FormField.Label>Category Name</FormField.Label>
            <FormField.Control>
              <TextField
                placeholder="i.e Muscle Group Growth"
                {...register("name")}
                leftAddon={<Folder weight="duotone" className="text-ink-secondary" />}
                invalid={!!errors.name}
                disabled={isBusyInputs}
                clearable
                required
                wrapperClassName={cn(inputBg, "w-full")}
              />
            </FormField.Control>
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6">
            <FormField invalid={!!errors.icon} error={errors.icon?.message} className="min-w-0">
              <FormField.Label>Icon</FormField.Label>
              <FormField.Control>
                <TextField
                  placeholder="e.g. 💪"
                  {...register("icon")}
                  invalid={!!errors.icon}
                  disabled={isBusyInputs}
                  clearable
                  wrapperClassName={cn(inputBg, "w-full")}
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
                      className={cn(inputBg, "w-full")}
                      aria-label="Category color"
                    />
                  </FormField.Control>
                </FormField>
              )}
            />
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <Button
            type="submit"
            variant="primary"
            leftIcon={<FloppyDisk size={20} />}
            disabled={isSubmitting || isCreating || isUpdating || !isValid}
            block
          >
            {isSubmitting || isCreating || isUpdating
              ? "Saving..."
              : isEditMode
                ? "Save"
                : "Add Category"}
          </Button>

          {isEditMode ? (
            <Button
              type="button"
              variant="destructive"
              leftIcon={<Trash size={20} />}
              onClick={handleDeleteClick}
              disabled={isBusyInputs}
              block
            >
              {isDeleting ? "Deleting..." : "Delete Category"}
            </Button>
          ) : null}
        </div>
      </form>
    </Modal>
  );
};

export default MetricCategoryForm;
