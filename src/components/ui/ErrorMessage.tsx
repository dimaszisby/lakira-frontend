"use client";

import { WarningCircle } from "phosphor-react";
import { useId } from "react";
import type { FieldError } from "react-hook-form";

import { cn } from "@/lib/cn";
import { sanitizeErrorMessage } from "@/lib/sanitizeErrorMessage";

type Size = "sm" | "md" | "lg";
type Variant = "plain" | "subtle" | "solid";

type Props = {
  id?: string;
  message?: string | null;
  fieldError?: FieldError;
  size?: Size;
  variant?: Variant;
  fullWidth?: boolean;
  reserveSpace?: boolean;
  hideIcon?: boolean;
  className?: string;
  "aria-label"?: string;
};

const SIZE = {
  sm: { text: "text-xs", icon: "h-4 w-4", minH: "min-h-[1rem]" },
  md: { text: "text-sm", icon: "h-4.5 w-4.5", minH: "min-h-[1.25rem]" },
  lg: { text: "text-base", icon: "h-5 w-5", minH: "min-h-[1.5rem]" },
} as const;

const STATUS_ERROR_TEXT = "text-status-error";

const VARIANT = {
  plain: { wrap: "", text: STATUS_ERROR_TEXT, icon: STATUS_ERROR_TEXT },
  subtle: {
    wrap: "rounded-md border border-status-error/30 bg-status-error/10 px-2 py-1",
    text: STATUS_ERROR_TEXT,
    icon: STATUS_ERROR_TEXT,
  },
  solid: {
    wrap: "rounded-md bg-status-error px-2 py-1",
    text: "text-ink-inverted",
    icon: "text-ink-inverted",
  },
} as const;

const ErrorMessage = ({
  id,
  message,
  fieldError,
  size = "md",
  variant = "plain",
  fullWidth = true,
  reserveSpace = true,
  hideIcon = false,
  className,
  ...aria
}: Props) => {
  const uid = useId();
  const domId = id ?? `err-${uid}`;

  const rawMessage = message ?? fieldError?.message ?? null;
  const msg = rawMessage ? sanitizeErrorMessage(rawMessage) : null;
  const show = Boolean(msg);

  const s = SIZE[size];
  const v = VARIANT[variant];

  if (!show && !reserveSpace) return null;

  return (
    <div
      id={domId}
      className={cn(
        "inline-flex items-start gap-2",
        s.minH,
        fullWidth ? "w-full" : "w-auto",
        v.wrap,
        className,
      )}
      role={show ? "alert" : undefined}
      aria-live={show ? "assertive" : undefined}
      aria-atomic={show ? true : undefined}
      {...aria}
    >
      {show && !hideIcon ? (
        <WarningCircle aria-hidden className={cn(v.icon, s.icon, "mt-[1px] shrink-0")} />
      ) : null}
      <span className={cn(v.text, s.text)}>{show ? String(msg) : ""}</span>
    </div>
  );
};

export default ErrorMessage;
