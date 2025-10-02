import { memo } from "react";

import OverlineLabel from "./OverlineLabel";

interface Props {
  title: string;
  value: string | number | null;
  valueStyle?: "xl" | "md" | "sm";
  className?: string;
  renderValue?: React.ReactNode;
}

function getValueStyling(valueStyle: "xl" | "md" | "sm" | null) {
  switch (valueStyle) {
    case "xl":
      return "font-bold text-xl text-gray-800";
    case "md":
      return "text-gray-700 font-mono text-base";
    case "sm":
      return "text-gray-500 text-base";
    default: // null
      return "text-gray-700 font-mono text-base";
  }
}

export const DataLabelBase = ({ title, value, className = "", valueStyle, renderValue }: Props) => {
  const normalizedValue = value ? value : "-";
  const normalizedValueStyle = valueStyle ? valueStyle : null;

  return (
    <div className={`block flex-col gap-2 ${className}`}>
      <OverlineLabel text={title} />
      {renderValue ? (
        renderValue
      ) : (
        <span className={`w-full ${getValueStyling(normalizedValueStyle)}`}>{normalizedValue}</span>
      )}
    </div>
  );
};
DataLabelBase.displayName = "DataLabel";

const DataLabel = memo(DataLabelBase);
DataLabel.displayName = "DataLabel";
export default DataLabel;
