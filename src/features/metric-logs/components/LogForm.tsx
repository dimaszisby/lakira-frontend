"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FloppyDisk, Lightning, Trash } from "phosphor-react";
import React, { useCallback, useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";

import Button from "@/components/ui/Button";
import DateTimePicker from "@/components/ui/DateTimePicker";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { FormField } from "@/components/ui/FormField";
import {
  useCreateMetricLog,
  useDeleteMetricLog,
  useUpdateMetricLog,
} from "@/features/metric-logs/hooks/index";
import type { LogFormInputs } from "@/features/metric-logs/types";
import { logFormSchema } from "@/features/metric-logs/types";
import type { MetricLogVM } from "@/features/metric-logs/view-models";
import type {
  CreateMetricLogRequestDTO,
  UpdateMetricLogRequestDTO,
} from "@/types/dtos/metric-log.dto";
import Modal from "@/ui/Modal";
import TextField from "@/ui/TextField";
import { parseDate, toISOWithOffset, toISOZ } from "@/utils/date-io";

interface Props {
  onClose: () => void;
  metricId: string; // non-nullable; ensure ownership
  initialLog?: MetricLogVM | null;
}

const MetricLogForm = ({ onClose, metricId, initialLog }: Props) => {
  const isEditMode = !!initialLog;

  // * Form
  const makeDefaults = useCallback(
    (m?: MetricLogVM | null): LogFormInputs => ({
      metricId,
      logValue: m?.logValue ?? 0,
      loggedAt: m?.loggedAt ? new Date(m.loggedAt) : new Date(),
      type: m?.type || "manual",
    }),
    [metricId],
  );

  const defaults = useMemo(() => makeDefaults(initialLog), [initialLog, makeDefaults]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
    control,
  } = useForm<LogFormInputs>({
    resolver: zodResolver(logFormSchema),
    mode: "onChange",
    defaultValues: defaults,
  });

  useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  // * Mutations
  const { createMetricLog, isPending: isCreating, error: createError } = useCreateMetricLog();

  const { updateMetricLog, isPending: isUpdating, error: updateError } = useUpdateMetricLog();

  const { deleteMetricLog, isPending: isDeleting, error: deleteError } = useDeleteMetricLog();

  const isBusyInputs = isSubmitting || isCreating || isUpdating || isDeleting;

  // * Handlers
  const onValid = useCallback(
    async (data: LogFormInputs) => {
      try {
        // TODO: Normalize DTO payload helper
        const payloadCreate = {
          ...data,
          loggedAt: toISOZ(data.loggedAt),
        } satisfies CreateMetricLogRequestDTO;

        const payloadUpdate = {
          ...data,
          loggedAt: toISOZ(data.loggedAt),
        } satisfies UpdateMetricLogRequestDTO;

        if (isEditMode && initialLog) {
          await updateMetricLog({
            logId: initialLog.id,
            metricId,
            log: payloadUpdate,
          });
        } else {
          await createMetricLog(payloadCreate);
        }
        reset();
        onClose();
      } catch (error) {
        console.error("Error creating metric log:", error);
      }
    },
    [isEditMode, initialLog, metricId, updateMetricLog, createMetricLog, reset, onClose],
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
  const deleteLogAsync = useCallback(async () => {
    if (!initialLog) return;
    try {
      await deleteMetricLog({ logId: initialLog.id, metricId });
      reset();
      onClose();
    } catch (error) {
      console.error("Error deleting metric log:", error);
    }
  }, [initialLog, metricId, deleteMetricLog, reset, onClose]);

  const handleDeleteClick = useCallback(() => {
    void deleteLogAsync();
  }, [deleteLogAsync]);

  // Close
  const handleCloseClick = useCallback(() => {
    onClose();
    reset();
  }, [onClose, reset]);

  // Computed Values
  const errorMsg = createError?.message || updateError?.message || deleteError?.message || "";

  // Styles
  const inputBg = "bg-gray-50";

  // Guard: ensure log ownership by existing metric
  if (!metricId) {
    return <p className="mb-4 mt-4 text-xs text-red-500">Metric ID is required to add a log.</p>;
  }

  return (
    <Modal isOpen onClose={handleCloseClick} ariaLabel="Metric log form">
      <form
        noValidate
        className="w-full max-w-md bg-white p-2 sm:p-2 lg:p-6"
        onSubmit={handleFormSubmit}
        autoComplete="off"
      >
        {/* Title */}
        <h2 className="mb-2 text-xl font-bold">
          {isEditMode ? "Edit Log Entry" : "Add Log Entry"}
        </h2>

        {/* Error Message */}
        <ErrorMessage message={errorMsg} className="mb-2"></ErrorMessage>

        <div className="flex flex-col gap-8">
          {/* Hidden metricId field */}
          <input type="hidden" {...register("metricId")} value={metricId} />

          {/* Value Field */}
          <FormField invalid={!!errors.logValue} error={errors.logValue?.message}>
            <FormField.Label>Log Value</FormField.Label>
            <FormField.Control>
              <TextField
                type="number"
                registration={register("logValue", { valueAsNumber: true })}
                placeholder="e.g., 10000"
                leftAddon={<Lightning weight="duotone" className="text-violet-500" />}
                hasError={!!errors.logValue}
                disabled={isBusyInputs}
                clearable
                required
                wrapperClassName={inputBg}
              />
            </FormField.Control>
          </FormField>

          {/* Logged At Field */}
          <Controller
            name="loggedAt"
            control={control}
            render={({ field }) => (
              <FormField invalid={!!errors.loggedAt} error={errors.loggedAt?.message}>
                <FormField.Label>Logged At</FormField.Label>
                <FormField.Control>
                  <DateTimePicker
                    mode="datetime"
                    value={parseDate(field.value)}
                    onChange={(d) => field.onChange(toISOWithOffset(d))}
                    minuteStep={5}
                    disabled={isBusyInputs}
                    aria-label="Log date and time"
                  />
                </FormField.Control>
              </FormField>
            )}
          />
        </div>

        <div className="inline-block">
          {!isValid && (
            <ErrorMessage message="All Fields Are required" className="mb-2"></ErrorMessage>
          )}
        </div>

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

export default MetricLogForm;
