"use client";

import React from "react";

import { cn } from "@/src/lib/cn";

type Size = "sm" | "md" | "lg";

export type InputChromeProps = {
  children: React.ReactNode; // <input> or <textarea>
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  hasError?: boolean;
  disabled?: boolean;
  size?: Size;
  className?: string;
  multiline?: boolean; // NEW
};

// Compliance: Visually consistent field shell with hover/focus/error/disabled states.
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
  // height & alignment differ for multiline
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
        "border border-gray-200 bg-white shadow-sm transition-colors",
        "hover:border-gray-300",
        "focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-400",
        hasError && "border-red-400 ring-2 ring-red-200 focus-within:ring-red-300",
        disabled && "pointer-events-none bg-gray-50 opacity-60",
        sizeCls,
        className,
      )}
    >
      {leftAddon ? <span className="shrink-0 text-violet-500">{leftAddon}</span> : null}

      {/* content area */}
      <div className="min-w-0 flex-1">{children}</div>

      {rightAddon ? <span className="shrink-0">{rightAddon}</span> : null}
    </div>
  );
};

export default InputChrome;
