import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type InputChromeSize = "sm" | "md" | "lg";

export type InputChromeProps = {
  children: ReactNode;
  leftAddon?: ReactNode;
  rightAddon?: ReactNode;
  invalid?: boolean;
  disabled?: boolean;
  size?: InputChromeSize;
  /** Top-aligns content and pads vertically, for textareas. */
  multiline?: boolean;
  className?: string;
};

/** The shared field shell: border, background, sizing and focus/invalid/disabled states. */
export const InputChrome = ({
  children,
  leftAddon,
  rightAddon,
  invalid = false,
  disabled = false,
  size = "md",
  multiline = false,
  className,
}: InputChromeProps) => (
  <div
    data-size={size}
    data-invalid={invalid ? "" : undefined}
    data-disabled={disabled ? "" : undefined}
    data-multiline={multiline ? "" : undefined}
    className={cn("input-shell", className)}
  >
    {leftAddon ? (
      <span className="input-addon" data-side="left">
        {leftAddon}
      </span>
    ) : null}

    <div className="input-body">{children}</div>

    {rightAddon ? (
      <span className="input-addon" data-side="right">
        {rightAddon}
      </span>
    ) : null}
  </div>
);
