import { memo } from "react";

import { cn } from "@/src/lib/cn";

type Size = "lg" | "md" | "sm";

interface Props {
  title: string;
  value: string | number | boolean | null;
  size?: Size;
  className?: string;
  renderValue?: React.ReactNode;
}

function getSize(valueStyle: Size) {
  switch (valueStyle) {
    case "lg":
      return "font-bold text-h4";
    case "md":
      return "text-body1";
    case "sm":
      return "text-body2";
  }
}

export const DataLabelBase = ({ title, value, className, size = "md", renderValue }: Props) => {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p className="text-overline">{title}</p>
      {renderValue ? renderValue : <span className={cn("w-full", getSize(size))}>{value}</span>}
    </div>
  );
};
DataLabelBase.displayName = "DataLabel";

const DataLabel = memo(DataLabelBase);
DataLabel.displayName = "DataLabel";
export default DataLabel;
