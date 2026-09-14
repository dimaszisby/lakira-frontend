"use client";

import { WarningCircle } from "@phosphor-icons/react";
import { useId } from "react";

import { cn } from "@/lib/cn";
import { sanitizeErrorMessage } from "@/lib/sanitizeErrorMessage";

type ErrorMessageSize = "sm" | "md";
type ErrorMessageVariant = "plain" | "subtle" | "solid";

export type ErrorMessageProps = {
  id?: string;
  message?: string | null;
  size?: ErrorMessageSize;
  variant?: ErrorMessageVariant;
  /**
   * `assertive` (default) announces immediately as an alert, for form-level and
   * request errors. `polite` waits for the user, for per-field validation.
   */
  politeness?: "assertive" | "polite";
  /** Keep the line's height when there is no message, so layout does not jump. */
  reserveSpace?: boolean;
  className?: string;
  "aria-label"?: string;
};

export const ErrorMessage = ({
  id,
  message,
  size = "md",
  variant = "plain",
  politeness = "assertive",
  reserveSpace = true,
  className,
  ...aria
}: ErrorMessageProps) => {
  const fallbackId = useId();
  const text = message ? sanitizeErrorMessage(message) : "";
  const isVisible = text.length > 0;

  if (!isVisible && !reserveSpace) return null;

  return (
    <div
      id={id ?? `err-${fallbackId}`}
      role={isVisible && politeness === "assertive" ? "alert" : undefined}
      aria-live={isVisible ? politeness : undefined}
      aria-atomic={isVisible || undefined}
      data-size={size}
      data-variant={variant}
      className={cn("field-message", className)}
      {...aria}
    >
      {isVisible ? <WarningCircle aria-hidden /> : null}
      <span>{text}</span>
    </div>
  );
};
