"use client";

import React from "react";

import { cn } from "@/src/lib/cn";

// Dev Note: Implements CSS
type Size = "sm" | "md" | "lg";
type Variant = "primary" | "secondary" | "tertiary" | "destructive" | "neutral" | "ghost" | "link";

export type ButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: Size;
  variant?: Variant;
  block?: boolean; // full width
  loading?: boolean; // shows spinner & disables
  asChild?: boolean; // for polymorphic behavior
};

// const SIZE: Record<Size, string> = {
//   sm: "h-10 px-3 text-sm gap-2 rounded-xl",
//   md: "h-12 px-5 text-base gap-3 rounded-2xl",
//   lg: "h-14 px-7 text-lg gap-4 rounded-2xl",
// };

// const SIZE: Record<Size, string> = {
//   sm: "data-[size=sm]:[]", // size is handled by CSS recipe; this keeps API explicit
//   md: "data-[size=md]:[]",
//   lg: "data-[size=lg]:[]",
// };

const Spinner = () => {
  return (
    <span
      aria-hidden
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
    />
  );
};

// Do this need arialabel?
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
    const isIconOnly = !children && !!(leftIcon || rightIcon); // If it's icon-only, enforce accessible label

    if (process.env.NODE_ENV !== "production") {
      if (isIconOnly && !("aria-label" in rest)) {
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
          // Color & states come from CSS tokens in button.css
          "button",
          // "inline-flex select-none items-center justify-center font-semibold shadow-sm transition-colors",
          // Focus ring uses Tailwind + semantic ring token
          "focus-visible:outline-none focus-visible:ring-2 ring-ring",
          // "disabled:cursor-not-allowed disabled:opacity-60",
          block ? "w-full" : "w-auto",
          className,
        )}
        {...rest}
      >
        {/* Left icon / spinner */}
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
