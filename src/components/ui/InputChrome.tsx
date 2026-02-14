"use client";

import React from "react";

import { cn } from "@/src/lib/cn";

type Size = "sm" | "md" | "lg";

export type InputChromeProps = {
  children: React.ReactNode;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  hasError?: boolean;
  disabled?: boolean;
  size?: Size;
  className?: string;
  multiline?: boolean;
};

const InputChrome = ({
  children,
  leftAddon,
  rightAddon,
  hasError,
  disabled,
  size = "md",
  className,
  multiline = false,
}: InputChromeProps) => {
  const sizeCls = multiline
    ? size === "sm"
      ? "px-3 py-2 rounded-xl text-sm gap-2"
      : size === "lg"
        ? "px-5 py-3 rounded-2xl text-base gap-3"
        : "px-4 py-2.5 rounded-2xl text-base gap-3"
    : size === "sm"
      ? "min-h-10 px-3 rounded-xl text-sm gap-2"
      : size === "lg"
        ? "min-h-14 px-5 rounded-2xl text-base gap-3"
        : "min-h-12 px-4 rounded-2xl text-base gap-3";

  return (
    <div
      className={cn(
        "group/input relative flex w-full",
        multiline ? "items-start" : "items-center",
        "border border-border bg-surface shadow-sm transition-colors",
        "hover:border-ink-tertiary/40",
        "focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40",
        hasError &&
          "border-status-error ring-2 ring-status-error/20 focus-within:border-status-error focus-within:ring-status-error/30",
        disabled && "pointer-events-none bg-surface2 opacity-60",
        sizeCls,
        className,
      )}
    >
      {leftAddon ? <span className="shrink-0 text-ink-secondary">{leftAddon}</span> : null}

      <div className="min-w-0 flex-1">{children}</div>

      {rightAddon ? <span className="shrink-0">{rightAddon}</span> : null}
    </div>
  );
};

export default InputChrome;
