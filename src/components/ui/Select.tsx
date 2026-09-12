"use client";

import {
  Select as AriakitSelect,
  SelectItem,
  SelectItemCheck,
  SelectPopover,
  SelectProvider,
} from "@ariakit/react";
import { CaretDown } from "phosphor-react";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

type SelectSize = "sm" | "md" | "lg";
type SelectValue = string | number;

export type SelectOption<T extends SelectValue = string> = {
  value: T;
  label: string;
  left?: ReactNode;
  disabled?: boolean;
};

export type SelectProps<T extends SelectValue = string> = Pick<
  ComponentProps<"button">,
  "aria-label" | "aria-labelledby" | "aria-describedby" | "aria-invalid" | "aria-errormessage"
> & {
  id?: string;
  value: T | null;
  onChange: (next: T, option: SelectOption<T>) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  size?: SelectSize;
  /** Applied to the trigger. */
  className?: string;
  leftAddon?: ReactNode;
  rightAddon?: ReactNode;
  /** Submits the selected value with a surrounding form. */
  name?: string;
};

/** A single-choice listbox built on Ariakit. Values are compared as strings internally. */
export const Select = <T extends SelectValue = string>({
  id,
  value,
  onChange,
  options,
  placeholder = "Select…",
  disabled = false,
  size = "md",
  className,
  leftAddon,
  rightAddon,
  name,
  ...ariaProps
}: SelectProps<T>) => {
  const selectedOption = options.find((option) => option.value === value) ?? null;

  const handleSetValue = (key: string) => {
    const option = options.find((candidate) => String(candidate.value) === key);
    if (!option || option.disabled || option.value === value) return;
    onChange(option.value, option);
  };

  return (
    <SelectProvider value={value === null ? "" : String(value)} setValue={handleSetValue}>
      <AriakitSelect
        id={id}
        name={name}
        disabled={disabled}
        data-size={size}
        data-disabled={disabled ? "" : undefined}
        className={cn("input-shell picker-trigger", className)}
        {...ariaProps}
      >
        {leftAddon ? (
          <span aria-hidden="true" className="input-addon" data-side="left">
            {leftAddon}
          </span>
        ) : null}
        <span className="picker-value" data-placeholder={selectedOption ? undefined : ""}>
          <span>{selectedOption?.label ?? placeholder}</span>
        </span>
        {rightAddon ? <span className="input-addon">{rightAddon}</span> : null}
        <CaretDown aria-hidden className="select-arrow" />
      </AriakitSelect>

      <SelectPopover gutter={8} sameWidth unmountOnHide className="popover listbox">
        {options.length === 0 ? (
          <div className="listbox-empty">No options</div>
        ) : (
          options.map((option) => (
            <SelectItem
              key={String(option.value)}
              value={String(option.value)}
              disabled={option.disabled}
              className="listbox-item"
            >
              {option.left ? <span aria-hidden="true">{option.left}</span> : null}
              <span>{option.label}</span>
              <SelectItemCheck className="listbox-item-check" />
            </SelectItem>
          ))
        )}
      </SelectPopover>
    </SelectProvider>
  );
};
