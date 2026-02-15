"use client";

import { Minus, Plus } from "phosphor-react";
import { useCallback, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/cn";

type Size = "sm" | "md" | "lg";

export type SliderProps = {
  id?: string;
  value: number;
  onChange: (v: number) => void;
  onChangeEnd?: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  allowed?: number[];
  disabled?: boolean;
  size?: Size;
  className?: string;
  trackClassName?: string;
  showValue?: "none" | "inline" | "bubble";
  valueFormatter?: (v: number) => string;
  showSteppers?: boolean;
  steppersStep?: number;
  marks?: number[];
  markLabel?: (v: number) => string | undefined;
  "aria-label"?: string;
  "aria-labelledby"?: string;
};

const SIZE: Record<Size, { trackH: string; thumb: string; bubble: string }> = {
  sm: { trackH: "h-1.5", thumb: "h-4 w-4", bubble: "px-2 py-0.5 text-xs" },
  md: { trackH: "h-2", thumb: "h-5 w-5", bubble: "px-2 py-1 text-sm" },
  lg: { trackH: "h-3", thumb: "h-6 w-6", bubble: "px-2.5 py-1.5 text-base" },
};

const SWIPE_STEP_FRACTION = 0.1;

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
  markLabel,
  ...aria
}: SliderProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [thumbFocused, setThumbFocused] = useState(false);

  const [amin, amax] = min <= max ? [min, max] : [max, min];
  const range = amax - amin;
  const safeStep = Math.max(0.000001, step);

  const allowedSorted = useMemo(
    () => (allowed ? Array.from(new Set(allowed)).sort((a, b) => a - b) : null),
    [allowed],
  );

  const clamp = useCallback((nextValue: number) => Math.min(amax, Math.max(amin, nextValue)), [amax, amin]);

  const snap = useCallback(
    (nextValue: number) => {
      const clamped = clamp(nextValue);
      if (allowedSorted && allowedSorted.length > 0) {
        return getNearest(allowedSorted, clamped);
      }
      const snapped = Math.round((clamped - amin) / safeStep) * safeStep + amin;
      return clamp(Number(snapped.toFixed(6)));
    },
    [allowedSorted, amin, clamp, safeStep],
  );

  const currentValue = useMemo(() => snap(value), [snap, value]);

  const effectiveMarks = useMemo(() => marks ?? allowedSorted ?? null, [allowedSorted, marks]);

  const percent = useMemo(() => {
    if (range <= 0) return 0;
    return Math.min(100, Math.max(0, ((currentValue - amin) / range) * 100));
  }, [amin, currentValue, range]);

  const computeFromPointer = (clientX: number) => {
    const track = trackRef.current;
    if (!track || range <= 0) return currentValue;
    const rect = track.getBoundingClientRect();
    const fraction = rect.width === 0 ? 0 : (clientX - rect.left) / rect.width;
    return snap(amin + fraction * range);
  };

  const beginDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const next = computeFromPointer(event.clientX);
    setDragging(true);
    onChange(next);
  };

  const moveDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || disabled) return;
    onChange(computeFromPointer(event.clientX));
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const next = computeFromPointer(event.clientX);
    setDragging(false);
    onChange(next);
    onChangeEnd?.(next);
  };

  const keyStep = useMemo(
    () =>
      allowedSorted
        ? (current: number, direction: 1 | -1) => {
            const index = indexOfNearest(allowedSorted, current);
            return clamp(
              allowedSorted[Math.min(allowedSorted.length - 1, Math.max(0, index + direction))],
            );
          }
        : (current: number, direction: 1 | -1) => snap(current + direction * safeStep),
    [allowedSorted, clamp, safeStep, snap],
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    let next: number | null = null;
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      next = keyStep(currentValue, -1);
    } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      next = keyStep(currentValue, 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      next = amin;
    } else if (event.key === "End") {
      event.preventDefault();
      next = amax;
    } else if (event.key === "PageUp") {
      event.preventDefault();
      next = snap(currentValue + Math.max(safeStep, range * SWIPE_STEP_FRACTION));
    } else if (event.key === "PageDown") {
      event.preventDefault();
      next = snap(currentValue - Math.max(safeStep, range * SWIPE_STEP_FRACTION));
    }

    if (next == null) return;
    onChange(next);
    onChangeEnd?.(next);
  };

  const decrementIncrementAmount = useMemo(() => {
    if (steppersStep && steppersStep > 0) return steppersStep;
    if (allowedSorted && allowedSorted.length > 1) {
      let smallestGap = Infinity;
      for (let i = 1; i < allowedSorted.length; i++) {
        smallestGap = Math.min(smallestGap, allowedSorted[i] - allowedSorted[i - 1]);
      }
      if (Number.isFinite(smallestGap)) return smallestGap;
    }
    if (safeStep > 0) return safeStep;
    return Math.max(1, Math.round(range / 20));
  }, [allowedSorted, range, safeStep, steppersStep]);

  const dec = () => {
    if (disabled) return;
    const next = snap(currentValue - decrementIncrementAmount);
    onChange(next);
    onChangeEnd?.(next);
  };

  const inc = () => {
    if (disabled) return;
    const next = snap(currentValue + decrementIncrementAmount);
    onChange(next);
    onChangeEnd?.(next);
  };

  const sliderSize = SIZE[size];
  const showBubble = showValue === "bubble" && (dragging || thumbFocused);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {showSteppers ? (
        <button
          type="button"
          onClick={dec}
          disabled={disabled || currentValue <= amin}
          className={cn(
            "grid h-8 w-8 place-items-center rounded-lg border border-border bg-surface text-ink-secondary",
            "hover:bg-surface2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            (disabled || currentValue <= amin) && "cursor-not-allowed opacity-50",
          )}
          aria-label="Decrease"
          title="Decrease"
        >
          <Minus size={16} />
        </button>
      ) : null}

      <div
        ref={trackRef}
        className={cn(
          "relative w-full select-none rounded-full bg-surface2",
          "cursor-pointer",
          sliderSize.trackH,
          disabled && "cursor-not-allowed opacity-60",
          trackClassName,
        )}
        onPointerDown={beginDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-brand-primary"
          style={{ width: `${percent}%` }}
          aria-hidden
        />

        {effectiveMarks?.map((mark) => {
          const p = range <= 0 ? 0 : ((clamp(mark) - amin) / range) * 100;
          const label = markLabel?.(mark);
          return (
            <div
              key={mark}
              className="absolute top-1/2 -translate-y-1/2"
              style={{ left: `${p}%` }}
              aria-hidden
            >
              <div className="h-2 w-0.5 bg-border" />
              {label ? (
                <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap text-[10px] text-ink-tertiary">
                  {label}
                </span>
              ) : null}
            </div>
          );
        })}

        <button
          id={id}
          type="button"
          role="slider"
          aria-valuemin={amin}
          aria-valuemax={amax}
          aria-valuenow={Number(currentValue.toFixed(6))}
          aria-valuetext={valueFormatter(currentValue)}
          aria-disabled={disabled || undefined}
          aria-orientation="horizontal"
          aria-label={aria["aria-label"]}
          aria-labelledby={aria["aria-labelledby"]}
          disabled={disabled}
          onKeyDown={onKeyDown}
          onFocus={() => setThumbFocused(true)}
          onBlur={() => setThumbFocused(false)}
          className={cn(
            "absolute top-1/2 -translate-x-1/2 -translate-y-1/2",
            "grid place-items-center rounded-full border border-border bg-surface shadow-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            sliderSize.thumb,
          )}
          style={{ left: `${percent}%` }}
        >
          {showBubble ? (
            <span
              className={cn(
                "absolute -top-8 whitespace-nowrap rounded-md bg-brand-primary text-ink-inverted shadow",
                sliderSize.bubble,
              )}
            >
              {valueFormatter(currentValue)}
            </span>
          ) : null}
        </button>
      </div>

      {showValue === "inline" ? (
        <span className="min-w-[3ch] text-right text-sm font-medium text-ink-secondary">
          {valueFormatter(currentValue)}
        </span>
      ) : null}

      {showSteppers ? (
        <button
          type="button"
          onClick={inc}
          disabled={disabled || currentValue >= amax}
          className={cn(
            "grid h-8 w-8 place-items-center rounded-lg border border-border bg-surface text-ink-secondary",
            "hover:bg-surface2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            (disabled || currentValue >= amax) && "cursor-not-allowed opacity-50",
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

function indexOfNearest(items: number[], value: number) {
  let nearestIndex = 0;
  let nearestDistance = Infinity;
  for (let i = 0; i < items.length; i++) {
    const distance = Math.abs(items[i] - value);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = i;
    }
  }
  return nearestIndex;
}

function getNearest(items: number[], value: number) {
  return items[indexOfNearest(items, value)];
}
