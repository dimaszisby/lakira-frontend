"use client";

import type { ChangeEvent, ComponentProps, ReactNode } from "react";
import { useState } from "react";

import { cn } from "@/lib/cn";
import { composeRefs } from "@/lib/compose-refs";

import { InputChrome } from "./InputChrome";

type TextAreaSize = "sm" | "md" | "lg";

export type TextAreaProps = Omit<ComponentProps<"textarea">, "size"> & {
  size?: TextAreaSize;
  leftAddon?: ReactNode;
  rightAddon?: ReactNode;
  invalid?: boolean;
  /** Shows a `count/maxLength` counter. Requires `maxLength`. */
  showCount?: boolean;
  /** Applied to the field shell; `className` goes to the textarea itself. */
  wrapperClassName?: string;
};

const lengthOf = (value: ComponentProps<"textarea">["value"]) =>
  value === undefined || value === null ? 0 : String(value).length;

export const TextArea = ({
  ref,
  size = "md",
  leftAddon,
  rightAddon,
  invalid = false,
  disabled,
  showCount = false,
  maxLength,
  rows = 4,
  wrapperClassName,
  className,
  value,
  defaultValue,
  onChange,
  "aria-invalid": ariaInvalid,
  ...props
}: TextAreaProps) => {
  const [typedLength, setTypedLength] = useState(() => lengthOf(defaultValue));

  const isControlled = value !== undefined;
  const count = isControlled ? lengthOf(value) : typedLength;
  const isInvalid = invalid || ariaInvalid === true || ariaInvalid === "true";
  const showCounter = showCount && maxLength !== undefined;
  const hasFooter = Boolean(leftAddon || rightAddon || showCounter);

  // react-hook-form writes default values and reset() values straight to the
  // DOM node without a change event. The composed ref runs on every commit,
  // after register()'s ref has written the value, so read the node there.
  const syncFromNode = (node: HTMLTextAreaElement | null) => {
    if (node && !isControlled) setTypedLength(node.value.length);
  };

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (!isControlled) setTypedLength(event.currentTarget.value.length);
    onChange?.(event);
  };

  return (
    <InputChrome
      multiline
      size={size}
      invalid={isInvalid}
      disabled={disabled}
      className={wrapperClassName}
    >
      <textarea
        {...props}
        ref={composeRefs(ref, syncFromNode)}
        rows={rows}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        aria-invalid={isInvalid || undefined}
        onChange={handleChange}
        className={cn("input-control", className)}
      />

      {hasFooter ? (
        <div className="input-footer">
          {leftAddon ? <span className="input-addon">{leftAddon}</span> : <span />}
          <span className="input-addon">
            {rightAddon}
            {showCounter ? (
              <span className="input-counter" aria-hidden="true">
                {count}/{maxLength}
              </span>
            ) : null}
          </span>
        </div>
      ) : null}
    </InputChrome>
  );
};
