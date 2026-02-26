"use client";

import { CaretDown, PencilSimple } from "phosphor-react";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/cn";

import type { RelativeLast, TimeRangeValue } from "../types";

const DEFAULT_RELATIVE_LAST: RelativeLast = "30d";
const THIRTY_DAYS_MS = 30 * 86_400_000;
const RELATIVE_RE = /^\d+(h|d|w|m|y)$/i;

type Props = {
  value: TimeRangeValue;
  onChange: (v: TimeRangeValue) => void;
  className?: string;
};

const TimeRangePicker = ({ value, onChange, className }: Props) => {
  const isRelativeMode = value.mode === "relative";
  const relativeInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (value.mode !== "relative") return;
    if (!relativeInputRef.current) return;
    relativeInputRef.current.value = value.last;
  }, [value]);

  const handleRangeModeChange = (nextMode: "relative" | "absolute") => {
    if (nextMode === value.mode) return;

    if (nextMode === "relative") {
      const currentDraft = relativeInputRef.current?.value ?? DEFAULT_RELATIVE_LAST;
      const next = normalizeRelativeLast(currentDraft) ?? DEFAULT_RELATIVE_LAST;
      onChange({ mode: "relative", last: next });
      return;
    }

    onChange({ mode: "absolute", ...toDefaultAbsoluteRange() });
  };

  const handleRelativeInputChange = (raw: string) => {
    const normalized = normalizeRelativeLast(raw);
    if (!normalized) return;
    onChange({ mode: "relative", last: normalized });
  };

  const handleRelativeInputBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const normalized = normalizeRelativeLast(event.target.value);
    if (normalized) {
      event.target.value = normalized;
      return;
    }
    if (value.mode === "relative") {
      event.target.value = value.last;
      return;
    }
    event.target.value = DEFAULT_RELATIVE_LAST;
  };

  const handleAbsoluteStartChange = (localValue: string) => {
    const currentAbsolute = value.mode === "absolute" ? value : toDefaultAbsoluteRange();
    onChange({
      mode: "absolute",
      start: toIsoFromLocal(localValue),
      end: currentAbsolute.end,
    });
  };

  const handleAbsoluteEndChange = (localValue: string) => {
    const currentAbsolute = value.mode === "absolute" ? value : toDefaultAbsoluteRange();
    onChange({
      mode: "absolute",
      start: currentAbsolute.start,
      end: toIsoFromLocal(localValue),
    });
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative inline-flex items-center">
        <select
          aria-label="Range mode"
          className="w-full appearance-none rounded-xl border border-border bg-bg py-2 pl-3 pr-6 text-sm outline-none ring-0 focus:border-brand-accent"
          value={value.mode}
          onChange={(e) => handleRangeModeChange(e.target.value as "relative" | "absolute")}
        >
          <option value="relative">Last</option>
          <option value="absolute">Custom</option>
        </select>

        <span
          className="pointer-events-none absolute inset-y-0 right-2 flex items-center"
          aria-hidden="true"
        >
          <CaretDown size={14} className="text-brand-accent" />
        </span>
      </div>

      <div className="flex flex-row items-center gap-2">
        {isRelativeMode ? (
          <div className="relative flex h-9 w-28 flex-row items-center overflow-clip rounded-xl border-border bg-bg">
            <input
              aria-label="Last"
              className="h-full w-full rounded-xl border border-border bg-transparent px-3 outline-none ring-0 focus:border-brand-accent"
              placeholder="e.g. 7d"
              pattern={RELATIVE_RE.source}
              title="Format: number + unit (h,d,w,m,y). Example: 7d"
              defaultValue={value.mode === "relative" ? value.last : DEFAULT_RELATIVE_LAST}
              ref={relativeInputRef}
              onChange={(e) => handleRelativeInputChange(e.target.value)}
              onBlur={handleRelativeInputBlur}
            />

            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center" aria-hidden="true">
              <PencilSimple size={16} className="text-brand-accent" />
            </span>
          </div>
        ) : (
          <>
            <input
              type="datetime-local"
              className="rounded-xl border px-2 py-1 outline-none ring-0 focus:border-brand-accent"
              aria-label="Start"
              value={value.mode === "absolute" ? toLocal(value.start) : ""}
              onChange={(e) => handleAbsoluteStartChange(e.target.value)}
            />
            <input
              type="datetime-local"
              className="rounded-xl border px-2 py-1 outline-none ring-0 focus:border-brand-accent"
              aria-label="End"
              value={value.mode === "absolute" ? toLocal(value.end) : ""}
              onChange={(e) => handleAbsoluteEndChange(e.target.value)}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default TimeRangePicker;

// helpers
function toLocal(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function toIsoFromLocal(localValue: string) {
  if (!localValue) return "";
  const parsed = new Date(localValue);
  if (!Number.isFinite(parsed.getTime())) return "";
  return parsed.toISOString();
}

function toDefaultAbsoluteRange() {
  const end = new Date().toISOString();
  const start = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();
  return { start, end };
}

function normalizeRelativeLast(value: string): RelativeLast | null {
  const normalized = value.trim().toLowerCase();
  return isRelativeLast(normalized) ? normalized : null;
}

function isRelativeLast(s: string): s is RelativeLast {
  return RELATIVE_RE.test(s);
}
