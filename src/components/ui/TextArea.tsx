"use client";

import clsx from "clsx";
import * as React from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

import InputChrome from "./InputChrome";

type Size = "sm" | "md" | "lg";

export type TextAreaProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "size" | "children" | "onChange"
> & {
  id: string;
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
  const [count, setCount] = React.useState<number>(
    Number(rest.defaultValue?.toString().length ?? 0),
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCount(e.currentTarget.value.length);
    if (registration?.onChange) {
      void registration.onChange(e);
    }
    onChange?.(e);
  };

  const counter =
    showCount && maxLength ? (
      <span className="text-xs text-gray-400">
        {count}/{maxLength}
      </span>
    ) : null;

  const effectiveRight = (
    <>
      {rightAddon}
      {counter}
    </>
  );

  return (
    <InputChrome
      hasError={hasError}
      disabled={disabled}
      size={size}
      leftAddon={leftAddon}
      rightAddon={effectiveRight}
      className={wrapperClassName}
    >
      <textarea
        id={id}
        ref={ref}
        rows={rows}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={maxLength}
        className={clsx(
          "block w-full resize-y border-none bg-transparent text-gray-900 outline-none placeholder:text-gray-400",
          size === "sm" ? "py-1 text-sm" : size === "lg" ? "py-2 text-lg" : "py-1.5 text-base",
          className,
        )}
        aria-invalid={hasError || undefined}
        {...registration}
        {...rest}
        onChange={handleChange}
      />
    </InputChrome>
  );
};

export default TextArea;
