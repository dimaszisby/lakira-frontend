"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";

import type { MetricSettingsFormInputs } from "@/features/metric-settings/form";
import { metricSettingsFormSchema } from "@/features/metric-settings/form";
import { useCreateMetricSettings, useUpdateMetricSettings } from "@/features/metric-settings/hook";
import type { MetricSettingsExtendedVM } from "@/features/metric-settings/view-models";
import ErrorMessage from "@/ui/ErrorMessage";
import Modal from "@/ui/Modal";
import PrimaryButton from "@/ui/PrimaryButton";
import ReusableFormField from "@/ui/ReusableFormField";
import { toInputDate, toIsoFromLocalInput } from "@/utils/date-io";

interface MetricSettingsModalProps {
  open: boolean;
  onClose: () => void;
  metricId: string | null;
  initialSettings?: MetricSettingsExtendedVM | null;
}

export const MetricSettingsForm = ({
  open,
  onClose,
  metricId,
  initialSettings: initialSettings,
}: MetricSettingsModalProps) => {
  // TODO: Refactor
  // Default Form handling
  const makeDefaults = (
    set?: MetricSettingsExtendedVM | null,
    metricIdProp?: string | null,
  ): MetricSettingsFormInputs => ({
    // IMPORTANT: use prop as fallback for create-mode
    metricId: set?.metricId ?? metricIdProp ?? "",
    goalEnabled: Boolean(set?.goalEnabled),
    goalType: set?.goalType ?? undefined,
    goalValue: set?.goalValue ?? undefined,
    timeFrameEnabled: Boolean(set?.timeFrameEnabled),
    startDate: set?.startDate ?? undefined,
    deadlineDate: set?.deadlineDate ?? undefined,
    alertEnabled: Boolean(set?.alertEnabled),
    alertThresholds: set?.alertThresholds ?? 0,
    displayOptions: {
      showOnDashboard: Boolean(set?.displayOptions?.showOnDashboard),
      priority: set?.displayOptions?.priority ?? null,
      chartType: set?.displayOptions?.chartType ?? null,
      color: set?.displayOptions?.color ?? null,
    },
  });

  const defaults = useMemo(
    () => makeDefaults(initialSettings, metricId),
    [initialSettings, metricId],
  );

  const isEditMode = !!initialSettings;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
    watch,
    setValue,
    trigger,
  } = useForm<MetricSettingsFormInputs>({
    resolver: zodResolver(metricSettingsFormSchema),
    mode: "onChange",
    defaultValues: defaults,
    shouldUnregister: true,
  });

  // Rehydrate + immediately validate on open/change
  useEffect(() => {
    if (!open) return;
    reset(defaults);
    // Ensure metricId is present & valid for the resolver
    if (metricId) {
      setValue("metricId", metricId, { shouldValidate: true });
    }
    // Compute isValid right away (no user interaction required)
    void trigger();
  }, [open, defaults, reset, trigger, setValue, metricId]);

  // * ========== Mutations ==========
  const {
    createMetricSettings,
    isPending: isCreating,
    error: createError,
  } = useCreateMetricSettings();

  const {
    updateMetricSettings,
    isPending: isUpdating,
    error: updateError,
  } = useUpdateMetricSettings();

  // const {
  //   deleteMetricSettings,
  //   isPending: isDeleting,
  //   error: deleteError,
  // } = useDeleteMetricSettings();

  // * Submit Handlers
  const isBusyInputs = isSubmitting || isCreating || isUpdating;

  // * Submit Handlers
  const onSubmit = async (data: MetricSettingsFormInputs) => {
    if (!isValid) {
      console.warn("Form is not valid, preventing submission.");
      return;
    }

    if (!metricId) {
      console.error("Metric ID is required for settings.");
      return;
    }

    try {
      if (isEditMode && initialSettings) {
        await updateMetricSettings({
          settingsId: initialSettings.id!,
          metricId: metricId,
          settings: {
            goalEnabled: data.goalEnabled,
            goalType: data.goalType,
            goalValue: data.goalValue,
            timeFrameEnabled: data.timeFrameEnabled,
            startDate: data.startDate,
            deadlineDate: data.deadlineDate,
            alertEnabled: data.alertEnabled,
            alertThresholds: data.alertThresholds,
            displayOptions: data.displayOptions,
            // isActive and isAchieved currently managed by BE
          },
        });
      } else {
        await createMetricSettings({
          metricId: metricId,
          goalEnabled: data.goalEnabled,
          goalType: data.goalType,
          goalValue: data.goalValue,
          timeFrameEnabled: data.timeFrameEnabled,
          startDate: data.startDate,
          deadlineDate: data.deadlineDate,
          alertEnabled: data.alertEnabled,
          alertThresholds: data.alertThresholds,
          displayOptions: data.displayOptions,
        });
      }
      reset();
      onClose();
    } catch (error) {
      console.error("Error saving metric settings:", error);
    }
  };

  // const onDeleteSubmit = async () => {
  //   if (!initialSettings?.id || !metricId) return;
  //   try {
  //     await deleteMetricSettings({
  //       id: initialSettings.id,
  //       metricId: metricId,
  //     });
  //     reset();
  //     onClose();
  //   } catch (error) {
  //     console.error("Error deleting metric settings:", error);
  //   }
  // };

  const errorMsg = createError?.message || updateError?.message || "";

  return (
    <Modal isOpen={open} onClose={onClose}>
      <form
        className="mx-auto flex max-h-[80vh] min-w-96 max-w-lg flex-col overflow-y-auto bg-white p-2 sm:p-2 lg:p-6"
        onSubmit={
          void handleSubmit((data) => {
            if (Object.keys(errors).length > 0) return;
            void onSubmit(data);
          })
        }
      >
        <h2 className="mb-2 text-xl font-semibold">Manage Metric</h2>{" "}
        {/* keep schema happy: register metricId */}
        <input type="hidden" {...register("metricId")} />
        <ErrorMessage message={errorMsg} className="mb-2"></ErrorMessage>
        <div className="flex flex-col gap-8">
          {/* Goal Settings */}
          <h3 className="mb-2 mt-4 text-lg font-semibold">Goal Settings</h3>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="goalEnabled"
              {...register("goalEnabled")}
              disabled={isBusyInputs}
            />
            <label htmlFor="goalEnabled" className="text-sm">
              Enable Goal
            </label>
          </div>

          {watch("goalEnabled") && (
            <>
              <div className="mb-4">
                <label htmlFor="goalType" className="mb-1 block text-sm font-semibold">
                  Goal Type
                </label>
                <select
                  id="goalType"
                  {...register("goalType", {
                    setValueAs: (v) => (v === "" ? undefined : v),
                  })}
                  className="w-full rounded border px-3 py-2"
                  disabled={isBusyInputs}
                >
                  <option value="">Select Goal Type</option>
                  <option value="cumulative">Cumulative</option>
                  <option value="incremental">Incremental</option>
                </select>
                {errors.goalType ? (
                  <p className="text-xs text-red-500">{errors.goalType.message}</p>
                ) : null}
              </div>

              <div className="mb-4">
                <label htmlFor="goalValue" className="mb-1 block text-sm font-semibold">
                  Goal Value
                </label>
                <input
                  type="number"
                  id="goalValue"
                  {...register("goalValue", {
                    valueAsNumber: true,
                    setValueAs: (v) => (v === "" || v === null ? undefined : Number(v)),
                  })}
                  placeholder="e.g., 10000"
                  className="w-full rounded border px-3 py-2"
                  disabled={isBusyInputs}
                />
                {errors.goalValue ? (
                  <p className="text-xs text-red-500">{errors.goalValue.message}</p>
                ) : null}
              </div>
            </>
          )}

          {/* Time Frame Settings */}
          <h3 className="mb-2 mt-4 text-lg font-semibold">Time Frame Settings</h3>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="timeFrameEnabled"
              {...register("timeFrameEnabled")}
              disabled={isBusyInputs}
            />
            <label htmlFor="timeFrameEnabled" className="text-sm">
              Enable Time Frame
            </label>
          </div>

          {watch("timeFrameEnabled") && (
            <>
              <div className="mb-4">
                <label htmlFor="startDate" className="mb-1 block text-sm font-semibold">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  {...register("startDate", {
                    setValueAs: (v) => toIsoFromLocalInput(v),
                  })}
                  value={toInputDate(watch("startDate"))}
                  className="w-full rounded border px-3 py-2"
                  disabled={isBusyInputs}
                />
                {errors.startDate ? (
                  <p className="text-xs text-red-500">{errors.startDate.message}</p>
                ) : null}
              </div>
              <div className="mb-4">
                <label htmlFor="deadlineDate" className="mb-1 block text-sm font-semibold">
                  Deadline Date
                </label>
                <input
                  type="date"
                  id="deadlineDate"
                  {...register("deadlineDate", {
                    setValueAs: (v) => toIsoFromLocalInput(v),
                  })}
                  value={toInputDate(watch("deadlineDate"))}
                  className="w-full rounded border px-3 py-2"
                  disabled={isBusyInputs}
                />
                {errors.deadlineDate ? (
                  <p className="text-xs text-red-500">{errors.deadlineDate.message}</p>
                ) : null}
              </div>
            </>
          )}

          {/* Alert Settings */}
          <h3 className="mb-2 mt-4 text-lg font-semibold">Alert Settings</h3>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="alertEnabled"
              {...register("alertEnabled")}
              disabled={isBusyInputs}
            />
            <label htmlFor="alertEnabled" className="text-sm">
              Enable Alerts
            </label>
          </div>

          {watch("alertEnabled") && (
            <div className="mb-4">
              <label htmlFor="alertThresholds" className="mb-1 block text-sm font-semibold">
                Alert Thresholds (%)
              </label>
              <input
                type="number"
                id="alertThresholds"
                {...register("alertThresholds", { valueAsNumber: true })}
                placeholder="e.g., 80"
                className="w-full rounded border px-3 py-2"
                disabled={isBusyInputs}
              />
              {errors.alertThresholds ? (
                <p className="text-xs text-red-500">{errors.alertThresholds.message}</p>
              ) : null}
            </div>
          )}

          {/* Display Options */}
          <h3 className="mb-2 mt-4 text-lg font-semibold">Display Options</h3>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showOnDashboard"
              {...register("displayOptions.showOnDashboard")}
              disabled={isBusyInputs}
            />
            <label htmlFor="showOnDashboard" className="text-sm">
              Show on Dashboard
            </label>
          </div>

          <ReusableFormField
            label="Priority"
            type="number"
            register={register("displayOptions.priority", {
              valueAsNumber: true,
              setValueAs: (v) => (v === "" || v === null ? undefined : Number(v)),
            })}
            placeholder="e.g., 1"
            error={errors.displayOptions?.priority?.message}
            isSubmitting={isBusyInputs}
          />

          <div className="mb-4">
            <label htmlFor="chartType" className="mb-1 block text-sm font-semibold">
              Chart Type
            </label>
            <select
              id="chartType"
              {...register("displayOptions.chartType")}
              className="w-full rounded border px-3 py-2"
              disabled={isBusyInputs}
            >
              <option value="">Select Chart Type</option>
              <option value="line">Line</option>
              <option value="bar">Bar</option>
              <option value="area">Area</option>
              <option value="pie">Pie</option>
            </select>
            {errors.displayOptions?.chartType ? (
              <p className="text-xs text-red-500">{errors.displayOptions.chartType.message}</p>
            ) : null}
          </div>

          <div className="mb-4">
            <label htmlFor="color" className="mb-1 block text-sm font-semibold">
              Color
            </label>
            <input
              type="color"
              id="color"
              {...register("displayOptions.color")}
              className="h-10 w-full rounded border px-3 py-2"
              disabled={isBusyInputs}
            />
            {errors.displayOptions?.color ? (
              <p className="text-xs text-red-500">{errors.displayOptions.color.message}</p>
            ) : null}
          </div>
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
          {/* Currently Disabled as not part of MVP => only update feature */}
          {/* {isEditMode && (
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
                {isDeleting ? "Deleting..." : "Delete Settings"}
              </button>
            </>
          )} */}
        </div>
      </form>
    </Modal>
  );
};

export default MetricSettingsForm;
