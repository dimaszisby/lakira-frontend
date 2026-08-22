"use client";

import { Eye, EyeSlash, XCircle } from "phosphor-react";
import * as React from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

import { cn } from "@/lib/cn";

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
  onBlur,
  ...rest
}: TextFieldProps) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [showPwd, setShowPwd] = React.useState(false);
  const [hasValue, setHasValue] = React.useState<boolean>(Boolean(rest.defaultValue ?? rest.value));
  const registrationRef = registration?.ref as
    | ((instance: HTMLInputElement | null) => void)
    | React.MutableRefObject<HTMLInputElement | null>
    | undefined;
  const registrationOnChange = registration?.onChange;
  const registrationOnBlur = registration?.onBlur;
  const registrationName = registration?.name;

  // keep hasValue in sync if parent controls the value
  React.useEffect(() => {
    const el = inputRef.current;
    if (el) setHasValue(el.value.length > 0);
  }, [rest.value]);

  const handleInputRef = React.useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (!registrationRef) return;
      if (typeof registrationRef === "function") {
        registrationRef(node);
        return;
      }
      registrationRef.current = node;
    },
    [registrationRef],
  );

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(e.currentTarget.value.length > 0);
    if (registrationOnChange) {
      void registrationOnChange(e);
    }
    onChange?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (registrationOnBlur) {
      void registrationOnBlur(e);
    }
    onBlur?.(e);
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
          disabled={disabled}
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
          disabled={disabled}
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
        ref={handleInputRef}
        type={revealToggle && type === "password" ? (showPwd ? "text" : "password") : type}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "block w-full border-none bg-transparent text-ink outline-none placeholder:text-ink-tertiary",
          size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : "text-base",
          className,
        )}
        name={registrationName}
        {...rest}
        onBlur={handleBlur}
        onChange={handleInput}
      />
    </InputChrome>
  );
};

export default TextField;
