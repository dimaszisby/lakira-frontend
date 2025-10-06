"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState } from "react";
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

interface MetricModalProps {
  open: boolean;
  onClose: () => void;
  metricId: string | null;
  initialMetric?: MetricFormInitial | null;
}

export const MetricForm = ({ open, onClose, metricId, initialMetric }: MetricModalProps) => {
  // Default Form handling
  const makeDefaults = (m?: MetricFormInitial | null): MetricFormInputs => ({
    categoryId: m?.categoryId ?? undefined,
    originalMetricId: m?.originalMetricId ?? undefined,
    name: m?.name ?? "",
    description: m?.description ?? "",
    defaultUnit: m?.defaultUnit ?? "",
    isPublic: m?.isPublic ?? false,
  });

  const isEditMode = !!initialMetric;

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

  // Rehydrate -> open/change with a stable key
  const formKey = open ? (initialMetric?.id ?? "create") : "closed";
  const prevKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!open) return;
    // only run when switching between "create" and a specific metric (or between metrics)
    if (prevKeyRef.current === formKey) return;

    reset(makeDefaults(initialMetric));
    prevKeyRef.current = formKey;
  }, [initialMetric, open, formKey, reset]);

  // Build unique ids per field (prevents collisions if multiple forms render)
  const fieldId = (name: string) => `metric-${formKey}-${name}`;

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

  const isBusyInputs = isSubmitting || isCreating || isUpdating;

  // * Submit Handlers
  const onSubmit = async (data: MetricFormInputs) => {
    if (!isValid) {
      console.warn("Form is not valid, preventing submission.");
      return;
    }

    try {
      if (isEditMode && initialMetric && metricId) {
        await updateMetric({ metricId: metricId, metric: data });
      } else {
        await createMetric(data);
      }
      reset();
      onClose();
    } catch (error) {
      console.error("Error creating metric log:", error);
    }
  };

  const onDeleteSubmit = async () => {
    if (!metricId) return;
    try {
      await deleteMetric(metricId);
      reset();
      onClose();
    } catch (error) {
      console.error("Error deleting metric log:", error);
    }
  };

  const errorMsg = createError?.message || updateError?.message || deleteError?.message || "";

  return (
    <Modal isOpen={open} onClose={onClose}>
      <form
        className="mx-auto flex min-w-96 max-w-lg flex-col bg-white p-2 sm:p-2 lg:p-6"
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

          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <CategorySelect
                value={field.value}
                onChange={field.onChange}
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

            <PrimaryButton type="submit" disabled={isSubmitting || !isValid} className="w-full">
              {isSubmitting || isCreating || isUpdating ? "Saving..." : isEditMode ? "Save" : "Add"}
            </PrimaryButton>
          </div>

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
                {isDeleting ? "Deleting..." : "Delete Log"}
              </button>
            </>
          ) : null}
        </div>
      </form>
    </Modal>
  );
};

export default MetricForm;
