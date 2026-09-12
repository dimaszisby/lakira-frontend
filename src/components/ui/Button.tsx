import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

import { Spinner } from "./Spinner";

type ButtonSize = "sm" | "md" | "lg";
type ButtonVariant = "primary" | "secondary" | "tertiary" | "destructive" | "ghost";

export type ButtonProps = ComponentProps<"button"> & {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  size?: ButtonSize;
  variant?: ButtonVariant;
  /** Stretch to the container width. */
  block?: boolean;
  /** Disables the button and shows a spinner in place of `leftIcon`. */
  loading?: boolean;
};

const hasText = (value: unknown) => typeof value === "string" && value.trim().length > 0;

export const Button = ({
  children,
  leftIcon,
  rightIcon,
  size = "md",
  variant = "primary",
  block = false,
  loading = false,
  disabled,
  className,
  type = "button",
  ...props
}: ButtonProps) => {
  if (process.env.NODE_ENV !== "production") {
    const isIconOnly = !children && Boolean(leftIcon || rightIcon);
    if (isIconOnly && !hasText(props["aria-label"]) && !hasText(props["aria-labelledby"])) {
      console.warn("[Button] Icon-only buttons must have an aria-label for accessibility.");
    }
  }

  const leading = loading ? (
    <Spinner size="sm" />
  ) : leftIcon ? (
    <span className="inline-flex">{leftIcon}</span>
  ) : null;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-variant={variant}
      data-size={size}
      className={cn("button", block ? "w-full" : "w-auto", className)}
      {...props}
    >
      {leading}
      {children ? <span className="truncate">{children}</span> : null}
      {rightIcon ? <span className="inline-flex">{rightIcon}</span> : null}
    </button>
  );
};
