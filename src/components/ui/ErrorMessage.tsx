"use client";

import clsx from "clsx";
import { WarningCircle } from "phosphor-react";
import { useId } from "react";
import type { FieldError } from "react-hook-form";

type Size = "sm" | "md" | "lg";
type Variant = "plain" | "subtle" | "solid";

type Props = {
  id?: string; // useful to link via aria-describedby
  message?: string | null; // explicit message (wins over fieldError)
  fieldError?: FieldError; // RHF error
  size?: Size;
  variant?: Variant; // visual treatment
  fullWidth?: boolean;
  reserveSpace?: boolean; // keep height when no message (prevents layout shift)
  hideIcon?: boolean;
  className?: string;
  "aria-label"?: string;
};

const SIZE = {
  sm: { text: "text-xs", icon: "h-4 w-4", minH: "min-h-[1rem]" },
  md: { text: "text-sm", icon: "h-4.5 w-4.5", minH: "min-h-[1.25rem]" },
  lg: { text: "text-base", icon: "h-5 w-5", minH: "min-h-[1.5rem]" },
} as const;

const VARIANT = {
  plain: { wrap: "", text: "text-red-700", icon: "text-red-600" },
  subtle: {
    wrap: "rounded-md border border-red-200 bg-red-50 px-2 py-1",
    text: "text-red-700",
    icon: "text-red-600",
  },
  solid: { wrap: "rounded-md bg-red-600 px-2 py-1", text: "text-white", icon: "text-white" },
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

  const msg = message ?? fieldError?.message ?? null;
  const show = Boolean(msg);

  const s = SIZE[size];
  const v = VARIANT[variant];

  if (!show && !reserveSpace) return null;

  return (
    <div
      id={domId}
      className={clsx(
        "inline-flex items-start gap-2",
        s.minH,
        fullWidth ? "w-full" : "w-auto",
        v.wrap,
        className,
      )}
      // A11y: live-region for errors; no role when empty (space reservation only)
      role={show ? "alert" : undefined}
      aria-live={show ? "assertive" : undefined}
      aria-atomic={show ? true : undefined}
      {...aria}
    >
      {show && !hideIcon ? (
        <WarningCircle aria-hidden className={clsx(v.icon, s.icon, "mt-[1px] shrink-0")} />
      ) : null}
      {/* Keep text color outside conditional so classes don’t jump */}
      <span className={clsx(v.text, s.text)}>{show ? String(msg) : ""}</span>
    </div>
  );
};

export default ErrorMessage;
