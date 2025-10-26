"use client";

import clsx from "clsx";
import { Minus, Plus } from "phosphor-react";
import React, { useCallback, useMemo, useRef, useState } from "react";

type Size = "sm" | "md" | "lg";

export type SliderProps = {
  id?: string;
  value: number; // controlled
  onChange: (v: number) => void;
  onChangeEnd?: (v: number) => void; // fires on drag end / keyboard commit
  min?: number; // default 0
  max?: number; // default 100
  step?: number; // e.g., 1 | 5 | 10
  allowed?: number[]; // Override: restrict values to this set (sorted automatically), Overrides step.
  disabled?: boolean;
  size?: Size;
  className?: string;
  trackClassName?: string;

  // Visual indicator: inline text on the right, or bubble above the thumb
  showValue?: "none" | "inline" | "bubble";
  valueFormatter?: (v: number) => string; // default: `${v}`

  // Optionals: steppers on both sides
  showSteppers?: boolean;
  steppersStep?: number; // default to step or 1/20 of range

  // Optionals: tick marks (defaults to allowed if provided)
  marks?: number[];
  markLabel?: (v: number) => string | undefined;

  "aria-label"?: string;
  "aria-labelledby"?: string;
};

const SIZE: Record<Size, { trackH: string; thumb: string; bubble: string }> = {
  sm: { trackH: "h-1.5", thumb: "h-4 w-4", bubble: "text-xs px-2 py-0.5" },
  md: { trackH: "h-2", thumb: "h-5 w-5", bubble: "text-sm px-2 py-1" },
  lg: { trackH: "h-3", thumb: "h-6 w-6", bubble: "text-base px-2.5 py-1.5" },
};

const Slider = ({
  id,
  value,
  onChange,
  onChangeEnd,
  min = 0,
  max = 100,
  step = 1,
  allowed,
  disabled,
  size = "md",
  className,
  trackClassName,
  showSteppers = false,
  steppersStep,
  showValue = "inline",
  valueFormatter = (v) => `${v}`,
  marks,
  ...aria
}: SliderProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [thumbFocused, setThumbFocused] = useState(false);

  // Normalize constraints
  const [amin, amax] = min <= max ? [min, max] : [max, min];
  const allowedSorted = useMemo(
    () => (allowed ? Array.from(new Set(allowed)).sort((a, b) => a - b) : null),
    [allowed],
  );
  const effectiveMarks = marks ?? allowedSorted ?? null;

  const range = amax - amin;
  const clamp = useCallback((v: number) => Math.min(amax, Math.max(amin, v)), [amax, amin]);

  const snap = useCallback(
    (v: number) => {
      const c = clamp(v);
      if (allowedSorted && allowedSorted.length > 0) {
        // nearest allowed
        let best = allowedSorted[0];
        let diff = Math.abs(c - best);
        for (const n of allowedSorted) {
          const d = Math.abs(c - n);
          if (d < diff) {
            best = n;
            diff = d;
          }
        }
        return best;
      }
      // step snap
      const s = Math.max(0.000001, step);
      const snapped = Math.round((c - amin) / s) * s + amin;
      // Avoid IEEE floating drift
      const fixed = Number(snapped.toFixed(6));
      return clamp(fixed);
    },
    [amin, allowedSorted, step, clamp],
  );

  const percent = useMemo(() => {
    const p = range === 0 ? 0 : ((value - amin) / range) * 100;
    return Math.max(0, Math.min(100, p));
  }, [value, amin, range]);

  const computeFromPointer = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return value;
    const rect = el.getBoundingClientRect();
    const frac = rect.width === 0 ? 0 : (clientX - rect.left) / rect.width;
    return snap(amin + frac * range);
  };

  const beginDrag = (e: React.PointerEvent) => {
    if (disabled) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
    onChange(computeFromPointer(e.clientX));
  };
  const moveDrag = (e: React.PointerEvent) => {
    if (!dragging || disabled) return;
    onChange(computeFromPointer(e.clientX));
  };
  const endDrag = () => {
    if (!dragging) return;
    setDragging(false);
    onChangeEnd?.(value);
  };

  const keyStep = allowedSorted
    ? // move to next allowed value
      (v: number, dir: 1 | -1) => {
        const idx = indexOfNearest(allowedSorted, v);
        return clamp(allowedSorted[Math.min(allowedSorted.length - 1, Math.max(0, idx + dir))]);
      }
    : // move by step
      (v: number, dir: 1 | -1) => snap(v + dir * step);

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    let next: number | null = null;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      next = keyStep(value, -1);
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      next = keyStep(value, +1);
    } else if (e.key === "Home") {
      e.preventDefault();
      next = amin;
    } else if (e.key === "End") {
      e.preventDefault();
      next = amax;
    } else if (e.key === "PageUp") {
      e.preventDefault();
      next = snap(value + Math.max(step, range * 0.1));
    } else if (e.key === "PageDown") {
      e.preventDefault();
      next = snap(value - Math.max(step, range * 0.1));
    }
    if (next != null) {
      onChange(next);
      onChangeEnd?.(next);
    }
  };

  const decIncAmount = useMemo(() => {
    if (steppersStep && steppersStep > 0) return steppersStep;
    if (allowedSorted) {
      // default to the smallest gap in allowed
      let smallest = Infinity;
      for (let i = 1; i < allowedSorted.length; i++) {
        smallest = Math.min(smallest, allowedSorted[i] - allowedSorted[i - 1]);
      }
      return Number.isFinite(smallest) ? smallest : step;
    }
    return step > 0 ? step : Math.max(1, Math.round(range / 20));
  }, [steppersStep, allowedSorted, step, range]);

  const dec = () => !disabled && onChange(snap(value - decIncAmount));
  const inc = () => !disabled && onChange(snap(value + decIncAmount));

  const s = SIZE[size];
  const showBubble = showValue === "bubble" && (dragging || thumbFocused);

  return (
    <div className={clsx("flex items-center gap-3", className)}>
      {showSteppers ? (
        <button
          type="button"
          onClick={dec}
          disabled={disabled || value <= amin}
          className={clsx(
            "grid h-8 w-8 place-items-center rounded-lg border border-gray-200 bg-white text-gray-600",
            "hover:bg-violet-50 hover:text-violet-600 focus-visible:ring-2 focus-visible:ring-violet-400",
            (disabled || value <= amin) && "cursor-not-allowed opacity-50",
          )}
          aria-label="Decrease"
          title="Decrease"
        >
          <Minus size={16} />
        </button>
      ) : null}

      {/* Track */}
      <div
        ref={trackRef}
        className={clsx(
          "relative w-full select-none",
          s.trackH,
          "cursor-pointer rounded-full bg-gray-200",
          disabled && "cursor-not-allowed opacity-60",
          trackClassName,
        )}
        onPointerDown={beginDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {/* Filled range */}
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-violet-500"
          style={{ width: `${percent}%` }}
          aria-hidden
        />

        {/* Marks */}
        {effectiveMarks?.map((m) => {
          const p = ((clamp(m) - amin) / range) * 100;
          return (
            <div
              key={m}
              className="absolute top-1/2 h-2 w-0.5 -translate-y-1/2 bg-gray-300"
              style={{ left: `${p}%` }}
              aria-hidden
              title={aria["aria-label"] ? undefined : `${m}`}
            />
          );
        })}

        {/* Thumb */}
        <button
          id={id}
          type="button"
          role="slider"
          aria-valuemin={amin}
          aria-valuemax={amax}
          aria-valuenow={Math.round(value * 100000) / 100000}
          aria-valuetext={valueFormatter(value)}
          aria-disabled={disabled || undefined}
          aria-label={aria["aria-label"]}
          aria-labelledby={aria["aria-labelledby"]}
          disabled={disabled}
          onKeyDown={onKeyDown}
          onFocus={() => setThumbFocused(true)}
          onBlur={() => setThumbFocused(false)}
          className={clsx(
            "absolute top-1/2 -translate-y-1/2 translate-x-[-50%]",
            "grid place-items-center rounded-full bg-white shadow",
            "focus-visible:ring-2 focus-visible:ring-violet-400",
            s.thumb,
          )}
          style={{ left: `${percent}%` }}
        >
          {/* Bubble value */}
          {showBubble ? (
            <span
              className={clsx(
                "absolute -top-8 rounded-md bg-violet-600 text-white shadow",
                "whitespace-nowrap",
                s.bubble,
              )}
            >
              {valueFormatter(value)}
            </span>
          ) : null}
        </button>
      </div>

      {/* Inline indicator */}
      {showValue === "inline" && (
        <span className="min-w-[3ch] text-right text-sm font-medium text-violet-700">
          {valueFormatter(value)}
        </span>
      )}

      {showSteppers ? (
        <button
          type="button"
          onClick={inc}
          disabled={disabled || value >= amax}
          className={clsx(
            "grid h-8 w-8 place-items-center rounded-lg border border-gray-200 bg-white text-gray-600",
            "hover:bg-violet-50 hover:text-violet-600 focus-visible:ring-2 focus-visible:ring-violet-400",
            (disabled || value >= amax) && "cursor-not-allowed opacity-50",
          )}
          aria-label="Increase"
          title="Increase"
        >
          <Plus size={16} />
        </button>
      ) : null}
    </div>
  );
};

export default Slider;

/* ---------- helpers ---------- */

function indexOfNearest(arr: number[], v: number) {
  let idx = 0,
    best = Infinity;
  for (let i = 0; i < arr.length; i++) {
    const d = Math.abs(arr[i] - v);
    if (d < best) {
      best = d;
      idx = i;
    }
  }
  return idx;
}
