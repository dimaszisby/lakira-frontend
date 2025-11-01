"use client";

import React from "react";

import { cn } from "@/src/lib/cn";

type Size = "sm" | "md" | "lg";
type Variant = "primary" | "secondary" | "destructive" | "neutral";

export type ButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: Size;
  variant?: Variant;
  block?: boolean; // full width
  loading?: boolean; // shows spinner & disables
};

const SIZE: Record<Size, string> = {
  sm: "h-10 px-3 text-sm gap-2 rounded-xl",
  md: "h-12 px-5 text-base gap-3 rounded-2xl",
  lg: "h-14 px-7 text-lg gap-4 rounded-2xl",
};

// TODO: Update colors to match design system
const VARIANT: Record<Variant, string> = {
  primary: "bg-[#A8C28B] text-white hover:bg-[#7C9B63] focus-visible:ring-violet-400",
  secondary:
    "bg-white text-[#7C9B63] border border-[#A8C28B]/30 hover:bg-[#A8C28B]/10 focus-visible:ring-violet-400",
  destructive:
    "bg-white text-[#C76576] border border-[#C76576]/30 hover:bg-[#C76576]/10 focus-visible:ring-violet-400",
  neutral: "bg-gray-200 text-gray-700 hover:bg-gray-300 focus-visible:ring-violet-400",
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

    // If it's icon-only, enforce accessible label
    const isIconOnly = !children && !!(leftIcon || rightIcon);
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
        className={cn(
          "inline-flex select-none items-center justify-center font-semibold shadow-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-2",
          "disabled:cursor-not-allowed disabled:opacity-60",
          SIZE[size],
          VARIANT[variant],
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

        {/* Right icon  */}
        {children ? <span className="truncate">{children}</span> : null}

        {/* Right icon */}
        {rightIcon ? <span className="ml-2 inline-flex">{rightIcon}</span> : null}
      </button>
    );
  },
);
Button.displayName = "Button";

export default Button;
