import classNames from "classnames";
import type { ComponentType, ReactNode } from "react";
import { memo } from "react";

export type IconProps = {
  size?: number | string;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  className?: string;
};

interface IconLabelProps {
  label: ReactNode;
  icon: ComponentType<IconProps>;
  size?: "sm" | "md"; // layout scale
  tone?: "muted" | "default" | "success" | "warning" | "danger"; // semantic color
  className?: string;
  iconClassName?: string;
}

const toneToText = {
  muted: "text-gray-500",
  default: "text-gray-600",
  success: "text-green-600",
  warning: "text-yellow-600",
  danger: "text-red-600",
} as const;

const sizeToGap = { sm: "text-xs", md: "text-sm" } as const;
const sizeToIcon = { sm: 14, md: 16 } as const;

export const IconLabelBase = ({
  icon: Icon,
  label,
  size = "md",
  tone = "muted",
  className,
  iconClassName,
}: IconLabelProps) => (
  <div className={classNames("flex items-center", sizeToGap[size], toneToText[tone], className)}>
    <Icon
      size={sizeToIcon[size]}
      weight="regular"
      className={classNames("mr-1", iconClassName)}
      aria-hidden
    />
    <span>{label}</span>
  </div>
);
IconLabelBase.displayName = "IconLabel";

const IconLabel = memo(IconLabelBase);
IconLabel.displayName = "IconLabel";
export default IconLabel;
