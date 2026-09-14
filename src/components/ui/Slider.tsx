"use client";

import { Minus, Plus } from "@phosphor-icons/react";
import type { ComponentProps, CSSProperties, KeyboardEvent, PointerEvent } from "react";
import { useRef, useState } from "react";

import { cn } from "@/lib/cn";

type SliderSize = "sm" | "md" | "lg";

export type SliderProps = {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  /** Called once a change is complete: pointer release, key press, or stepper click. */
  onChangeEnd?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Restricts the value to these points instead of `step`. */
  allowed?: number[];
  disabled?: boolean;
  size?: SliderSize;
  className?: string;
  trackClassName?: string;
  showValue?: "none" | "inline" | "bubble";
  valueFormatter?: (value: number) => string;
  showSteppers?: boolean;
  steppersStep?: number;
  marks?: number[];
  markLabel?: (value: number) => string | undefined;
  "aria-label"?: string;
  "aria-labelledby"?: string;
};

const PAGE_STEP_FRACTION = 0.1;

const indexOfNearest = (items: number[], value: number) => {
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
};

type StepperButtonProps = Omit<ComponentProps<"button">, "children"> & {
  direction: "decrease" | "increase";
};

const StepperButton = ({ direction, className, ...props }: StepperButtonProps) => {
  const label = direction === "decrease" ? "Decrease" : "Increase";
  const Icon = direction === "decrease" ? Minus : Plus;

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn("slider-stepper", className)}
      {...props}
    >
      <Icon aria-hidden />
    </button>
  );
};

/** Custom properties the slider recipe reads for positions. */
const cssVars = (vars: Record<`--${string}`, string>) => vars as CSSProperties;

export const Slider = ({
  id,
  value,
  onChange,
  onChangeEnd,
  min = 0,
  max = 100,
  step = 1,
  allowed,
  disabled = false,
  size = "md",
  className,
  trackClassName,
  showValue = "inline",
  valueFormatter = String,
  showSteppers = false,
  steppersStep,
  marks,
  markLabel,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: SliderProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isThumbFocused, setIsThumbFocused] = useState(false);

  const lower = Math.min(min, max);
  const upper = Math.max(min, max);
  const range = upper - lower;
  const safeStep = Math.max(0.000001, step);
  const allowedSorted = allowed ? Array.from(new Set(allowed)).sort((a, b) => a - b) : null;

  const clamp = (next: number) => Math.min(upper, Math.max(lower, next));

  const snap = (next: number) => {
    const clamped = clamp(next);
    if (allowedSorted && allowedSorted.length > 0) {
      return allowedSorted[indexOfNearest(allowedSorted, clamped)];
    }
    const snapped = Math.round((clamped - lower) / safeStep) * safeStep + lower;
    return clamp(Number(snapped.toFixed(6)));
  };

  const currentValue = snap(value);
  const percent =
    range <= 0 ? 0 : Math.min(100, Math.max(0, ((currentValue - lower) / range) * 100));
  const effectiveMarks = marks ?? allowedSorted;

  const commit = (next: number) => {
    onChange(next);
    onChangeEnd?.(next);
  };

  const valueFromPointer = (clientX: number) => {
    const track = trackRef.current;
    if (!track || range <= 0) return currentValue;
    const rect = track.getBoundingClientRect();
    const fraction = rect.width === 0 ? 0 : (clientX - rect.left) / rect.width;
    return snap(lower + fraction * range);
  };

  const beginDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    onChange(valueFromPointer(event.clientX));
  };

  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging || disabled) return;
    onChange(valueFromPointer(event.clientX));
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    commit(valueFromPointer(event.clientX));
  };

  const stepFrom = (current: number, direction: 1 | -1) => {
    if (allowedSorted) {
      const index = indexOfNearest(allowedSorted, current);
      return clamp(
        allowedSorted[Math.min(allowedSorted.length - 1, Math.max(0, index + direction))],
      );
    }
    return snap(current + direction * safeStep);
  };

  const valueForKey = (key: string) => {
    const pageStep = Math.max(safeStep, range * PAGE_STEP_FRACTION);
    switch (key) {
      case "ArrowLeft":
      case "ArrowDown":
        return stepFrom(currentValue, -1);
      case "ArrowRight":
      case "ArrowUp":
        return stepFrom(currentValue, 1);
      case "Home":
        return lower;
      case "End":
        return upper;
      case "PageUp":
        return snap(currentValue + pageStep);
      case "PageDown":
        return snap(currentValue - pageStep);
      default:
        return null;
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const next = valueForKey(event.key);
    if (next === null) return;
    event.preventDefault();
    commit(next);
  };

  const stepperAmount = (() => {
    if (steppersStep && steppersStep > 0) return steppersStep;
    if (allowedSorted && allowedSorted.length > 1) {
      let smallestGap = Infinity;
      for (let i = 1; i < allowedSorted.length; i++) {
        smallestGap = Math.min(smallestGap, allowedSorted[i] - allowedSorted[i - 1]);
      }
      if (Number.isFinite(smallestGap)) return smallestGap;
    }
    return safeStep;
  })();

  const showBubble = showValue === "bubble" && (isDragging || isThumbFocused);

  return (
    <div
      data-size={size}
      data-disabled={disabled ? "" : undefined}
      className={cn("slider", className)}
    >
      {showSteppers ? (
        <StepperButton
          direction="decrease"
          disabled={disabled || currentValue <= lower}
          onClick={() => commit(snap(currentValue - stepperAmount))}
        />
      ) : null}

      <div
        ref={trackRef}
        className={cn("slider-track", trackClassName)}
        style={cssVars({ "--slider-percent": `${percent}%` })}
        onPointerDown={beginDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div aria-hidden="true" className="slider-fill" />

        {effectiveMarks?.map((mark) => {
          const position = range <= 0 ? 0 : ((clamp(mark) - lower) / range) * 100;
          const label = markLabel?.(mark);
          return (
            <div
              key={mark}
              aria-hidden="true"
              className="slider-mark"
              style={cssVars({ "--slider-mark-position": `${position}%` })}
            >
              <span className="slider-mark-tick" />
              {label ? <span className="slider-mark-label">{label}</span> : null}
            </div>
          );
        })}

        <div
          id={id}
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-valuemin={lower}
          aria-valuemax={upper}
          aria-valuenow={Number(currentValue.toFixed(6))}
          aria-valuetext={valueFormatter(currentValue)}
          aria-orientation="horizontal"
          aria-disabled={disabled || undefined}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsThumbFocused(true)}
          onBlur={() => setIsThumbFocused(false)}
          className="slider-thumb"
        >
          {showBubble ? (
            <span className="slider-bubble">{valueFormatter(currentValue)}</span>
          ) : null}
        </div>
      </div>

      {showValue === "inline" ? (
        <span className="slider-value">{valueFormatter(currentValue)}</span>
      ) : null}

      {showSteppers ? (
        <StepperButton
          direction="increase"
          disabled={disabled || currentValue >= upper}
          onClick={() => commit(snap(currentValue + stepperAmount))}
        />
      ) : null}
    </div>
  );
};
