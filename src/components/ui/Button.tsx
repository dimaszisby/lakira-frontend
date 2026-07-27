"use client";

import React from "react";

import { cn } from "@/lib/cn";

type Size = "sm" | "md" | "lg";
type Variant = "primary" | "secondary" | "tertiary" | "destructive" | "neutral" | "ghost" | "link";

export type ButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: Size;
  variant?: Variant;
  block?: boolean;
  loading?: boolean;
};

const Spinner = () => {
  return (
    <span
      aria-hidden
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
    />
  );
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      leftIcon,
      rightIcon,
      size = "md",
      variant = "primary",
      block,
      loading = false,
      disabled,
      className,
      type = "button",
      ...rest
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;
    const isIconOnly = !children && !!(leftIcon || rightIcon);
    const hasAriaLabel =
      typeof rest["aria-label"] === "string" && rest["aria-label"].trim().length > 0;
    const hasAriaLabelledBy =
      typeof rest["aria-labelledby"] === "string" && rest["aria-labelledby"].trim().length > 0;

    if (process.env.NODE_ENV !== "production") {
      if (isIconOnly && !hasAriaLabel && !hasAriaLabelledBy) {
        console.warn("[Button] Icon-only buttons must have an aria-label for accessibility.");
      }
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-disabled={isDisabled || undefined}
        aria-busy={loading || undefined}
        data-variant={variant}
        data-size={size}
        className={cn(
          "button",
          "focus-visible:outline-none focus-visible:ring-2 ring-ring",
          block ? "w-full" : "w-auto",
          className,
        )}
        {...rest}
      >
        {loading ? (
          <span className="mr-2 inline-flex">
            <Spinner />
          </span>
        ) : leftIcon ? (
          <span className="mr-2 inline-flex">{leftIcon}</span>
        ) : null}

        {children ? <span className="truncate">{children}</span> : null}

        {rightIcon ? <span className="ml-2 inline-flex">{rightIcon}</span> : null}
      </button>
    );
  },
);
Button.displayName = "Button";

export default Button;
