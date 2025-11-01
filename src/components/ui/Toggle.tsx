"use client";

import React, { useCallback } from "react";

import { cn } from "@/src/lib/cn";

type Size = "sm" | "md" | "lg";

export type ToggleProps = {
  id?: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  onBlur?: () => void;
  disabled?: boolean;
  size?: Size;
  onLabel?: string;
  offLabel?: string;
  wrapperClassName?: string;
  "aria-label"?: string;
};

const SIZE = {
  sm: {
    root: "w-10 h-6 p-0.5",
    knob: "h-5 w-5",
    shift: "translate-x-4",
    text: "text-[10px]",
  },
  md: {
    root: "w-12 h-7 p-1",
    knob: "h-5 w-5",
    shift: "translate-x-5",
    text: "text-[11px]",
  },
  lg: {
    root: "w-14 h-8 p-1.5",
    knob: "h-6 w-6",
    shift: "translate-x-6",
    text: "text-xs",
  },
} as const;

const Toggle = ({
  id,
  checked,
  onCheckedChange,
  onBlur,
  disabled,
  size = "md",
  onLabel = "",
  offLabel = "",
  wrapperClassName,
  ...aria
}: ToggleProps) => {
  const s = SIZE[size];

  const handleClick = useCallback(() => {
    if (!disabled) onCheckedChange(!checked);
  }, [checked, disabled, onCheckedChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        onCheckedChange(!checked);
      }
    },
    [checked, disabled, onCheckedChange],
  );

  return (
    <div className={cn("inline-flex items-center gap-2", wrapperClassName)}>
      {/* Optional labels for ON/OFF */}
      {offLabel && !checked ? (
        <span className={cn("text-gray-400", s.text)}>{offLabel}</span>
      ) : null}

      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled || undefined}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        className={cn(
          "relative inline-flex shrink-0 cursor-pointer select-none items-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-violet-400",
          s.root,
          checked ? "bg-violet-500" : "bg-gray-300",
          disabled && "cursor-not-allowed opacity-50",
        )}
        {...aria}
      >
        {/* Knob */}
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none inline-block rounded-full bg-white shadow transition-transform",
            s.knob,
            checked ? s.shift : "translate-x-0",
          )}
        />
      </button>

      {onLabel && checked ? <span className={cn("text-gray-700", s.text)}>{onLabel}</span> : null}
    </div>
  );
};

export default Toggle;
