"use client";

import { Radio, RadioGroup, RadioProvider } from "@ariakit/react";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/cn";

type SegmentedControlSize = "sm" | "md" | "lg";
type SegmentValue = string | number;

export type SegmentOption<T extends SegmentValue = string> = {
  value: T;
  label: string;
  /** Extra context shown as a tooltip; the visible label stays the accessible name. */
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
};

export type SegmentedControlProps<T extends SegmentValue = string> = {
  id?: string;
  options: SegmentOption<T>[];
  value: T | null;
  onChange: (next: T, option: SegmentOption<T>) => void;
  size?: SegmentedControlSize;
  variant?: "default" | "pill";
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
};

/**
 * A single-choice radio group styled as segments. Arrow keys move focus and select,
 * as the WAI-ARIA radio group pattern requires.
 */
export const SegmentedControl = <T extends SegmentValue = string>({
  id,
  options,
  value,
  onChange,
  size = "md",
  variant = "default",
  disabled = false,
  fullWidth = true,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: SegmentedControlProps<T>) => {
  // Repeated clicks can land before the parent re-renders with the new value;
  // remember the last emitted value so the same choice is not emitted twice.
  const lastEmittedRef = useRef<T | null>(value);

  useEffect(() => {
    lastEmittedRef.current = value;
  }, [value]);

  const handleSetValue = (next: SegmentValue | null) => {
    const option = options.find((candidate) => candidate.value === next);
    if (!option || option.disabled || disabled) return;
    if (option.value === lastEmittedRef.current) return;
    lastEmittedRef.current = option.value;
    onChange(option.value, option);
  };

  return (
    <RadioProvider value={value} setValue={handleSetValue}>
      <RadioGroup
        id={id}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-disabled={disabled || undefined}
        data-size={size}
        data-variant={variant}
        data-full-width={fullWidth ? "" : undefined}
        className={cn("segmented", className)}
      >
        {options.map((option) => {
          const isDisabled = disabled || option.disabled;

          // Each segment is a label around a visually hidden native radio: Ariakit only
          // selects on arrow-key focus for real <input type="radio"> elements.
          //
          // form="" detaches the radio from any enclosing <form>. react-hook-form's bare
          // reset() calls the native form.reset(), which would restore the radio to its
          // initial unchecked state without React noticing, so the selection vanished.
          // The radio has no name and is never submitted; the value flows via onChange.
          return (
            <label
              key={String(option.value)}
              title={option.description}
              data-disabled={isDisabled ? "" : undefined}
              className="segmented-item"
            >
              <Radio
                value={option.value}
                disabled={isDisabled}
                form=""
                className="segmented-input"
              />
              {option.icon}
              <span>{option.label}</span>
            </label>
          );
        })}
      </RadioGroup>
    </RadioProvider>
  );
};
