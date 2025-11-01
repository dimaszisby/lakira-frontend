"use client";

import * as React from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

import { cn } from "@/src/lib/cn";

import InputChrome from "./InputChrome";

type Size = "sm" | "md" | "lg";

export type TextAreaProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "size" | "children" | "onChange"
> & {
  id?: string;
  registration?: UseFormRegisterReturn;
  size?: Size;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  hasError?: boolean;
  wrapperClassName?: string;
  showCount?: boolean;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
};

const TextArea = ({
  id,
  registration,
  size = "md",
  leftAddon,
  rightAddon,
  hasError,
  disabled,
  placeholder,
  className,
  wrapperClassName,
  maxLength,
  showCount = false,
  rows = 4,
  onChange,
  ...rest
}: TextAreaProps) => {
  const ref = React.useRef<HTMLTextAreaElement>(null);

  // initialize from defaultValue/value length
  const [count, setCount] = React.useState<number>(
    Number(rest.defaultValue?.toString().length ?? 0),
  );

  // keep counter in sync if parent controls the value (reset/edit cases)
  React.useEffect(() => {
    const el = ref.current;
    if (el) setCount(el.value.length);
  }, [rest.value, rest.defaultValue]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCount(e.currentTarget.value.length);
    if (registration?.onChange) {
      void registration.onChange(e);
    }
    onChange?.(e);
  };

  // Visual counter only (silent for SRs by default)
  const counter =
    showCount && maxLength ? (
      <span className="text-xs text-gray-400" aria-hidden="true">
        {count}/{maxLength}
      </span>
    ) : null;

  const effectiveRight = (
    <div className="flex gap-2">
      {rightAddon}
      {counter}
    </div>
  );

  return (
    <InputChrome
      multiline
      hasError={hasError}
      disabled={disabled}
      size={size}
      // leftAddon={leftAddon}
      // rightAddon={effectiveRight}
      className={wrapperClassName}
    >
      <div className="flex-col space-y-4">
        <textarea
          id={id}
          ref={ref}
          rows={rows}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={maxLength}
          className={cn(
            "block w-full resize-y border-none bg-transparent text-gray-900 outline-none placeholder:text-gray-400",
            size === "sm" ? "py-1 text-sm" : size === "lg" ? "py-2 text-lg" : "py-1.5 text-base",
            className,
          )}
          // Dev Note: FormField.Control provide aria-invalid / aria-describedby / aria-errormessage
          {...registration}
          {...rest} // carries injected ARIA from FormField.Control
          onChange={handleChange}
        />

        <div className="flex items-end justify-between">
          {leftAddon}
          {effectiveRight}
        </div>
      </div>
    </InputChrome>
  );
};

export default TextArea;
