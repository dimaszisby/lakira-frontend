"use client";

import type { ButtonHTMLAttributes } from "react";
import React, { useCallback, useEffect, useRef } from "react";

import { cn } from "@/lib/cn";

type Size = "sm" | "md" | "lg";

export type ToggleProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "size"> & {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  size?: Size;
  onLabel?: string;
  offLabel?: string;
  wrapperClassName?: string;
};

const SIZE: Record<Size, { root: string; knob: string; shift: string; text: string }> = {
  sm: {
    root: "h-6 w-10 p-0.5",
    knob: "h-5 w-5",
    shift: "translate-x-4",
    text: "text-[10px]",
  },
  md: {
    root: "h-7 w-12 p-1",
    knob: "h-5 w-5",
    shift: "translate-x-5",
    text: "text-[11px]",
  },
  lg: {
    root: "h-8 w-14 p-1",
    knob: "h-6 w-6",
    shift: "translate-x-6",
    text: "text-xs",
  },
};

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  (
    {
      checked,
      onCheckedChange,
      disabled,
      size = "md",
      onLabel = "",
      offLabel = "",
      wrapperClassName,
      className,
      onClick,
      type = "button",
      ...rest
    },
    ref,
  ) => {
    const sizing = SIZE[size];
    const latestCheckedRef = useRef(checked);

    useEffect(() => {
      latestCheckedRef.current = checked;
    }, [checked]);

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (event.defaultPrevented || disabled) return;
        const nextChecked = !latestCheckedRef.current;
        latestCheckedRef.current = nextChecked;
        onCheckedChange(nextChecked);
      },
      [disabled, onCheckedChange, onClick],
    );

    return (
      <div className={cn("inline-flex items-center gap-2", wrapperClassName)}>
        {offLabel && !checked ? (
          <span className={cn("text-ink-tertiary", sizing.text)}>{offLabel}</span>
        ) : null}

        <button
          {...rest}
          ref={ref}
          type={type}
          role="switch"
          aria-checked={checked}
          aria-disabled={disabled || undefined}
          data-state={checked ? "checked" : "unchecked"}
          disabled={disabled}
          onClick={handleClick}
          className={cn(
            "relative inline-flex shrink-0 select-none items-center rounded-full border border-border transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            sizing.root,
            checked ? "border-transparent bg-brand-primary" : "bg-surface2",
            className,
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none inline-block rounded-full bg-surface shadow-sm transition-transform",
              sizing.knob,
              checked ? sizing.shift : "translate-x-0",
            )}
          />
        </button>

        {onLabel && checked ? <span className={cn("text-ink-secondary", sizing.text)}>{onLabel}</span> : null}
      </div>
    );
  },
);

Toggle.displayName = "Toggle";

export default Toggle;
