"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FloppyDisk, Lightning, Trash } from "phosphor-react";
import { useCallback, useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";

import {
  useCreateMetricLog,
  useDeleteMetricLog,
  useUpdateMetricLog,
} from "@/features/metric-logs/hooks";
import type { LogFormInputs } from "@/features/metric-logs/types";
import { logFormSchema } from "@/features/metric-logs/types";
import type { MetricLogVM } from "@/features/metric-logs/view-models";
import { cn } from "@/lib/cn";
import type {
  CreateMetricLogRequestDTO,
  UpdateMetricLogRequestDTO,
} from "@/types/dtos/metric-log.dto";
import Button from "@/ui/Button";
import DateTimePicker from "@/ui/DateTimePicker";
import ErrorMessage from "@/ui/ErrorMessage";
import { FormField } from "@/ui/FormField";
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
  const formTitle = isEditMode ? "Edit Log Entry" : "Add Log Entry";

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

  const { createMetricLog, isPending: isCreating, error: createError } = useCreateMetricLog();

  const { updateMetricLog, isPending: isUpdating, error: updateError } = useUpdateMetricLog();

  const { deleteMetricLog, isPending: isDeleting, error: deleteError } = useDeleteMetricLog();

  const isBusyInputs = isSubmitting || isCreating || isUpdating || isDeleting;

  const onValid = useCallback(
    async (data: LogFormInputs) => {
      try {
        const payloadCreate = {
          ...data, // TODO: Normalize DTO payload helper
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
      } catch {
        // Mutation error state is handled by hook `error` values rendered below.
      }
    },
    [isEditMode, initialLog, metricId, updateMetricLog, createMetricLog, reset, onClose],
  );

  const onSubmitForm = useMemo(() => handleSubmit(onValid), [handleSubmit, onValid]);

  const handleFormSubmit: React.FormEventHandler<HTMLFormElement> = useCallback(
    (e) => {
      void onSubmitForm(e);
    },
    [onSubmitForm],
  );

  const deleteLogAsync = useCallback(async () => {
    if (!initialLog) return;
    try {
      await deleteMetricLog({ logId: initialLog.id, metricId });
      reset();
      onClose();
    } catch {
      // Mutation error state is handled by hook `error` values rendered below.
    }
  }, [initialLog, metricId, deleteMetricLog, reset, onClose]);

  const handleDeleteClick = useCallback(() => {
    void deleteLogAsync();
  }, [deleteLogAsync]);

  const handleCloseClick = useCallback(() => {
    onClose();
    reset();
  }, [onClose, reset]);

  const errorMsg = createError?.message || updateError?.message || deleteError?.message || "";
  const inputBg = "bg-surface2";

  if (!metricId) {
    return <p className="mb-4 mt-4 text-xs text-status-error">Metric ID is required to add a log.</p>;
  }

  return (
    <Modal isOpen onClose={handleCloseClick} title={formTitle}>
      <form
        noValidate
        className="mx-auto w-full p-4 lg:p-6"
        onSubmit={handleFormSubmit}
        autoComplete="off"
      >
        <ErrorMessage message={errorMsg} className="mb-2" />

        <div className="flex flex-col gap-4 lg:gap-6">
          <input type="hidden" {...register("metricId")} value={metricId} />

          <FormField invalid={!!errors.logValue} error={errors.logValue?.message}>
            <FormField.Label>Log Value</FormField.Label>
            <FormField.Control>
              <TextField
                type="number"
                registration={register("logValue", { valueAsNumber: true })}
                placeholder="e.g., 10000"
                leftAddon={<Lightning weight="duotone" className="text-ink-secondary" />}
                hasError={!!errors.logValue}
                disabled={isBusyInputs}
                clearable
                required
                wrapperClassName={cn(inputBg, "w-full")}
              />
            </FormField.Control>
          </FormField>

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

        <div className="mt-8 space-y-4">
          <Button
            type="submit"
            variant="primary"
            leftIcon={<FloppyDisk size={20} />}
            disabled={isBusyInputs || !isValid}
            block
          >
            {isSubmitting || isCreating || isUpdating ? "Saving..." : isEditMode ? "Save" : "Add"}
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
              {isDeleting ? "Deleting..." : "Delete Log"}
            </Button>
          ) : null}
        </div>
      </form>
    </Modal>
  );
};

export default MetricLogForm;
