"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Trash } from "phosphor-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useDebounce } from "react-use";

import type { MetricFormInitial, MetricFormInputs } from "@/features/metrics";
import { metricFormSchema } from "@/features/metrics";
import {
  useCreateMetric,
  useDeleteMetric,
  useMetricsListViaOffset,
  useUpdateMetric,
} from "@/features/metrics/hooks/index";
import { cn } from "@/src/lib/cn";
import Button from "@/ui/Button";
import CategorySelect from "@/ui/CategorySelect";
import ErrorMessage from "@/ui/ErrorMessage";
import { FormField } from "@/ui/FormField";
import Modal from "@/ui/Modal";
import TextArea from "@/ui/TextArea";
import TextField from "@/ui/TextField";

interface Props {
  onClose: () => void;
  initialMetric: MetricFormInitial | null;
}

export const MetricForm = ({ onClose, initialMetric }: Props) => {
  const isEditMode = !!initialMetric;

  // * Form
  // TODO: refactor
  const makeDefaults = (m?: MetricFormInitial | null): MetricFormInputs => ({
    categoryId: m?.category?.id ?? undefined,
    originalMetricId: m?.originalMetricId ?? undefined,
    name: m?.name ?? "",
    description: m?.description ?? "",
    defaultUnit: m?.defaultUnit ?? "",
    isPublic: m?.isPublic ?? false,
  });

  const defaults = useMemo(() => makeDefaults(initialMetric), [initialMetric]);

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
    defaultValues: defaults,
  });

  useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  // * Duplicate Name Check
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
  const shouldCheckDup = debouncedName.length >= 2;
  const { metrics: dupCandidates = [] } = useMetricsListViaOffset(duplicateCheckParams, {
    enabled: shouldCheckDup,
    staleTime: 5_000,
  });

  // derive current “has conflict” + current error state
  const hasValidateError = !!errors.name && errors.name.type === "validate";
  // Reconcile dup result with current mode (ignore same record on edit)
  const hasConflict = useMemo(
    () =>
      shouldCheckDup &&
      dupCandidates.some(
        (m) =>
          m.name.trim().toLowerCase() === debouncedName.toLowerCase() &&
          (!isEditMode || m.id !== initialMetric?.id),
      ),
    [shouldCheckDup, dupCandidates, debouncedName, isEditMode, initialMetric?.id],
  );
  useEffect(() => {
    if (!shouldCheckDup) {
      if (hasValidateError) clearErrors("name");
      return;
    }
    if (hasConflict && !hasValidateError) {
      setError("name", {
        type: "validate",
        message: "Metric name already exists",
      });
    } else if (!hasConflict && hasValidateError) {
      clearErrors("name");
    }
  }, [
    hasConflict,
    shouldCheckDup,
    dupCandidates,
    debouncedName,
    isEditMode,
    initialMetric?.id,
    hasValidateError,
    setError,
    clearErrors,
  ]);

  // * Mutations
  const { createMetric, isPending: isCreating, error: createError } = useCreateMetric();

  const { updateMetric, isPending: isUpdating, error: updateError } = useUpdateMetric();

  const { deleteMetric, isPending: isDeleting, error: deleteError } = useDeleteMetric();

  const isBusyInputs = isSubmitting || isCreating || isUpdating || isDeleting;

  // * Handlers
  const onValid = useCallback(
    async (data: MetricFormInputs) => {
      try {
        // TODO: Normalize DTO payload helper
        const payload = {
          ...data,
          categoryId: data.categoryId ?? null, // send null when cleared
        };

        if (isEditMode && initialMetric?.id) {
          await updateMetric({ metricId: initialMetric.id, metric: payload });
        } else {
          await createMetric(payload);
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
      void onSubmitForm(e);
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

  // Close
  const handleCloseClick = useCallback(() => {
    onClose();
    reset();
  }, [onClose, reset]);

  // Computed values
  const errorMsg = createError?.message || updateError?.message || deleteError?.message || "";

  // Styles
  const inputBg = "bg-gray-50";

  return (
    <Modal isOpen onClose={handleCloseClick}>
      <form
        noValidate
        className="mx-auto flex min-w-96 max-w-lg flex-col bg-white p-2 sm:p-2 lg:p-6"
        onSubmit={handleFormSubmit}
      >
        <h2 className="mb-2 text-xl font-semibold">Manage Metric</h2>
        <ErrorMessage message={errorMsg} className="mb-2"></ErrorMessage>

        <div className="flex flex-col gap-8">
          <FormField invalid={!!errors.name} error={errors.name?.message}>
            <FormField.Label>Metric Name</FormField.Label>
            <FormField.Control>
              <TextField
                placeholder="e.g., 10000"
                registration={register("name")}
                hasError={!!errors.name}
                disabled={isBusyInputs}
                clearable
                required
                wrapperClassName={inputBg}
              />
            </FormField.Control>
          </FormField>

          <FormField invalid={!!errors.defaultUnit} error={errors.defaultUnit?.message}>
            <FormField.Label>Default Unit</FormField.Label>
            <FormField.Control>
              <TextField
                placeholder="e.g., km, reps, hours"
                registration={register("defaultUnit")}
                hasError={!!errors.defaultUnit}
                disabled={isBusyInputs}
                clearable
                required
                wrapperClassName={inputBg}
              />
            </FormField.Control>
          </FormField>

          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <FormField invalid={!!errors.categoryId} error={errors.categoryId?.message}>
                <FormField.Label>Category</FormField.Label>
                <FormField.Control>
                  <CategorySelect
                    catId={field.value ?? null}
                    onChange={field.onChange}
                    selectedOptionHint={initialMetric?.category ?? null}
                    disabled={isBusyInputs}
                  />
                </FormField.Control>
              </FormField>
            )}
          />

          <FormField invalid={!!errors.description} error={errors.description?.message}>
            <FormField.Label>Description</FormField.Label>
            <FormField.Control>
              <TextArea
                placeholder="i.e., Metric to calculate muscle growth over time"
                registration={register("description")}
                hasError={!!errors.description}
                disabled={isBusyInputs}
                rows={5}
                maxLength={255}
                wrapperClassName={cn(
                  "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]  overflow-y-auto",
                  inputBg,
                  "max-h-96",
                )}
                showCount
              />
            </FormField.Control>
          </FormField>
        </div>

        {/* Buttons */}
        <div className="mt-8 space-y-4">
          <Button
            type="submit"
            variant="primary"
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

export default MetricForm;
