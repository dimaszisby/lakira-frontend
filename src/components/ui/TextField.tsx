"use client";

import { Eye, EyeSlash, XCircle } from "@phosphor-icons/react";
import type { ChangeEvent, ComponentProps, ReactNode } from "react";
import { useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { composeRefs } from "@/lib/compose-refs";

import { InputChrome } from "./InputChrome";

type TextFieldSize = "sm" | "md" | "lg";

export type TextFieldProps = Omit<ComponentProps<"input">, "size"> & {
  size?: TextFieldSize;
  leftAddon?: ReactNode;
  rightAddon?: ReactNode;
  invalid?: boolean;
  /** Shows a clear button while the field has a value. */
  clearable?: boolean;
  /** Shows a show/hide toggle for `type="password"`. Defaults to on for passwords. */
  revealToggle?: boolean;
  /** Applied to the field shell; `className` goes to the input itself. */
  wrapperClassName?: string;
};

const hasLength = (value: ComponentProps<"input">["value"]) =>
  value !== undefined && value !== null && String(value).length > 0;

export const TextField = ({
  ref,
  size = "md",
  leftAddon,
  rightAddon,
  invalid = false,
  disabled,
  type = "text",
  clearable = false,
  revealToggle = type === "password",
  wrapperClassName,
  className,
  value,
  defaultValue,
  onChange,
  "aria-invalid": ariaInvalid,
  ...props
}: TextFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [hasTypedValue, setHasTypedValue] = useState(() => hasLength(defaultValue));

  const isControlled = value !== undefined;
  const hasValue = isControlled ? hasLength(value) : hasTypedValue;
  const isInvalid = invalid || ariaInvalid === true || ariaInvalid === "true";
  const canRevealPassword = revealToggle && type === "password";
  const showClear = clearable && hasValue;

  // react-hook-form writes default values and reset() values straight to the
  // DOM node without a change event. The composed ref runs on every commit,
  // after register()'s ref has written the value, so read the node there.
  const syncFromNode = (node: HTMLInputElement | null) => {
    if (node && !isControlled) setHasTypedValue(node.value.length > 0);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) setHasTypedValue(event.currentTarget.value.length > 0);
    onChange?.(event);
  };

  // Going through the native value setter fires a real input event, so both a
  // controlled parent and react-hook-form observe the cleared value.
  const clear = () => {
    const input = inputRef.current;
    if (!input) return;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, "");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
  };

  const trailing =
    rightAddon || showClear || canRevealPassword ? (
      <>
        {rightAddon}
        {showClear ? (
          <button
            type="button"
            className="input-icon-button"
            onClick={clear}
            disabled={disabled}
            aria-label="Clear input"
            title="Clear"
          >
            <XCircle aria-hidden />
          </button>
        ) : null}
        {canRevealPassword ? (
          <button
            type="button"
            className="input-icon-button"
            onClick={() => setIsPasswordVisible((visible) => !visible)}
            disabled={disabled}
            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            title={isPasswordVisible ? "Hide password" : "Show password"}
          >
            {isPasswordVisible ? <EyeSlash aria-hidden /> : <Eye aria-hidden />}
          </button>
        ) : null}
      </>
    ) : null;

  const inputType = canRevealPassword && isPasswordVisible ? "text" : type;

  return (
    <InputChrome
      size={size}
      invalid={isInvalid}
      disabled={disabled}
      leftAddon={leftAddon}
      rightAddon={trailing}
      className={wrapperClassName}
    >
      <input
        {...props}
        ref={composeRefs(inputRef, ref, syncFromNode)}
        type={inputType}
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        aria-invalid={isInvalid || undefined}
        onChange={handleChange}
        className={cn("input-control", className)}
      />
    </InputChrome>
  );
};
