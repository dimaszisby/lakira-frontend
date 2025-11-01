"use client";

import { CalendarBlank, CaretLeft, CaretRight, Clock } from "phosphor-react";
import React, { useEffect, useId, useMemo, useRef, useState } from "react";

import { cn } from "@/src/lib/cn";

type Mode = "date" | "datetime";

export type DateTimePickerProps = {
  id?: string;
  mode?: Mode;
  value: Date | null; // controlled (Date object)
  onChange: (next: Date | null) => void;

  min?: Date;
  max?: Date;
  minuteStep?: number; // for time mode, default 5
  disabled?: boolean;
  className?: string;

  // display formatting (Intl options)
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
  timeFormat = { hour: "numeric", minute: "2-digit" }, // 12h/24h decided by locale
  ...aria
}: DateTimePickerProps) => {
  const uid = useId();
  const triggerId = id ?? `dtp-${uid}`;
  const popId = `${triggerId}-popover`;

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState<number>(() => (value ?? new Date()).getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(() => (value ?? new Date()).getMonth());
  const wrapperRef = useRef<HTMLDivElement>(null);

  // click outside
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!wrapperRef.current?.contains(t)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  // keep calendar view in sync with selected value
  useEffect(() => {
    if (value) {
      setViewYear(value.getFullYear());
      setViewMonth(value.getMonth());
    }
  }, [value]);

  const displayedDate = useMemo(() => {
    const d = value ?? null;
    const dateStr = d ? new Intl.DateTimeFormat(undefined, dateFormat).format(d) : "Select date";
    const timeStr =
      mode === "datetime" && d ? new Intl.DateTimeFormat(undefined, timeFormat).format(d) : null;
    return { dateStr, timeStr };
  }, [value, mode, dateFormat, timeFormat]);

  // calendar helpers
  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startDay = firstOfMonth.getDay(); // 0..6
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  const cells = useMemo(() => {
    // 6 weeks grid = 42 cells
    const out: {
      date: Date;
      currentMonth: boolean;
      disabled: boolean;
    }[] = [];
    for (let i = 0; i < 42; i++) {
      const dayNum = i - startDay + 1; // can be <=0 or > daysInMonth
      let d: Date;
      let currentMonth = true;
      if (dayNum <= 0) {
        d = new Date(viewYear, viewMonth - 1, prevMonthDays + dayNum);
        currentMonth = false;
      } else if (dayNum > daysInMonth) {
        d = new Date(viewYear, viewMonth + 1, dayNum - daysInMonth);
        currentMonth = false;
      } else {
        d = new Date(viewYear, viewMonth, dayNum);
      }
      const isBeforeMin = min ? stripTime(d) < stripTime(min) : false;
      const isAfterMax = max ? stripTime(d) > stripTime(max) : false;
      out.push({ date: d, currentMonth, disabled: isBeforeMin || isAfterMax });
    }
    return out;
  }, [startDay, daysInMonth, prevMonthDays, viewYear, viewMonth, min, max]);

  const commitDate = (d: Date) => {
    if (mode === "date") {
      // preserve no time (set to 00:00 local)
      const nd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      onChange(nd);
      setOpen(false);
    } else {
      // preserve existing time if present
      const base = value ?? new Date();
      const nd = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        base.getHours(),
        base.getMinutes(),
        0,
        0,
      );
      onChange(nd);
    }
  };

  const shiftMonth = (delta: number) => {
    const dt = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(dt.getFullYear());
    setViewMonth(dt.getMonth());
  };

  const handleKeyCalendar = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!open) return;
    // Basic a11y: PgUp/PgDn switch month; Shift+PgUp/PgDn switch year
    if (e.key === "PageUp") {
      e.preventDefault();
      shiftMonth(e.shiftKey ? -12 : -1);
    } else if (e.key === "PageDown") {
      e.preventDefault();
      shiftMonth(e.shiftKey ? 12 : 1);
    }
  };

  // time controls (for datetime)
  const hours = value?.getHours() ?? 12;
  const minutes = value?.getMinutes() ?? 0;
  const isPM = hours >= 12;
  const hour12 = ((hours + 11) % 12) + 1; // 1..12

  const setTime = (h12: number, pm: boolean, m: number) => {
    const d = value ?? new Date();
    let h24 = h12 % 12;
    if (pm) h24 += 12;
    const nd = new Date(d);
    nd.setHours(h24, m, 0, 0);
    onChange(nd);
  };

  const minuteChoices = useMemo(() => {
    const arr: number[] = [];
    for (let m = 0; m < 60; m += Math.max(1, Math.min(60, minuteStep))) arr.push(m);
    return arr;
  }, [minuteStep]);

  return (
    <div ref={wrapperRef} className={cn("relative", className)} onKeyDown={handleKeyCalendar}>
      {/* Trigger */}
      <button
        id={triggerId}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={popId}
        aria-label={
          aria["aria-label"] ?? (mode === "date" ? "Choose date" : "Choose date and time")
        }
        onClick={() => !disabled && setOpen((s) => !s)}
        disabled={disabled}
        className={cn(
          "flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-5 py-3 shadow-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400",
          "hover:bg-violet-50",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        )}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="truncate text-base font-medium text-gray-900">
            {displayedDate.dateStr}
          </span>
          {mode === "datetime" && displayedDate.timeStr ? (
            <>
              <span className="h-2 w-2 rounded-full bg-violet-300" aria-hidden />
              <span className="truncate text-base font-medium text-gray-900">
                {displayedDate.timeStr}
              </span>
            </>
          ) : null}
        </span>
        <CalendarBlank size={22} className="text-violet-500" />
      </button>

      {/* Popover */}
      {open ? (
        <div
          id={popId}
          role="dialog"
          aria-modal="true"
          className="absolute z-50 mt-2 w-[22rem] rounded-2xl border border-gray-200 bg-white p-3 shadow-xl"
        >
          {/* Header */}
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="rounded-md p-2 hover:bg-violet-50 focus-visible:ring-2 focus-visible:ring-violet-400"
              aria-label="Previous month"
            >
              <CaretLeft size={18} />
            </button>
            <div className="text-sm font-semibold text-gray-700">
              {new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(
                new Date(viewYear, viewMonth, 1),
              )}
            </div>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="rounded-md p-2 hover:bg-violet-50 focus-visible:ring-2 focus-visible:ring-violet-400"
              aria-label="Next month"
            >
              <CaretRight size={18} />
            </button>
          </div>

          {/* Weekday header */}
          <div className="grid grid-cols-7 gap-1 px-1 pb-1 text-center text-[11px] text-gray-400">
            {WEEKDAY_SHORT.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map(({ date, currentMonth, disabled: cellDisabled }, i) => {
              const isSelected = !!value && sameDate(date, value) && currentMonth;
              return (
                <button
                  key={i}
                  type="button"
                  role="gridcell"
                  aria-selected={isSelected}
                  aria-haspopup="dialog"
                  aria-expanded={open}
                  aria-controls={popId}
                  disabled={cellDisabled}
                  onClick={() => {
                    if (!cellDisabled) commitDate(date);
                  }}
                  className={cn(
                    "h-9 rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400",
                    isSelected
                      ? "bg-violet-500 font-semibold text-white"
                      : currentMonth
                        ? "text-gray-800 hover:bg-violet-50"
                        : "text-gray-400 hover:bg-violet-50",
                    cellDisabled && "cursor-not-allowed opacity-40",
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Time section */}
          {mode === "datetime" && (
            <>
              <div className="my-3 h-px w-full bg-gray-100" />
              <div className="flex items-center gap-3">
                <Clock className="text-violet-500" size={18} />
                {/* Hour */}
                <select
                  value={hour12}
                  onChange={(e) => setTime(parseInt(e.target.value, 10), isPM, minutes)}
                  className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <span className="text-gray-400">:</span>
                {/* Minute */}
                <select
                  value={closestStep(minutes, minuteChoices)}
                  onChange={(e) => setTime(hour12, isPM, parseInt(e.target.value, 10))}
                  className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm"
                >
                  {minuteChoices.map((m) => (
                    <option key={m} value={m}>
                      {String(m).padStart(2, "0")}
                    </option>
                  ))}
                </select>
                {/* AM/PM */}
                <select
                  value={isPM ? "PM" : "AM"}
                  onChange={(e) => setTime(hour12, e.target.value === "PM", minutes)}
                  className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
                <div className="ml-auto">
                  <button
                    type="button"
                    className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700"
                    onClick={() => setOpen(false)}
                  >
                    Done
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default DateTimePicker;

/* ---------- utils ---------- */

function sameDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function stripTime(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function closestStep(v: number, steps: number[]) {
  let best = steps[0],
    diff = Math.abs(v - steps[0]);
  for (const s of steps) {
    const d = Math.abs(v - s);
    if (d < diff) {
      best = s;
      diff = d;
    }
  }
  return best;
}
