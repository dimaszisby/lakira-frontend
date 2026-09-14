"use client";

import {
  Composite,
  CompositeItem,
  CompositeProvider,
  CompositeRow,
  Popover,
  PopoverDisclosure,
  PopoverHeading,
  PopoverProvider,
} from "@ariakit/react";
import { CalendarBlank, CaretLeft, CaretRight, Clock } from "@phosphor-icons/react";
import type { KeyboardEvent, RefObject } from "react";
import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/cn";

import { Button } from "./Button";

type DateTimePickerMode = "date" | "datetime";

export type DateTimePickerProps = {
  id?: string;
  mode?: DateTimePickerMode;
  value: Date | null;
  onChange: (next: Date | null) => void;
  min?: Date;
  max?: Date;
  minuteStep?: number;
  disabled?: boolean;
  className?: string;
  dateFormat?: Intl.DateTimeFormatOptions;
  timeFormat?: Intl.DateTimeFormatOptions;
  "aria-label"?: string;
};

type DayCell = { date: Date; key: string; inMonth: boolean; disabled: boolean };

const WEEKDAY_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const DAYS_PER_WEEK = 7;
const WEEKS_SHOWN = 6;
const DEFAULT_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "short",
  year: "numeric",
};
const DEFAULT_TIME_FORMAT: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
const DAY_LABEL_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
};

const sameDate = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const stripTime = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const isValidDate = (value?: Date): value is Date =>
  Boolean(value && Number.isFinite(value.getTime()));

const clampDateTime = (value: Date, min?: Date, max?: Date) => {
  if (isValidDate(min) && value.getTime() < min.getTime()) return new Date(min.getTime());
  if (isValidDate(max) && value.getTime() > max.getTime()) return new Date(max.getTime());
  return value;
};

const closestStep = (value: number, steps: number[]) =>
  steps.reduce(
    (best, step) => (Math.abs(value - step) < Math.abs(value - best) ? step : best),
    steps[0] ?? 0,
  );

/** Six full weeks starting on the Sunday on or before the first of the month. */
const buildMonthCells = (year: number, month: number, min?: Date, max?: Date): DayCell[] => {
  const startOffset = new Date(year, month, 1).getDay();

  return Array.from({ length: DAYS_PER_WEEK * WEEKS_SHOWN }, (_, index) => {
    const date = new Date(year, month, index - startOffset + 1);
    const isBeforeMin = min ? stripTime(date) < stripTime(min) : false;
    const isAfterMax = max ? stripTime(date) > stripTime(max) : false;
    return {
      date,
      key: toDateKey(date),
      inMonth: date.getMonth() === month,
      disabled: isBeforeMin || isAfterMax,
    };
  });
};

export const DateTimePicker = ({
  id,
  mode = "date",
  value,
  onChange,
  min,
  max,
  minuteStep = 5,
  disabled = false,
  className,
  dateFormat = DEFAULT_DATE_FORMAT,
  timeFormat = DEFAULT_TIME_FORMAT,
  "aria-label": ariaLabel,
}: DateTimePickerProps) => {
  const fallbackId = useId();
  const triggerId = id ?? `dtp-${fallbackId}`;
  const dayId = (key: string) => `${triggerId}-day-${key}`;

  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => {
    const base = value ?? new Date();
    return { year: base.getFullYear(), month: base.getMonth() };
  });

  // Time changes can follow a date pick before the parent re-renders with it.
  const latestValueRef = useRef<Date | null>(value);
  const initialDayRef = useRef<HTMLButtonElement | null>(null);
  const focusDayAfterMonthChangeRef = useRef(false);

  useEffect(() => {
    latestValueRef.current = value;
  }, [value]);

  const cells = buildMonthCells(view.year, view.month, min, max);
  const selectedKey =
    value && value.getFullYear() === view.year && value.getMonth() === view.month
      ? toDateKey(value)
      : null;
  const initialDayKey =
    cells.find((cell) => cell.key === selectedKey && !cell.disabled)?.key ??
    cells.find((cell) => cell.inMonth && !cell.disabled)?.key ??
    null;

  // PageUp/PageDown re-renders the grid for another month; keep focus on a day.
  useEffect(() => {
    if (!focusDayAfterMonthChangeRef.current) return;
    focusDayAfterMonthChangeRef.current = false;
    initialDayRef.current?.focus();
  }, [view]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && value) setView({ year: value.getFullYear(), month: value.getMonth() });
    setOpen(nextOpen);
  };

  const shiftMonth = (delta: number) => {
    setView((current) => {
      const next = new Date(current.year, current.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  };

  const commitDate = (date: Date) => {
    setView({ year: date.getFullYear(), month: date.getMonth() });

    if (mode === "date") {
      const normalized = stripTime(date);
      latestValueRef.current = normalized;
      onChange(normalized);
      setOpen(false);
      return;
    }

    const base = latestValueRef.current ?? value ?? new Date();
    const next = clampDateTime(
      new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        base.getHours(),
        base.getMinutes(),
      ),
      min,
      max,
    );
    latestValueRef.current = next;
    onChange(next);
  };

  const handleGridKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "PageUp" && event.key !== "PageDown") return;
    event.preventDefault();
    const months = event.shiftKey ? 12 : 1;
    focusDayAfterMonthChangeRef.current = true;
    shiftMonth(event.key === "PageUp" ? -months : months);
  };

  const hours = value?.getHours() ?? 12;
  const minutes = value?.getMinutes() ?? 0;
  const isPM = hours >= 12;
  const hour12 = ((hours + 11) % 12) + 1;
  const minuteChoices = Array.from(
    { length: Math.ceil(60 / Math.max(1, Math.min(60, Math.floor(minuteStep)))) },
    (_, index) => index * Math.max(1, Math.min(60, Math.floor(minuteStep))),
  );

  const setTime = (hour: number, pm: boolean, minute: number) => {
    const next = new Date(latestValueRef.current ?? value ?? new Date());
    next.setHours((hour % 12) + (pm ? 12 : 0), minute, 0, 0);
    const clamped = clampDateTime(next, min, max);
    latestValueRef.current = clamped;
    onChange(clamped);
  };

  const monthLabel = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(
    new Date(view.year, view.month, 1),
  );
  const dateText = value
    ? new Intl.DateTimeFormat(undefined, dateFormat).format(value)
    : "Select date";
  const timeText =
    mode === "datetime" && value
      ? new Intl.DateTimeFormat(undefined, timeFormat).format(value)
      : null;
  const dayLabelFormatter = new Intl.DateTimeFormat(undefined, DAY_LABEL_FORMAT);
  const today = new Date();

  return (
    <PopoverProvider open={open} setOpen={handleOpenChange}>
      <PopoverDisclosure
        id={triggerId}
        disabled={disabled}
        aria-label={ariaLabel ?? (mode === "date" ? "Choose date" : "Choose date and time")}
        data-size="md"
        data-disabled={disabled ? "" : undefined}
        className={cn("input-shell picker-trigger", className)}
      >
        <span className="picker-value" data-placeholder={value ? undefined : ""}>
          <span>{dateText}</span>
          {timeText ? (
            <>
              <span aria-hidden="true" className="picker-separator" />
              <span>{timeText}</span>
            </>
          ) : null}
        </span>
        <CalendarBlank aria-hidden className="picker-icon" />
      </PopoverDisclosure>

      <Popover
        gutter={8}
        unmountOnHide
        initialFocus={initialDayRef as RefObject<HTMLElement>}
        className="popover calendar"
      >
        <div className="calendar-header">
          <button
            type="button"
            className="calendar-nav"
            aria-label="Previous month"
            onClick={() => shiftMonth(-1)}
          >
            <CaretLeft aria-hidden />
          </button>
          <PopoverHeading render={<div />} className="calendar-heading">
            {monthLabel}
          </PopoverHeading>
          <button
            type="button"
            className="calendar-nav"
            aria-label="Next month"
            onClick={() => shiftMonth(1)}
          >
            <CaretRight aria-hidden />
          </button>
        </div>

        <CompositeProvider
          key={`${view.year}-${view.month}`}
          defaultActiveId={initialDayKey ? dayId(initialDayKey) : undefined}
        >
          <Composite
            role="grid"
            aria-label={`Calendar dates for ${monthLabel}`}
            className="calendar-grid"
            onKeyDown={handleGridKeyDown}
          >
            <div role="row" className="calendar-row">
              {WEEKDAY_SHORT.map((weekday) => (
                <div key={weekday} role="columnheader" className="calendar-weekday">
                  {weekday}
                </div>
              ))}
            </div>

            {Array.from({ length: WEEKS_SHOWN }, (_, week) => (
              <CompositeRow key={week} role="row" className="calendar-row">
                {cells.slice(week * DAYS_PER_WEEK, (week + 1) * DAYS_PER_WEEK).map((cell) => {
                  const isSelected = cell.key === selectedKey;

                  return (
                    <div key={cell.key} role="gridcell" aria-selected={isSelected}>
                      <CompositeItem
                        id={dayId(cell.key)}
                        ref={cell.key === initialDayKey ? initialDayRef : undefined}
                        render={<button type="button" />}
                        disabled={cell.disabled}
                        aria-label={dayLabelFormatter.format(cell.date)}
                        aria-current={sameDate(cell.date, today) ? "date" : undefined}
                        data-date={cell.key}
                        data-current-month={cell.inMonth ? "true" : "false"}
                        data-outside-month={cell.inMonth ? undefined : ""}
                        data-selected={isSelected ? "" : undefined}
                        className="calendar-day"
                        onClick={() => commitDate(cell.date)}
                      >
                        {cell.date.getDate()}
                      </CompositeItem>
                    </div>
                  );
                })}
              </CompositeRow>
            ))}
          </Composite>
        </CompositeProvider>

        {mode === "datetime" ? (
          <div className="calendar-time">
            <Clock aria-hidden className="picker-icon" />
            <select
              aria-label="Select hour"
              value={hour12}
              onChange={(event) => setTime(Number(event.target.value), isPM, minutes)}
              className="calendar-time-select"
            >
              {Array.from({ length: 12 }, (_, index) => index + 1).map((hour) => (
                <option key={hour} value={hour}>
                  {hour}
                </option>
              ))}
            </select>
            <span aria-hidden="true" className="calendar-time-separator">
              :
            </span>
            <select
              aria-label="Select minute"
              value={closestStep(minutes, minuteChoices)}
              onChange={(event) => setTime(hour12, isPM, Number(event.target.value))}
              className="calendar-time-select"
            >
              {minuteChoices.map((minute) => (
                <option key={minute} value={minute}>
                  {String(minute).padStart(2, "0")}
                </option>
              ))}
            </select>
            <select
              aria-label="Select meridiem"
              value={isPM ? "PM" : "AM"}
              onChange={(event) => setTime(hour12, event.target.value === "PM", minutes)}
              className="calendar-time-select"
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
            <Button size="sm" className="calendar-time-done" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        ) : null}
      </Popover>
    </PopoverProvider>
  );
};
