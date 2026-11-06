"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FloppyDisk, Lightning, Trash } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import {
  useCreateMetricLog,
  useDeleteMetricLog,
  useUpdateMetricLog,
} from "@/features/metric-logs/hooks";
import type { LogFormFields, LogFormInputs } from "@/features/metric-logs/types";
import { logFormSchema } from "@/features/metric-logs/types";
import type { MetricLogVM } from "@/features/metric-logs/view-models";
import { cn } from "@/lib/cn";
import { handleApiError } from "@/services/api/handleApiError";
import type {
  CreateMetricLogRequestDTO,
  UpdateMetricLogRequestDTO,
} from "@/types/dtos/metric-log.dto";
import { Button } from "@/ui/Button";
import { DateTimePicker } from "@/ui/DateTimePicker";
import { ErrorMessage } from "@/ui/ErrorMessage";
import { FormField } from "@/ui/FormField";
import { Modal } from "@/ui/Modal";
import { TextField } from "@/ui/TextField";
import { parseDate, toISOZExact } from "@/utils/date-io";

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
  } = useForm<LogFormFields, unknown, LogFormInputs>({
    resolver: zodResolver(logFormSchema),
    mode: "onChange",
    defaultValues: defaults,
  });

  useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  const { createMetricLog, isPending: isCreating } = useCreateMetricLog();

  const { updateMetricLog, isPending: isUpdating } = useUpdateMetricLog();

  const { deleteMetricLog, isPending: isDeleting } = useDeleteMetricLog();

  // The error of the latest action. Each mutation keeps its own `error` until it runs again, so
  // picking among them would show a Save refusal after a newer Delete refusal.
  const [actionError, setActionError] = useState<Error | null>(null);

  const isBusyInputs = isSubmitting || isCreating || isUpdating || isDeleting;

  const onValid = useCallback(
    async (data: LogFormInputs) => {
      setActionError(null);
      try {
        // The exact time, not rounded to the minute: the backend keeps one log per timestamp, so
        // rounding refused a second value in the same minute and moved a log's time on every edit.
        const payloadCreate = {
          ...data, // TODO: Normalize DTO payload helper
          loggedAt: toISOZExact(data.loggedAt),
        } satisfies CreateMetricLogRequestDTO;

        const payloadUpdate = {
          ...data,
          loggedAt: toISOZExact(data.loggedAt),
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
        setActionError(error as Error);
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
    setActionError(null);
    try {
      await deleteMetricLog({ logId: initialLog.id, metricId });
      reset();
      onClose();
    } catch (error) {
      setActionError(error as Error);
    }
  }, [initialLog, metricId, deleteMetricLog, reset, onClose]);

  const handleDeleteClick = useCallback(() => {
    void deleteLogAsync();
  }, [deleteLogAsync]);

  const handleCloseClick = useCallback(() => {
    onClose();
    reset();
  }, [onClose, reset]);

  const errorMsg = useMemo(
    () => (actionError ? handleApiError(actionError).join(", ") : ""),
    [actionError],
  );
  const inputBg = "bg-surface2";

  if (!metricId) {
    return (
      <p className="mb-4 mt-4 text-xs text-status-error">Metric ID is required to add a log.</p>
    );
  }

  return (
    <Modal open onClose={handleCloseClick} title={formTitle}>
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
                {...register("logValue", { valueAsNumber: true })}
                placeholder="e.g., 10000"
                leftAddon={<Lightning weight="duotone" className="text-ink-secondary" />}
                invalid={!!errors.logValue}
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
                    onChange={(d) => field.onChange(d)}
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
