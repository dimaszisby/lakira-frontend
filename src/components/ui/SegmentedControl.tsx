"use client";

import React, { useCallback, useId } from "react";

import { cn } from "@/src/lib/cn";

type Size = "sm" | "md" | "lg";
type V = string | number;

export type SegmentOption<T extends V = string> = {
  value: T;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
};

export type SegmentedControlProps<T extends V = string> = {
  id?: string;
  options: SegmentOption<T>[];
  value: T | null;
  onChange: (next: T, option?: SegmentOption<T>) => void;
  size?: Size;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
};

// Dev Note: Padding might be fine-tuned in the future
const SIZING: Record<Size, { itemPad: string; font: string; height: string }> = {
  sm: { itemPad: "px-3 py-0.5", font: "text-sm", height: "h-9" },
  md: { itemPad: "px-4 py-1", font: "text-base", height: "h-11" },
  lg: { itemPad: "px-5 py-1.5", font: "text-lg", height: "h-13" },
};

const SegmentedControl = <T extends V = string>({
  id,
  options,
  value,
  onChange,
  size = "md",
  disabled = false,
  fullWidth = true,
  className,
  ...aria
}: SegmentedControlProps<T>) => {
  const uid = useId();
  const groupId = id ?? `seg-${uid}`;
  const sizing = SIZING[size];

  const currentIdx = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );

  const selectByIndex = useCallback(
    (idx: number) => {
      const opt = options[idx];
      if (!opt || opt.disabled || disabled) return;
      onChange(opt.value, opt);
    },
    [options, onChange, disabled],
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;

    e.preventDefault();
    const max = options.length - 1;

    if (e.key === "ArrowLeft") {
      let i = currentIdx - 1;
      while (i >= 0 && options[i].disabled) i--;
      selectByIndex(Math.max(0, i));
    } else if (e.key === "ArrowRight") {
      let i = currentIdx + 1;
      while (i <= max && options[i].disabled) i++;
      selectByIndex(Math.min(max, i));
    } else if (e.key === "Home") {
      let i = 0;
      while (i <= max && options[i].disabled) i++;
      selectByIndex(i);
    } else if (e.key === "End") {
      let i = max;
      while (i >= 0 && options[i].disabled) i--;
      selectByIndex(i);
    }
  };

  return (
    <div
      id={groupId}
      role="radiogroup"
      aria-disabled={disabled || undefined}
      onKeyDown={onKeyDown}
      className={cn(
        "relative inline-grid grid-flow-col items-center gap-2 rounded-2xl border border-gray-200 bg-white p-1 shadow-sm",
        sizing.height,
        fullWidth ? "w-full" : "w-auto",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
      {...aria}
    >
      {options.map((opt, idx) => {
        const selected = value === opt.value;
        return (
          <button
            key={`${String(opt.value)}-${idx}`}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-disabled={opt.disabled || disabled || undefined}
            tabIndex={selected ? 0 : -1} // roving tabindex
            disabled={disabled || opt.disabled}
            onClick={() => selectByIndex(idx)}
            className={cn(
              "flex items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400",
              sizing.itemPad,
              sizing.font,
              "min-w-[4rem]", // Dev Note: Items min-sizing; fine-tune later
              selected
                ? "bg-violet-500 text-white shadow"
                : "bg-white text-gray-600 hover:bg-violet-50",
            )}
          >
            {opt.icon ? <span className="mr-2">{opt.icon}</span> : null}
            <span className="whitespace-nowrap">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default SegmentedControl;
