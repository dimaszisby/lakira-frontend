import { memo } from "react";

import { cn } from "@/src/lib/cn";

import OverlineLabel from "./OverlineLabel";

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
      return "font-bold text-xl text-gray-800";
    case "md":
      return "text-gray-700 font-mono text-base";
    case "sm":
      return "text-gray-500 text-base";
  }
}

export const DataLabelBase = ({ title, value, className, size = "md", renderValue }: Props) => {
  return (
    <div className={cn("bg-red-100 block gap-2", className)}>
      <OverlineLabel text={title} />
      {renderValue ? renderValue : <span className={cn("w-full", getSize(size))}>{value}</span>}
    </div>
  );
};
DataLabelBase.displayName = "DataLabel";

const DataLabel = memo(DataLabelBase);
DataLabel.displayName = "DataLabel";
export default DataLabel;
