"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FloppyDisk, Trash } from "phosphor-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useDebounce } from "react-use";

import type { MetricFormInitial, MetricFormInputs } from "@/features/metrics";
import { metricFormSchema } from "@/features/metrics";
import {
  useCreateMetric,
  useDeleteMetric,
  useMetricsListViaOffset,
  useUpdateMetric,
} from "@/features/metrics/hooks";
import { cn } from "@/lib/cn";
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
  const formTitle = isEditMode ? "Edit Metric" : "Add Metric";

  const makeDefaults = useCallback(
    (m: MetricFormInitial | null): MetricFormInputs => ({
      categoryId: m?.category?.id ?? undefined,
      originalMetricId: m?.originalMetricId ?? undefined,
      name: m?.name ?? "",
      description: m?.description ?? "",
      defaultUnit: m?.defaultUnit ?? "",
      isPublic: m?.isPublic ?? false,
    }),
    [],
  );

  const defaults = useMemo(() => makeDefaults(initialMetric), [initialMetric, makeDefaults]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
    setError,
    clearErrors,
    control,
  } = useForm<MetricFormInputs>({
    resolver: zodResolver(metricFormSchema),
    mode: "onChange",
    defaultValues: defaults,
  });

  useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  const nameValue = useWatch({ control, name: "name" }) ?? "";
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

  // Only fetch when user typed 2+ chars
  const shouldCheckDup = debouncedName.length >= 2;
  const { metrics: dupCandidates = [] } = useMetricsListViaOffset(duplicateCheckParams, {
    enabled: shouldCheckDup,
    staleTime: 5_000,
  });

  const hasValidateError = !!errors.name && errors.name.type === "validate";
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
  }, [hasConflict, shouldCheckDup, hasValidateError, setError, clearErrors]);

  const { createMetric, isPending: isCreating, error: createError } = useCreateMetric();

  const { updateMetric, isPending: isUpdating, error: updateError } = useUpdateMetric();

  const { deleteMetric, isPending: isDeleting, error: deleteError } = useDeleteMetric();

  const isBusyInputs = isSubmitting || isCreating || isUpdating || isDeleting;

  const onValid = useCallback(
    async (data: MetricFormInputs) => {
      try {
        const payload = {
          ...data, // TODO: Normalize DTO payload helper
          categoryId: data.categoryId ?? null,
        };

        if (isEditMode && initialMetric?.id) {
          await updateMetric({ metricId: initialMetric.id, metric: payload });
        } else {
          await createMetric(payload);
        }

        reset();
        onClose();
      } catch {
        // Mutation error state is handled by hook `error` values rendered below.
      }
    },
    [isEditMode, initialMetric, updateMetric, createMetric, reset, onClose],
  );

  const onSubmitForm = useMemo(() => handleSubmit(onValid), [handleSubmit, onValid]);

  const handleFormSubmit: React.FormEventHandler<HTMLFormElement> = useCallback(
    (e) => {
      void onSubmitForm(e);
    },
    [onSubmitForm],
  );

  const deleteMetricAsync = useCallback(async () => {
    const metricId = initialMetric?.id;
    if (!metricId) return;
    try {
      await deleteMetric(metricId);
      reset();
      onClose();
    } catch {
      // Mutation error state is handled by hook `error` values rendered below.
    }
  }, [initialMetric, deleteMetric, reset, onClose]);

  const handleDeleteClick = useCallback(() => {
    void deleteMetricAsync();
  }, [deleteMetricAsync]);

  const handleCloseClick = useCallback(() => {
    onClose();
    reset();
  }, [onClose, reset]);

  const errorMsg = createError?.message || updateError?.message || deleteError?.message || "";
  const inputBg = "bg-surface2";

  return (
    <Modal title={formTitle} isOpen onClose={handleCloseClick}>
      <form
        noValidate
        className="mx-auto p-4 lg:p-6"
        onSubmit={handleFormSubmit}
        autoComplete="off"
      >
        <ErrorMessage message={errorMsg} className="mb-2" />

        <section className="flex flex-col gap-4 lg:gap-6">
          <FormField invalid={!!errors.name} error={errors.name?.message}>
            <FormField.Label>Metric Name</FormField.Label>
            <FormField.Control>
              <TextField
                placeholder="e.g., Daily Steps"
                registration={register("name")}
                hasError={!!errors.name}
                disabled={isBusyInputs}
                clearable
                required
                wrapperClassName={cn(inputBg, "w-full")}
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
                wrapperClassName={cn(inputBg, "w-full")}
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
                placeholder="e.g., Track muscle growth over time"
                registration={register("description")}
                hasError={!!errors.description}
                disabled={isBusyInputs}
                rows={5}
                maxLength={255}
                wrapperClassName={cn(
                  inputBg,
                  "overflow-y-auto",
                  "max-h-96",
                  "[&::-webkit-scrollbar]:hidden",
                  "[-ms-overflow-style:none]",
                  "[scrollbar-width:none]",
                )}
                showCount
              />
            </FormField.Control>
          </FormField>
        </section>

        {/* Buttons */}
        <div className="mt-8 space-y-4">
          <Button
            type="submit"
            variant="primary"
            leftIcon={<FloppyDisk size={20} />}
            disabled={isBusyInputs || !isValid}
            block
            aria-label="Save Metric"
          >
            {isSubmitting || isCreating || isUpdating
              ? "Saving..."
              : isEditMode
                ? "Save"
                : "Add Metric"}
          </Button>

          {isEditMode ? (
            <Button
              type="button"
              variant="destructive"
              leftIcon={<Trash size={20} />}
              onClick={handleDeleteClick}
              disabled={isBusyInputs}
              block
              aria-label="Delete Metric"
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
