"use client";

import { Eye, EyeSlash, XCircle } from "phosphor-react";
import * as React from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

import { cn } from "@/src/lib/cn";

import InputChrome from "./InputChrome";

type Size = "sm" | "md" | "lg";

export type TextFieldProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size" | "children" | "onChange"
> & {
  id?: string;
  label?: string;
  registration?: UseFormRegisterReturn;
  size?: Size;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  hasError?: boolean;
  clearable?: boolean;
  revealToggle?: boolean; // if type=password, show reveal toggle
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  wrapperClassName?: string;
};

const TextField = ({
  id,
  registration,
  size = "md",
  leftAddon,
  rightAddon,
  hasError,
  disabled,
  type = "text",
  placeholder,
  clearable = false,
  revealToggle = type === "password",
  className,
  wrapperClassName,
  onChange,
  ...rest
}: TextFieldProps) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [showPwd, setShowPwd] = React.useState(false);
  const [hasValue, setHasValue] = React.useState<boolean>(Boolean(rest.defaultValue ?? rest.value));

  // keep hasValue in sync if parent controls the value
  React.useEffect(() => {
    const el = inputRef.current;
    if (el) setHasValue(el.value.length > 0);
  }, [rest.value]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(e.currentTarget.value.length > 0);
    if (registration?.onChange) {
      void registration.onChange(e);
    }
    onChange?.(e);
  };

  const clear = () => {
    const el = inputRef.current;
    if (!el) return;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(el, "");
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.focus();
  };

  const effectiveRight = (
    <>
      {rightAddon}
      {clearable && hasValue ? (
        <button
          type="button"
          onClick={clear}
          className="rounded-md p-1 text-ink-tertiary hover:bg-surface2/60 hover:text-ink-emphasis focus-visible:ring-2 focus-visible:ring-ring"
          title="Clear"
          aria-label="Clear input"
        >
          <XCircle size={18} />
        </button>
      ) : null}
      {revealToggle && type === "password" ? (
        <button
          type="button"
          onClick={() => setShowPwd((s) => !s)}
          className="rounded-md p-1 text-ink-tertiary hover:bg-surface2/60 hover:text-ink-emphasis focus-visible:ring-2 focus-visible:ring-ring"
          title={showPwd ? "Hide password" : "Show password"}
          aria-label={showPwd ? "Hide password" : "Show password"}
        >
          {showPwd ? <EyeSlash size={18} /> : <Eye size={18} />}
        </button>
      ) : null}
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
      <input
        id={id}
        ref={inputRef}
        type={revealToggle && type === "password" ? (showPwd ? "text" : "password") : type}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "block w-full border-none bg-transparent text-ink outline-none placeholder:text-ink-tertiary",
          size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : "text-base",
          className,
        )}
        {...registration}
        {...rest}
        onChange={handleInput}
      />
    </InputChrome>
  );
};

export default TextField;
