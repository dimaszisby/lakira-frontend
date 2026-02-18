"use client";

import { CalendarBlank, CaretLeft, CaretRight, Clock } from "phosphor-react";
import React, { useEffect, useId, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/cn";

type Mode = "date" | "datetime";

export type DateTimePickerProps = {
  id?: string;
  mode?: Mode;
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

const WEEKDAY_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const DateTimePicker = ({
  id,
  mode = "date",
  value,
  onChange,
  min,
  max,
  minuteStep = 5,
  disabled,
  className,
  dateFormat = { day: "2-digit", month: "short", year: "numeric" },
  timeFormat = { hour: "numeric", minute: "2-digit" },
  ...aria
}: DateTimePickerProps) => {
  const uid = useId();
  const triggerId = id ?? `dtp-${uid}`;
  const popoverId = `${triggerId}-popover`;
  const headingId = `${triggerId}-heading`;

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState<number>(() => (value ?? new Date()).getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(() => (value ?? new Date()).getMonth());

  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dayRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (wrapperRef.current?.contains(target)) return;
      setOpen(false);
      requestAnimationFrame(() => triggerRef.current?.focus());
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      requestAnimationFrame(() => triggerRef.current?.focus());
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const displayedDate = useMemo(() => {
    const nextDate = value ?? null;
    const dateStr = nextDate
      ? new Intl.DateTimeFormat(undefined, dateFormat).format(nextDate)
      : "Select date";
    const timeStr =
      mode === "datetime" && nextDate
        ? new Intl.DateTimeFormat(undefined, timeFormat).format(nextDate)
        : null;

    return { dateStr, timeStr };
  }, [value, mode, dateFormat, timeFormat]);

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startDay = firstOfMonth.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  const cells = useMemo(() => {
    const output: Array<{ date: Date; currentMonth: boolean; disabled: boolean; key: string }> = [];

    for (let i = 0; i < 42; i++) {
      const dayNum = i - startDay + 1;
      let nextDate: Date;
      let currentMonth = true;

      if (dayNum <= 0) {
        nextDate = new Date(viewYear, viewMonth - 1, prevMonthDays + dayNum);
        currentMonth = false;
      } else if (dayNum > daysInMonth) {
        nextDate = new Date(viewYear, viewMonth + 1, dayNum - daysInMonth);
        currentMonth = false;
      } else {
        nextDate = new Date(viewYear, viewMonth, dayNum);
      }

      const isBeforeMin = min ? stripTime(nextDate) < stripTime(min) : false;
      const isAfterMax = max ? stripTime(nextDate) > stripTime(max) : false;

      output.push({
        date: nextDate,
        currentMonth,
        disabled: isBeforeMin || isAfterMax,
        key: toDateKey(nextDate),
      });
    }

    return output;
  }, [daysInMonth, max, min, prevMonthDays, startDay, viewMonth, viewYear]);

  useEffect(() => {
    if (!open) return;

    const selectedInView =
      value && value.getFullYear() === viewYear && value.getMonth() === viewMonth ? value : null;

    const firstFocusableCell =
      cells.find((cell) => selectedInView && sameDate(cell.date, selectedInView) && !cell.disabled) ??
      cells.find((cell) => cell.currentMonth && !cell.disabled);

    if (!firstFocusableCell) return;

    requestAnimationFrame(() => {
      dayRefs.current[firstFocusableCell.key]?.focus();
    });
  }, [cells, open, value, viewMonth, viewYear]);

  const closePopover = () => {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const commitDate = (nextDate: Date) => {
    setViewYear(nextDate.getFullYear());
    setViewMonth(nextDate.getMonth());

    if (mode === "date") {
      const normalized = new Date(
        nextDate.getFullYear(),
        nextDate.getMonth(),
        nextDate.getDate(),
        0,
        0,
        0,
        0,
      );
      onChange(normalized);
      closePopover();
      return;
    }

    const base = value ?? new Date();
    const normalized = new Date(
      nextDate.getFullYear(),
      nextDate.getMonth(),
      nextDate.getDate(),
      base.getHours(),
      base.getMinutes(),
      0,
      0,
    );
    onChange(normalized);
  };

  const shiftMonth = (delta: number) => {
    const dt = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(dt.getFullYear());
    setViewMonth(dt.getMonth());
  };

  const handleCalendarKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!open) return;

    if (event.key === "PageUp") {
      event.preventDefault();
      shiftMonth(event.shiftKey ? -12 : -1);
      return;
    }

    if (event.key === "PageDown") {
      event.preventDefault();
      shiftMonth(event.shiftKey ? 12 : 1);
    }
  };

  const hours = value?.getHours() ?? 12;
  const minutes = value?.getMinutes() ?? 0;
  const isPM = hours >= 12;
  const hour12 = ((hours + 11) % 12) + 1;

  const setTime = (hour: number, pm: boolean, minute: number) => {
    const nextDate = value ?? new Date();
    const hour24 = hour % 12 + (pm ? 12 : 0);
    const normalized = new Date(nextDate);
    normalized.setHours(hour24, minute, 0, 0);
    onChange(normalized);
  };

  const normalizedStep = Math.max(1, Math.min(60, Math.floor(minuteStep)));
  const minuteChoices = useMemo(() => {
    const output: number[] = [];
    for (let minute = 0; minute < 60; minute += normalizedStep) output.push(minute);
    return output;
  }, [normalizedStep]);

  const monthLabel = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(
    new Date(viewYear, viewMonth, 1),
  );

  return (
    <div ref={wrapperRef} className={cn("relative", className)} onKeyDown={handleCalendarKeyDown}>
      <button
        id={triggerId}
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={popoverId}
        aria-label={aria["aria-label"] ?? (mode === "date" ? "Choose date" : "Choose date and time")}
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => {
            if (prev) return false;
            if (value) {
              setViewYear(value.getFullYear());
              setViewMonth(value.getMonth());
            }
            return true;
          });
        }}
        disabled={disabled}
        className={cn(
          "flex w-full items-center justify-between rounded-2xl border border-border bg-surface px-5 py-3 shadow-sm",
          "hover:bg-surface2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        )}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="truncate text-base font-medium text-ink">{displayedDate.dateStr}</span>
          {mode === "datetime" && displayedDate.timeStr ? (
            <>
              <span className="h-2 w-2 rounded-full bg-brand-primary/35" aria-hidden />
              <span className="truncate text-base font-medium text-ink">{displayedDate.timeStr}</span>
            </>
          ) : null}
        </span>
        <CalendarBlank size={22} className="text-brand-primary" />
      </button>

      {open ? (
        <div
          id={popoverId}
          role="dialog"
          aria-modal="false"
          aria-labelledby={headingId}
          className="absolute z-50 mt-2 w-[22rem] rounded-2xl border border-border bg-surface p-3 shadow-xl"
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="rounded-md p-2 hover:bg-surface2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Previous month"
            >
              <CaretLeft size={18} />
            </button>
            <h2 id={headingId} className="text-sm font-semibold text-ink-secondary">
              {monthLabel}
            </h2>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="rounded-md p-2 hover:bg-surface2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Next month"
            >
              <CaretRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 px-1 pb-1 text-center text-[11px] text-ink-tertiary">
            {WEEKDAY_SHORT.map((weekday) => (
              <div key={weekday}>{weekday}</div>
            ))}
          </div>

          <div role="group" aria-label={`Calendar dates for ${monthLabel}`} className="grid grid-cols-7 gap-1">
            {cells.map(({ date, currentMonth, disabled: cellDisabled, key }) => {
              const isSelected = !!value && sameDate(date, value) && currentMonth;
              const isToday = sameDate(date, new Date());

              return (
                <button
                  key={key}
                  ref={(node) => {
                    dayRefs.current[key] = node;
                  }}
                  type="button"
                  data-date={key}
                  data-current-month={currentMonth ? "true" : "false"}
                  aria-label={new Intl.DateTimeFormat(undefined, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }).format(date)}
                  aria-pressed={isSelected}
                  aria-current={isToday ? "date" : undefined}
                  disabled={cellDisabled}
                  onClick={() => {
                    if (!cellDisabled) commitDate(date);
                  }}
                  className={cn(
                    "h-9 rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isSelected
                      ? "bg-brand-primary font-semibold text-ink-inverted"
                      : currentMonth
                        ? "text-ink hover:bg-surface2"
                        : "text-ink-tertiary hover:bg-surface2",
                    cellDisabled && "cursor-not-allowed opacity-40",
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {mode === "datetime" ? (
            <>
              <div className="my-3 h-px w-full bg-border" />
              <div className="flex items-center gap-3">
                <Clock className="text-brand-primary" size={18} />
                <select
                  aria-label="Select hour"
                  value={hour12}
                  onChange={(event) => setTime(parseInt(event.target.value, 10), isPM, minutes)}
                  className="rounded-lg border border-border bg-surface px-2 py-1 text-sm text-ink"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}
                    </option>
                  ))}
                </select>
                <span className="text-ink-tertiary">:</span>
                <select
                  aria-label="Select minute"
                  value={closestStep(minutes, minuteChoices)}
                  onChange={(event) => setTime(hour12, isPM, parseInt(event.target.value, 10))}
                  className="rounded-lg border border-border bg-surface px-2 py-1 text-sm text-ink"
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
                  className="rounded-lg border border-border bg-surface px-2 py-1 text-sm text-ink"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
                <div className="ml-auto">
                  <button
                    type="button"
                    className="rounded-lg bg-brand-primary px-3 py-1.5 text-sm font-medium text-ink-inverted hover:bg-brand-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={closePopover}
                  >
                    Done
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default DateTimePicker;

function sameDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function stripTime(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function closestStep(value: number, steps: number[]) {
  let best = steps[0] ?? 0;
  let diff = Math.abs(value - best);

  for (const step of steps) {
    const nextDiff = Math.abs(value - step);
    if (nextDiff < diff) {
      best = step;
      diff = nextDiff;
    }
  }

  return best;
}
