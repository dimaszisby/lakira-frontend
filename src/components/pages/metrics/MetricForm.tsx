"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useDebounce } from "react-use";

import type { MetricFormInitial } from "@/features/metrics/form.initial";
import {
  useCreateMetric,
  useDeleteMetric,
  useMetricsLibrary,
  useUpdateMetric,
} from "@/features/metrics/hooks";
import type { MetricFormInputs } from "@/features/metrics/types";
import { metricFormSchema } from "@/features/metrics/types";
import CategorySelect from "@/ui/CategorySelect";
import ErrorMessage from "@/ui/ErrorMessage";
import Modal from "@/ui/Modal";
import PrimaryButton from "@/ui/PrimaryButton";
import TextAreaField from "@/ui/TextArea";
import TextField from "@/ui/TextField";

interface Props {
  open: boolean;
  onClose: () => void;
  initialMetric: MetricFormInitial | null;
}

export const MetricForm = ({ open, onClose, initialMetric }: Props) => {
  const isEditMode = !!initialMetric;

  // Form Defaults handling
  // TODO: refactor in /features/metrics/form.tsx
  const makeDefaults = (m?: MetricFormInitial | null): MetricFormInputs => ({
    categoryId: m?.categoryId ?? undefined,
    originalMetricId: m?.originalMetricId ?? undefined,
    name: m?.name ?? "",
    description: m?.description ?? "",
    defaultUnit: m?.defaultUnit ?? "",
    isPublic: m?.isPublic ?? false,
  });

  // * Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
    setError,
    clearErrors,
    watch,
    control,
  } = useForm<MetricFormInputs>({
    resolver: zodResolver(metricFormSchema),
    mode: "onChange",
    defaultValues: makeDefaults(initialMetric),
  });

  // * Rehydrate Form
  // Build unique ids per field -> prevents collisions if multiple forms render
  const uid = useId();
  const fieldId = (name: string) => `metric-${uid}-${name}`;

  // * ========== Duplicate Name Check ==========

  // Debounce the name input to prevent excessive API calls
  const nameValue = watch("name") ?? "";
  const [debouncedName, setDebouncedName] = useState(nameValue);
  useDebounce(() => setDebouncedName(nameValue.trim()), 400, [nameValue]);

  const duplicateCheckParams = useMemo(
    () => ({
      page: 1,
      limit: 1,
      name: debouncedName || undefined,
    }),
    [debouncedName],
  );

  // Only fetch when modal is open and user typed 2+ chars
  const shouldCheckDup = open && debouncedName.length >= 2;
  const { metrics: dupCandidates = [] } = useMetricsLibrary(duplicateCheckParams, {
    enabled: shouldCheckDup,
    staleTime: 5_000,
  });

  // derive current “has conflict” + current error state
  const hasValidateError = !!errors.name && errors.name.type === "validate";
  // Reconcile dup result with current mode (ignore same record on edit)
  useEffect(() => {
    if (!shouldCheckDup) {
      if (hasValidateError) clearErrors("name");
      return;
    }
    const conflict = dupCandidates.some(
      (m) =>
        m.name.trim().toLowerCase() === debouncedName.toLowerCase() &&
        (!isEditMode || m.id !== initialMetric?.id),
    );
    if (conflict && !hasValidateError) {
      setError("name", {
        type: "validate",
        message: "Metric name already exists",
      });
    } else if (!conflict && hasValidateError) {
      clearErrors("name");
    }
  }, [
    shouldCheckDup,
    dupCandidates,
    debouncedName,
    isEditMode,
    initialMetric?.id,
    hasValidateError,
    setError,
    clearErrors,
  ]);

  // * ========== Mutations ==========
  const { createMetric, isPending: isCreating, error: createError } = useCreateMetric();

  const { updateMetric, isPending: isUpdating, error: updateError } = useUpdateMetric();

  const { deleteMetric, isPending: isDeleting, error: deleteError } = useDeleteMetric();

  const isBusyInputs = isSubmitting || isCreating || isUpdating || isDeleting;

  // * Submit Handlers
  const onValid = useCallback(
    async (data: MetricFormInputs) => {
      try {
        if (isEditMode && initialMetric?.id) {
          await updateMetric({ metricId: initialMetric.id, metric: data });
        } else {
          await createMetric(data);
        }

        reset();
        onClose();
      } catch (error) {
        console.error("Error creating metric log:", error);
      }
    },
    [isEditMode, initialMetric, updateMetric, createMetric, reset, onClose],
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

  // Delete
  const deleteMetricAsync = useCallback(async () => {
    if (!initialMetric?.id) return;
    try {
      await deleteMetric(initialMetric.id);
      reset();
      onClose();
    } catch (error) {
      console.error("Error deleting metric log:", error);
    }
  }, [initialMetric?.id, deleteMetric, reset, onClose]);

  const handleDeleteClick = useCallback(() => {
    void deleteMetricAsync();
  }, [deleteMetricAsync]);

  // Computed values
  const errorMsg = createError?.message || updateError?.message || deleteError?.message || "";

  return (
    <Modal isOpen={open} onClose={onClose}>
      {open ? (
        <form
          key={initialMetric?.id ?? "create"}
          noValidate
          className="mx-auto flex min-w-96 max-w-lg flex-col bg-white p-2 sm:p-2 lg:p-6"
          onSubmit={handleFormSubmit}
        >
          <h2 className="mb-2 text-xl font-semibold">Manage Metric</h2>

          <ErrorMessage message={errorMsg} className="mb-2"></ErrorMessage>

          <div className="flex flex-col gap-8">
            <TextField
              id={fieldId("name")}
              label="Metric Name"
              registration={register("name")}
              placeholder="e.g., Steps Walked"
              error={errors.name?.message}
              disabled={isBusyInputs}
              required
            />

            <TextField
              id={fieldId("defaultUnit")}
              label="Default Unit"
              registration={register("defaultUnit")}
              placeholder="e.g., km, reps, hours"
              error={errors.defaultUnit?.message}
              disabled={isBusyInputs}
              required
            />

            {/** Category still not applied when clicking update */}
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <CategorySelect
                  value={field.value ?? null}
                  onChange={(opt) => field.onChange(opt?.valueOf ?? undefined)}
                  selectedOptionHint={initialMetric?.categoryHint}
                />
              )}
            />

            {/* Should be a TextArea */}
            <TextAreaField
              id={fieldId("description")}
              label="Description"
              registration={register("description")}
              placeholder="i.e., Metric to calculate muscle growth over time"
              error={errors.description?.message}
              disabled={isBusyInputs}
              rows={5}
            />
          </div>

          {/* Buttons */}
          <div className="flex-row space-y-4">
            <div className="items mt-6 flex justify-center gap-2">
              <button
                type="button"
                className="w-full rounded-xl bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>

              <PrimaryButton
                type="submit"
                disabled={isSubmitting || isCreating || isUpdating || !isValid}
                className="w-full"
              >
                {isSubmitting || isCreating || isUpdating
                  ? "Saving..."
                  : isEditMode
                    ? "Save"
                    : "Add"}
              </PrimaryButton>
            </div>

            {/* Delete button (edit mode only) */}
            {isEditMode ? (
              <>
                <hr style={{ borderTop: "1px solid lightgrey" }} className="my-4" />
                <button
                  type="button"
                  className="w-full rounded-xl bg-red-50 px-4 py-2 text-red-500 hover:bg-red-100"
                  onClick={handleDeleteClick}
                  disabled={isSubmitting || isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete Log"}
                </button>
              </>
            ) : null}
          </div>
        </form>
      ) : null}
    </Modal>
  );
};

export default MetricForm;
