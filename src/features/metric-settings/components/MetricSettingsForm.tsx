"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FloppyDisk, Tag, TrendUp } from "phosphor-react";
import { useCallback, useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";

import { CATEGORY_DEFAULTS } from "@/features/metric-categories/constants";
import type { MetricSettingsFormInputs } from "@/features/metric-settings/form";
import { metricSettingsFormSchema } from "@/features/metric-settings/form";
import {
  useCreateMetricSettings,
  useUpdateMetricSettings,
} from "@/features/metric-settings/hooks/index";
import type { MetricSettingsExtendedVM } from "@/features/metric-settings/view-models";
import { cn } from "@/src/lib/cn";
import Button from "@/ui/Button";
import ColorField from "@/ui/ColorField";
import DateTimePicker from "@/ui/DateTimePicker";
import ErrorMessage from "@/ui/ErrorMessage";
import { FormField } from "@/ui/FormField";
import Modal from "@/ui/Modal";
import type { SegmentOption } from "@/ui/SegmentedControl";
import SegmentedControl from "@/ui/SegmentedControl";
import type { SelectOption } from "@/ui/Select";
import Select from "@/ui/Select";
import Slider from "@/ui/Slider";
import TextField from "@/ui/TextField";
import Toggle from "@/ui/Toggle";
import { parseDate, toISODateOnly } from "@/utils/date-io";

import type { ChartType, GoalType } from "../constants";
import { CHART_OPT, GOAL_TYPE_OPT, PRIORITY_OPT } from "../constants";

interface Props {
  onClose: () => void;
  metricId: string; // non-nullable; ensure ownership
  initialSettings: MetricSettingsExtendedVM | null;
}

export const MetricSettingsForm = ({
  onClose,
  metricId,
  initialSettings: initialSettings,
}: Props) => {
  const isEditMode = !!initialSettings;

  // * Form
  // TODO: Refactor
  const makeDefaults = (
    set?: MetricSettingsExtendedVM | null,
    metricIdProp?: string | null,
  ): MetricSettingsFormInputs => ({
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
    watch,
    control,
  } = useForm<MetricSettingsFormInputs>({
    resolver: zodResolver(metricSettingsFormSchema),
    mode: "onChange",
    defaultValues: defaults,
    shouldUnregister: true,
  });

  useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  // Options
  const chartOptions: SelectOption<ChartType>[] = CHART_OPT;
  const goalTypeOptions: SegmentOption<GoalType>[] = GOAL_TYPE_OPT;
  const priorityOptions: SegmentOption<number>[] = PRIORITY_OPT;

  // * Mutations
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

  const isBusyInputs = isSubmitting || isCreating || isUpdating;

  // * Handlers
  const onValid = useCallback(
    async (data: MetricSettingsFormInputs) => {
      if (!metricId) {
        console.error("Metric ID is required for settings.");
        return;
      }

      try {
        // TODO: Normalize DTO payload helper
        const payloadCreate = {
          ...data,
          metricId: data.metricId,
        };

        if (isEditMode && initialSettings) {
          await updateMetricSettings({
            settingsId: initialSettings.id!,
            metricId: metricId,
            settings: payloadCreate,
          });
        } else {
          await createMetricSettings(payloadCreate);
        }
        reset();
        onClose();
      } catch (error) {
        console.error("Error saving metric settings:", error);
      }
    },
    [
      isEditMode,
      initialSettings,
      metricId,
      updateMetricSettings,
      createMetricSettings,
      reset,
      onClose,
    ],
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

  // Close
  const handleCloseClick = useCallback(() => {
    onClose();
    reset();
  }, [onClose, reset]);

  // Computed Values
  const errorMsg = createError?.message || updateError?.message || "";

  // * UI: Subsections
  const subSectionContainerClass =
    "flex flex-col gap-6 rounded rounded-xl bg-white p-4 border border-gray-100 transition";
  const subsectionHeaderClass = "flex items-center justify-between gap-2";

  const timeFrameSubSection = (
    <div className={subSectionContainerClass}>
      <div className={subsectionHeaderClass}>
        <Controller
          name="timeFrameEnabled" // string in your form DTO
          control={control}
          render={({ field }) => (
            <FormField
              invalid={!!errors.timeFrameEnabled}
              error={errors.timeFrameEnabled?.message}
              className="w-full flex-row items-center justify-between gap-2 space-y-0"
            >
              <FormField.Label className="text-md font-medium">Timeframe Enabled</FormField.Label>
              <FormField.Control>
                <Toggle
                  checked={!!field.value}
                  onCheckedChange={field.onChange}
                  onBlur={field.onBlur}
                  disabled={isBusyInputs}
                  size="md"
                  onLabel="ON"
                  offLabel=""
                  wrapperClassName="shrink-0"
                />
              </FormField.Control>
            </FormField>
          )}
        />
      </div>

      {watch("timeFrameEnabled") && (
        <>
          <Controller
            name="startDate" // string in your form DTO
            control={control}
            render={({ field }) => (
              <FormField invalid={!!errors.startDate} error={errors.startDate?.message}>
                <FormField.Label>Start Date</FormField.Label>
                <FormField.Control>
                  <DateTimePicker
                    mode="date"
                    value={parseDate(field.value)}
                    onChange={(d) => field.onChange(toISODateOnly(d))}
                    disabled={isBusyInputs}
                    aria-label="Start date"
                  />
                </FormField.Control>
              </FormField>
            )}
          />

          <Controller
            name="deadlineDate"
            control={control}
            render={({ field }) => (
              <FormField invalid={!!errors.deadlineDate} error={errors.deadlineDate?.message}>
                <FormField.Label>Deadline Date</FormField.Label>
                <FormField.Control>
                  <DateTimePicker
                    mode="date"
                    value={parseDate(field.value)}
                    onChange={(d) => field.onChange(toISODateOnly(d))}
                    minuteStep={5}
                    disabled={isBusyInputs}
                    aria-label="Deadline date and time"
                  />
                </FormField.Control>
              </FormField>
            )}
          />
        </>
      )}
    </div>
  );

  const alertSubSection = (
    <div className={subSectionContainerClass}>
      <div className={subsectionHeaderClass}>
        <Controller
          name="alertEnabled"
          control={control}
          render={({ field }) => (
            <FormField
              invalid={!!errors.alertEnabled}
              error={errors.alertEnabled?.message}
              className="w-full flex-row items-center justify-between gap-2 space-y-0"
            >
              <FormField.Label className="text-md font-medium">Alerts Enabled</FormField.Label>
              <FormField.Control>
                <Toggle
                  checked={!!field.value}
                  onCheckedChange={field.onChange}
                  onBlur={field.onBlur}
                  disabled={isBusyInputs}
                  size="md"
                  onLabel="ON"
                  offLabel=""
                  wrapperClassName="shrink-0"
                />
              </FormField.Control>
            </FormField>
          )}
        />
      </div>

      {watch("alertEnabled") && (
        <Controller
          name="alertThresholds"
          control={control}
          render={({ field }) => (
            <FormField invalid={!!errors.alertThresholds} error={errors.alertThresholds?.message}>
              <FormField.Label>Alert Threshold</FormField.Label>
              <FormField.Control>
                <Slider
                  id="alertThresholds"
                  value={field.value ?? 0}
                  onChange={(v) => field.onChange(v)}
                  min={0}
                  max={100}
                  step={5} // typical granularity
                  showValue="inline" // or "bubble"
                  valueFormatter={(v) => `${Math.round(v)}%`}
                  showSteppers
                  steppersStep={5}
                  marks={[0, 25, 50, 75, 100]} // light ticks
                  aria-label="Alert threshold percentage"
                />
              </FormField.Control>
            </FormField>
          )}
        />
      )}
    </div>
  );

  // * UI: Sections
  const sectionContainerClass =
    "flex flex-col gap-6 rounded-lg border border-gray-100 bg-gray-50 p-6 transition";

  const goalSections = (
    <div className={sectionContainerClass}>
      <Controller
        name="goalEnabled"
        control={control}
        render={({ field }) => (
          <FormField
            invalid={!!errors.goalEnabled}
            error={errors.goalEnabled?.message}
            className="w-full flex-row items-center justify-between gap-2 space-y-0 "
          >
            <FormField.Label className="text-lg font-semibold">Goal Enabled</FormField.Label>
            <FormField.Control>
              <Toggle
                checked={!!field.value}
                onCheckedChange={field.onChange}
                onBlur={field.onBlur}
                disabled={isBusyInputs}
                size="md"
                onLabel="ON"
                offLabel=""
                wrapperClassName="shrink-0"
              />
            </FormField.Control>
          </FormField>
        )}
      />

      {watch("goalEnabled") && (
        <>
          <Controller
            name="goalType"
            control={control}
            render={({ field }) => (
              <FormField invalid={!!errors.goalType} error={errors.goalType?.message}>
                <FormField.Label>Goal Type</FormField.Label>
                <FormField.Control>
                  <SegmentedControl
                    options={goalTypeOptions}
                    // value={field.value ?? null}
                    value={
                      watch("goalEnabled") === true && field.value !== null && field.value
                        ? field.value
                        : "incremental"
                    }
                    onChange={(v) => field.onChange(v)}
                    size="md"
                  />
                </FormField.Control>
              </FormField>
            )}
          />

          <FormField invalid={!!errors.goalValue} error={errors.goalValue?.message}>
            <FormField.Label>Goal Value</FormField.Label>
            <FormField.Control>
              <TextField
                id="goalValue"
                type="number"
                placeholder="e.g., 10000"
                registration={register("goalValue", {
                  valueAsNumber: true,
                  setValueAs: (v) => (v === "" || v === null ? undefined : Number(v)),
                })}
                leftAddon={<Tag weight="duotone" className="text-violet-500" />}
                hasError={!!errors.goalValue}
                clearable
              />
            </FormField.Control>
          </FormField>

          {timeFrameSubSection}

          {alertSubSection}
        </>
      )}
    </div>
  );

  const displayOptionsSection = (
    <div className={sectionContainerClass}>
      <h3 className="text-lg font-semibold">Display Options</h3>

      <Controller
        name="displayOptions.showOnDashboard"
        control={control}
        render={({ field }) => (
          <FormField
            invalid={!!errors.displayOptions?.showOnDashboard}
            error={errors.displayOptions?.showOnDashboard?.message}
            className="w-full flex-row items-center justify-between gap-2 space-y-0"
          >
            <FormField.Label>Show on Dashboard</FormField.Label>
            <FormField.Control>
              <Toggle
                checked={!!field.value}
                onCheckedChange={field.onChange}
                onBlur={field.onBlur}
                disabled={isBusyInputs}
                size="sm"
                onLabel=""
                offLabel=""
                wrapperClassName="shrink-0"
              />
            </FormField.Control>
          </FormField>
        )}
      />

      <Controller
        name="displayOptions.priority"
        control={control}
        render={({ field }) => (
          <FormField
            invalid={!!errors.displayOptions?.priority}
            error={errors.displayOptions?.priority?.message}
          >
            <FormField.Label>Priority</FormField.Label>
            <FormField.Control>
              <SegmentedControl
                options={priorityOptions}
                // value={field.value ?? null}
                value={
                  watch("displayOptions.showOnDashboard") === true &&
                  field.value !== null &&
                  field.value
                    ? field.value
                    : null
                }
                onChange={(v) => field.onChange(v)}
                size="md"
                className="w-auto"
              />
            </FormField.Control>
          </FormField>
        )}
      />

      <Controller
        name="displayOptions.chartType"
        control={control}
        render={({ field }) => (
          <FormField
            invalid={!!errors.displayOptions?.chartType}
            error={errors.displayOptions?.chartType?.message}
          >
            <FormField.Label>Chart Type</FormField.Label>
            <FormField.Control>
              <Select
                size="md"
                value={field.value ?? null}
                onChange={(v) => field.onChange(v)}
                options={chartOptions}
                placeholder="Select Chart Type"
                leftAddon={<TrendUp size={22} weight="duotone" />}
                // Example of "optional children on the most right"
                rightAddon={<span className="text-xs text-gray-400">⌘K</span>}
                aria-label="Chart type"
              />
            </FormField.Control>
          </FormField>
        )}
      />

      <Controller
        name="displayOptions.color"
        control={control}
        render={({ field }) => (
          <FormField
            invalid={!!errors.displayOptions?.color}
            error={errors.displayOptions?.color?.message}
          >
            <FormField.Label>Color</FormField.Label>
            <FormField.Control>
              <ColorField
                value={field.value ?? CATEGORY_DEFAULTS.color}
                onChange={field.onChange}
                disabled={isBusyInputs}
                aria-label="Chart color"
              />
            </FormField.Control>
          </FormField>
        )}
      />
    </div>
  );

  const hideScrollbar =
    "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]  overflow-y-auto";

  return (
    <Modal isOpen onClose={handleCloseClick}>
      <form
        noValidate
        className={cn(
          "mx-auto flex max-h-[80vh] min-w-96 max-w-xl flex-col bg-white transition-transform",
        )}
        onSubmit={handleFormSubmit}
      >
        <h2 className="mb-2 text-xl font-semibold">Metric Settings</h2>
        <ErrorMessage message={errorMsg} className="mb-2"></ErrorMessage>

        {/* Fields */}
        <div className={cn(hideScrollbar)}>
          <input type="hidden" {...register("metricId")} value={metricId} />
          {goalSections}
          {displayOptionsSection}
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

          {/* Dev Note: Delete Button currently not added as not part of MVP => only update feature */}
        </div>
      </form>
    </Modal>
  );
};

export default MetricSettingsForm;
