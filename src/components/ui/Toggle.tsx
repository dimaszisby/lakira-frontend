"use client";

import type { ComponentProps, MouseEvent } from "react";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/cn";

type ToggleSize = "sm" | "md" | "lg";

export type ToggleProps = Omit<ComponentProps<"button">, "children" | "onChange"> & {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  size?: ToggleSize;
  onLabel?: string;
  offLabel?: string;
  wrapperClassName?: string;
};

export const Toggle = ({
  checked,
  onCheckedChange,
  disabled,
  size = "md",
  onLabel,
  offLabel,
  wrapperClassName,
  className,
  onClick,
  type = "button",
  ...props
}: ToggleProps) => {
  // Rapid clicks can land before the parent re-renders with the new `checked`;
  // track the last emitted value so each click flips from it.
  const latestCheckedRef = useRef(checked);

  useEffect(() => {
    latestCheckedRef.current = checked;
  }, [checked]);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || disabled) return;
    const nextChecked = !latestCheckedRef.current;
    latestCheckedRef.current = nextChecked;
    onCheckedChange(nextChecked);
  };

  const stateLabel = checked ? onLabel : offLabel;

  return (
    <div className={cn("inline-flex items-center gap-2", wrapperClassName)}>
      {!checked && stateLabel ? (
        <span className="switch-label" data-size={size}>
          {stateLabel}
        </span>
      ) : null}

      <button
        {...props}
        type={type}
        role="switch"
        aria-checked={checked}
        data-size={size}
        data-state={checked ? "checked" : "unchecked"}
        disabled={disabled}
        onClick={handleClick}
        className={cn("switch", className)}
      >
        <span aria-hidden="true" className="switch-thumb" />
      </button>

      {checked && stateLabel ? (
        <span className="switch-label" data-size={size}>
          {stateLabel}
        </span>
      ) : null}
    </div>
  );
};
