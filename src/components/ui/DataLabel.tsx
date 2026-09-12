import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type DataLabelSize = "sm" | "md" | "lg";

export type DataLabelProps = {
  title: string;
  value: string | number | boolean | null;
  size?: DataLabelSize;
  /** Custom content shown instead of `value`. */
  renderValue?: ReactNode;
  className?: string;
};

const formatValue = (value: DataLabelProps["value"]) => {
  if (value === null) return "";
  if (typeof value === "boolean") return value ? "True" : "False";
  return String(value);
};

export const DataLabel = ({
  title,
  value,
  size = "md",
  renderValue,
  className,
}: DataLabelProps) => (
  <div data-size={size} className={cn("data-label", className)}>
    <p className="data-label-title text-overline">{title}</p>
    {renderValue ? (
      <div className="data-label-value">{renderValue}</div>
    ) : (
      <span className="data-label-value data-label-text">{formatValue(value)}</span>
    )}
  </div>
);
