"use client";

import { X } from "phosphor-react";
import type { ChangeEvent, ComponentProps, KeyboardEvent } from "react";
import { useRef } from "react";

import { cn } from "@/lib/cn";
import { composeRefs } from "@/lib/compose-refs";

import { InputChrome } from "./InputChrome";
import { Spinner } from "./Spinner";

export type SearchInputProps = Omit<
  ComponentProps<"input">,
  "value" | "onChange" | "type" | "size" | "className"
> & {
  value: string;
  onChange: (value: string) => void;
  /** Called instead of `onChange("")` when the user clears the field. */
  onClear?: () => void;
  isLoading?: boolean;
  /** Applied to the field shell. */
  className?: string;
};

export const SearchInput = ({
  ref,
  value,
  onChange,
  onClear,
  isLoading = false,
  disabled = false,
  placeholder = "Search…",
  className,
  "aria-label": ariaLabel = "Search",
  ...props
}: SearchInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const clear = () => {
    if (disabled) return;
    if (onClear) onClear();
    else onChange("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    props.onKeyDown?.(event);
    if (disabled || event.nativeEvent.isComposing) return;
    if (event.key === "Escape" && value) {
      event.preventDefault();
      clear();
    }
  };

  const trailing =
    isLoading || value ? (
      <>
        {isLoading ? (
          <span role="status" aria-label="Loading">
            <Spinner size="sm" />
          </span>
        ) : null}
        {value ? (
          <button
            type="button"
            className="input-icon-button"
            onClick={clear}
            disabled={disabled}
            aria-label="Clear search"
            title="Clear"
          >
            <X aria-hidden />
          </button>
        ) : null}
      </>
    ) : null;

  return (
    <InputChrome disabled={disabled} rightAddon={trailing} className={cn("sm:max-w-md", className)}>
      <input
        {...props}
        ref={composeRefs(inputRef, ref)}
        type="search"
        inputMode="search"
        autoComplete="off"
        spellCheck={false}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-busy={isLoading || undefined}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        className="input-control"
      />
    </InputChrome>
  );
};
