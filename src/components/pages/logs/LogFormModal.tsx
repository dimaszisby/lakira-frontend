"use client";

import React, { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Modal from "@/src/components/ui/Modal";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import ReusableFormField from "../../ui/ReusableFormField";
import {
  useCreateMetricLog,
  useDeleteMetricLog,
  useUpdateMetricLog,
} from "@/src/features/metricLogs/hooks";
import { LogFormInputs, logFormSchema } from "@/features/metricLogs/types";
import {
  CreateMetricLogRequestDTO,
  MetricLogResponseDTO,
  UpdateMetricLogRequestDTO,
} from "@/src/types/dtos/metric-log.dto";
import { toIsoFromLocalInput } from "@/src/utils/date-io";

interface MetricLogModalProps {
  open: boolean;
  onClose: () => void;
  metricId: string;
  initialLog?: MetricLogResponseDTO | null;
}

export const MetricLogFormModal: React.FC<MetricLogModalProps> = ({
  open,
  onClose,
  metricId,
  initialLog,
}) => {
  const isEditMode = !!initialLog;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
    setValue,
  } = useForm<LogFormInputs>({
    resolver: zodResolver(logFormSchema),
    mode: "onChange",
    defaultValues: isEditMode
      ? {
          metricId,
          logValue: initialLog?.logValue,
          loggedAt: initialLog?.loggedAt
            ? new Date(initialLog.loggedAt)
            : new Date(), // form state use Date type
          type: initialLog?.type || "manual",
        }
      : {
          metricId,
          logValue: undefined,
          loggedAt: new Date(),
          type: "manual",
        },
  });

  // When modal opens for edit mode, update values
  useEffect(() => {
    if (open && isEditMode && initialLog) {
      setValue("metricId", metricId);
      setValue("logValue", initialLog.logValue);
      setValue(
        "loggedAt",
        initialLog.loggedAt ? new Date(initialLog.loggedAt) : new Date()
      );
      setValue("type", initialLog.type || "manual");
    } else if (open && !isEditMode) {
      reset({
        metricId,
        logValue: undefined,
        loggedAt: new Date(),
        type: "manual",
      });
    }
  }, [open, isEditMode, initialLog, metricId, setValue, reset]);

  // * Mutation Hooks
  const {
    createMetricLog,
    isPending: isCreating,
    error: createError,
  } = useCreateMetricLog();

  const {
    updateMetricLog,
    isPending: isUpdating,
    error: updateError,
  } = useUpdateMetricLog();

  const {
    deleteMetricLog,
    isPending: isDeleting,
    error: deleteError,
  } = useDeleteMetricLog();

  // * Submit Handlers
  // Handles form submission for both create and edit modes
  const onSubmit = async (data: LogFormInputs) => {
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
  };

  const onDeleteSubmit = async () => {
    if (!initialLog) return;
    try {
      await deleteMetricLog(initialLog.id);
      reset();
      onClose();
    } catch (error) {
      console.error("Error deleting metric log:", error);
    }
  };

  React.useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const errorMsg =
    createError?.message || updateError?.message || deleteError?.message || "";

  if (!metricId) {
    return (
      <p className="mt-4 mb-4 text-red-500 text-xs">
        Metric ID is required to add a log.
      </p>
    );
  }

  return (
    <Modal isOpen={open} onClose={onClose}>
      <form
        className="w-full max-w-md bg-white p-6"
        onSubmit={handleSubmit(onSubmit)}
        autoComplete="off"
      >
        {/* Title */}
        <h2 className="text-xl font-bold mb-4">
          {isEditMode ? "Edit Log Entry" : "Add Log Entry"}
        </h2>

        {/* Error Message */}
        <div className="inline-block h-2 mb-4">
          {errorMsg && <p className="text-red-500 text-xs mb-2">{errorMsg}</p>}
        </div>

        {/* Hidden metricId field */}
        <input type="hidden" {...register("metricId")} value={metricId} />

        {/* Value Field */}
        <ReusableFormField
          label="Log Value"
          type="number"
          register={register("logValue", { valueAsNumber: true })}
          placeholder="10"
          isSubmitting={isSubmitting || isCreating || isUpdating}
          error={errors.logValue?.message}
        />

        {/* Logged At Field */}
        <div className="mb-4">
          <label className="block mb-1 text-sm font-semibold">
            Logged At
            <input
              type="datetime-local"
              className="w-full px-3 py-2 border rounded"
              {...register("loggedAt", { valueAsDate: true })} // RHF will handle Date conversion
            />
          </label>
          {errors.loggedAt && (
            <p className="text-red-500 text-xs">{errors.loggedAt.message}</p>
          )}
        </div>

        <div className="inline-block h-2">
          {!isValid && (
            <p className="text-red-500 text-xs">All fields are required.</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex-row space-y-4">
          <div className="flex gap-2 mt-6 justify-center items">
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 w-full"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>

            <PrimaryButton
              type="submit"
              disabled={isSubmitting || !isValid}
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
          {isEditMode && (
            <>
              <hr
                style={{ borderTop: "1px solid lightgrey" }}
                className="my-4"
              />
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 w-full"
                onClick={onDeleteSubmit}
                disabled={isSubmitting || isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Log"}
              </button>
            </>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default MetricLogFormModal;
