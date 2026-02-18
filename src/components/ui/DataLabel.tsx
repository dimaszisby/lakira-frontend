import type { ReactNode } from "react";
import { memo } from "react";

import { cn } from "@/lib/cn";

type Size = "lg" | "md" | "sm";

interface Props {
  title: string;
  value: string | number | boolean | null;
  size?: Size;
  className?: string;
  renderValue?: ReactNode;
}

const VALUE_SIZE: Record<Size, string> = {
  lg: "font-bold text-h4",
  md: "text-body1",
  sm: "text-body2",
};

function formatValue(value: Props["value"]) {
  if (value === null) return "";
  if (typeof value === "boolean") return value ? "True" : "False";
  return String(value);
}

export const DataLabelBase = ({ title, value, className, size = "md", renderValue }: Props) => {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p className="text-overline text-ink-secondary">{title}</p>
      {renderValue ? (
        <div className="w-full text-ink">{renderValue}</div>
      ) : (
        <span className={cn("w-full text-ink", VALUE_SIZE[size])}>{formatValue(value)}</span>
      )}
    </div>
  );
};
DataLabelBase.displayName = "DataLabel";

const DataLabel = memo(DataLabelBase);
DataLabel.displayName = "DataLabel";
export default DataLabel;
