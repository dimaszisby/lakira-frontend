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
  label?: string; // optional: not used here (FieldShell renders label)
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
  // Dev Note: label is intentionally unused (render labels in FieldShell). Keep to avoid breaking callers.
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
          className="rounded-md p-1 text-gray-400 hover:bg-violet-50 hover:text-violet-600 focus-visible:ring-2 focus-visible:ring-violet-400"
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
          className="rounded-md p-1 text-gray-400 hover:bg-violet-50 hover:text-violet-600 focus-visible:ring-2 focus-visible:ring-violet-400"
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
          "block w-full border-none bg-transparent text-gray-900 outline-none placeholder:text-gray-400",
          size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : "text-base",
          className,
        )}
        // Dev Note: FormField.Control provide aria-invalid / aria-describedby / aria-errormessage
        {...registration}
        {...rest} // carries injected ARIA from FormField.Control
        onChange={handleInput}
      />
    </InputChrome>
  );
};

export default TextField;
