"use client";

import type { KeyboardEvent, ReactNode } from "react";
import React, { useId } from "react";

import { cn } from "@/lib/cn";

type Size = "sm" | "md" | "lg";
type Value = string | number;

export type SegmentOption<T extends Value = string> = {
  value: T;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
};

export type SegmentedControlProps<T extends Value = string> = {
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

const SIZING: Record<Size, { itemPad: string; font: string; height: string }> = {
  sm: { itemPad: "px-3 py-0.5", font: "text-sm", height: "h-9" },
  md: { itemPad: "px-4 py-1", font: "text-base", height: "h-11" },
  lg: { itemPad: "px-5 py-1.5", font: "text-lg", height: "h-14" },
};

function findFirstEnabledIndex<T extends Value>(options: SegmentOption<T>[]) {
  return options.findIndex((option) => !option.disabled);
}

function findLastEnabledIndex<T extends Value>(options: SegmentOption<T>[]) {
  for (let i = options.length - 1; i >= 0; i--) {
    if (!options[i]?.disabled) return i;
  }
  return -1;
}

function getNextEnabledIndex<T extends Value>(
  options: SegmentOption<T>[],
  currentIndex: number,
  direction: 1 | -1,
) {
  if (options.length === 0) return -1;

  let nextIndex = currentIndex;
  for (let i = 0; i < options.length; i++) {
    nextIndex = (nextIndex + direction + options.length) % options.length;
    if (!options[nextIndex]?.disabled) return nextIndex;
  }

  return -1;
}

const SegmentedControl = <T extends Value = string>({
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

  const selectedIndex = options.findIndex((option) => option.value === value && !option.disabled);
  const fallbackIndex = findFirstEnabledIndex(options);
  const activeIndex = selectedIndex >= 0 ? selectedIndex : fallbackIndex;

  const selectByIndex = (index: number) => {
    const option = options[index];
    if (!option || option.disabled || disabled) return;
    if (option.value === value) return;
    onChange(option.value, option);
  };

  const moveSelection = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
    direction: 1 | -1,
  ) => {
    event.preventDefault();
    const nextIndex = getNextEnabledIndex(options, currentIndex, direction);
    if (nextIndex < 0) return;

    selectByIndex(nextIndex);
    requestAnimationFrame(() => {
      const nextButton = document.getElementById(`${groupId}-option-${nextIndex}`);
      if (nextButton instanceof HTMLButtonElement) nextButton.focus();
    });
  };

  return (
    <div
      id={groupId}
      role="radiogroup"
      aria-orientation="horizontal"
      aria-disabled={disabled || undefined}
      className={cn(
        "relative inline-grid grid-flow-col items-center gap-2 rounded-2xl border border-border bg-surface2 p-1 shadow-sm",
        sizing.height,
        fullWidth ? "w-full" : "w-auto",
        disabled ? "opacity-60" : undefined,
        className,
      )}
      {...aria}
    >
      {options.map((option, index) => {
        const isSelected = value === option.value;
        const isDisabled = disabled || option.disabled;

        return (
          <button
            key={`${String(option.value)}-${index}`}
            id={`${groupId}-option-${index}`}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-disabled={isDisabled || undefined}
            tabIndex={index === activeIndex ? 0 : -1}
            disabled={isDisabled}
            onClick={() => selectByIndex(index)}
            onKeyDown={(event) => {
              if (isDisabled) return;

              if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                moveSelection(event, index, 1);
                return;
              }

              if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                moveSelection(event, index, -1);
                return;
              }

              if (event.key === "Home") {
                event.preventDefault();
                const firstEnabled = findFirstEnabledIndex(options);
                if (firstEnabled < 0) return;
                selectByIndex(firstEnabled);
                requestAnimationFrame(() => {
                  const nextButton = document.getElementById(`${groupId}-option-${firstEnabled}`);
                  if (nextButton instanceof HTMLButtonElement) nextButton.focus();
                });
                return;
              }

              if (event.key === "End") {
                event.preventDefault();
                const lastEnabled = findLastEnabledIndex(options);
                if (lastEnabled < 0) return;
                selectByIndex(lastEnabled);
                requestAnimationFrame(() => {
                  const nextButton = document.getElementById(`${groupId}-option-${lastEnabled}`);
                  if (nextButton instanceof HTMLButtonElement) nextButton.focus();
                });
              }
            }}
            className={cn(
              "flex min-w-[4rem] items-center justify-center rounded-xl transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-50",
              sizing.itemPad,
              sizing.font,
              isSelected
                ? "bg-surface text-brand-primary shadow-sm"
                : "bg-surface text-ink-secondary hover:bg-surface2 hover:text-ink",
            )}
          >
            {option.icon ? <span className="mr-2 inline-flex">{option.icon}</span> : null}
            <span className="whitespace-nowrap">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default SegmentedControl;
