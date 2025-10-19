"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useId, useMemo } from "react";
import { useForm } from "react-hook-form";

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
  MetricLogResponseDTO,
  UpdateMetricLogRequestDTO,
} from "@/types/dtos/metric-log.dto";
import Modal from "@/ui/Modal";
import PrimaryButton from "@/ui/PrimaryButton";
import TextField from "@/ui/TextField";
import { toIsoFromLocalInput } from "@/utils/date-io";

interface Props {
  open: boolean;
  onClose: () => void;
  metricId: string; // non-nullable; ensure ownership
  initialLog?: MetricLogVM | null;
}

const MetricLogFormModal = ({ open, onClose, metricId, initialLog }: Props) => {
  const isEditMode = !!initialLog;

  // Form Defaults handling
  const makeDefaults = useCallback(
    (m?: MetricLogResponseDTO | null): LogFormInputs => ({
      metricId,
      logValue: m?.logValue ?? 0,
      loggedAt: m?.loggedAt ? new Date(m.loggedAt) : new Date(), // form state use Date type
      type: m?.type || "manual",
    }),
    [metricId],
  );

  // * Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<LogFormInputs>({
    resolver: zodResolver(logFormSchema),
    mode: "onChange",
    defaultValues: makeDefaults(initialLog),
  });

  // * Rehydrate
  // Build unique ids per field -> prevents collisions if multiple forms render
  const uid = useId();
  const fieldId = (name: string) => `log-${uid}-${name}`;

  // * ========== Mutation Hooks
  const { createMetricLog, isPending: isCreating, error: createError } = useCreateMetricLog();

  const { updateMetricLog, isPending: isUpdating, error: updateError } = useUpdateMetricLog();

  const { deleteMetricLog, isPending: isDeleting, error: deleteError } = useDeleteMetricLog();

  const isBusyInputs = isSubmitting || isCreating || isUpdating || isDeleting;

  // * ========== Submit Handlers
  // Handles form submission -> create and edit modes
  const onValid = useCallback(
    async (data: LogFormInputs) => {
      try {
        const payloadCreate = {
          metricId: data.metricId,
          logValue: data.logValue,
          type: data.type,
          loggedAt: toIsoFromLocalInput(data.loggedAt),
        } satisfies CreateMetricLogRequestDTO;

        const payloadUpdate = {
          metricId: data.metricId,
          logValue: data.logValue,
          type: data.type,
          loggedAt: toIsoFromLocalInput(data.loggedAt),
        } satisfies UpdateMetricLogRequestDTO;

        if (isEditMode && initialLog) {
          await updateMetricLog({
            logId: initialLog.id,
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
    [isEditMode, initialLog, updateMetricLog, createMetricLog, reset, onClose],
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

  // Handle delete submission
  const deleteLogAsync = useCallback(async () => {
    if (!initialLog) return;
    try {
      await deleteMetricLog(initialLog.id);
      reset();
      onClose();
    } catch (error) {
      console.error("Error deleting metric log:", error);
    }
  }, [initialLog, deleteMetricLog, reset, onClose]);

  const handleDeleteClick = useCallback(() => {
    void deleteLogAsync();
  }, [deleteLogAsync]);

  // Computed values
  const errorMsg = createError?.message || updateError?.message || deleteError?.message || "";

  // Guard: ensure log ownership by existing metric
  if (!metricId) {
    return <p className="mb-4 mt-4 text-xs text-red-500">Metric ID is required to add a log.</p>;
  }

  return (
    <Modal isOpen={open} onClose={onClose}>
      {open ? (
        <form
          key={initialLog?.id ?? "create"}
          noValidate
          className="w-full max-w-md bg-white p-6"
          onSubmit={handleFormSubmit}
          autoComplete="off"
        >
          {/* Title */}
          <h2 className="mb-4 text-xl font-bold">
            {isEditMode ? "Edit Log Entry" : "Add Log Entry"}
          </h2>

          {/* Error Message */}
          <div className="mb-4 inline-block h-2">
            {errorMsg ? <p className="mb-2 text-xs text-red-500">{errorMsg}</p> : null}
          </div>

          {/* Hidden metricId field */}
          <input type="hidden" {...register("metricId")} value={metricId} />

          {/* Value Field */}
          <TextField
            id={fieldId("logValue")}
            label="Log Value"
            type="number"
            registration={register("logValue", { valueAsNumber: true })}
            placeholder="10"
            error={errors.logValue?.message}
            disabled={isBusyInputs}
            required
          />

          {/* Logged At Field */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-semibold">
              Logged At
              <input
                type="datetime-local"
                className="w-full rounded border px-3 py-2"
                {...register("loggedAt", { valueAsDate: true })} // RHF will handle Date conversion
              />
            </label>
            {errors.loggedAt ? (
              <p className="text-xs text-red-500">{errors.loggedAt.message}</p>
            ) : null}
          </div>

          <div className="inline-block h-2">
            {!isValid && <p className="text-xs text-red-500">All fields are required.</p>}
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

export default MetricLogFormModal;
