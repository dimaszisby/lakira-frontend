import type { ComponentType, ReactNode } from "react";
import { memo } from "react";

import { cn } from "@/lib/cn";

type IconWeight = "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
type ToneText = "default" | "muted" | "success" | "warning" | "danger";

export type IconProps = {
  size?: number | string;
  weight?: IconWeight;
  className?: string;
};

interface IconLabelProps {
  label: ReactNode;
  icon: ComponentType<IconProps>;
  size?: "sm" | "md";
  tone?: ToneText;
  className?: string;
  iconClassName?: string;
}

const toneToText = {
  default: "text-ink",
  muted: "text-ink-secondary",
  success: "text-status-success",
  warning: "text-status-warning",
  danger: "text-status-error",
} as const;

const sizeToText = { sm: "text-xs", md: "text-sm" } as const;
const sizeToIcon = { sm: 14, md: 16 } as const;

export const IconLabelBase = ({
  icon: Icon,
  label,
  size = "md",
  tone = "muted",
  className,
  iconClassName,
}: IconLabelProps) => (
  <span className={cn("inline-flex items-center font-semibold", sizeToText[size], toneToText[tone], className)}>
    <Icon size={sizeToIcon[size]} weight="bold" className={cn("mr-1", iconClassName)} aria-hidden />
    <span>{label}</span>
  </span>
);

IconLabelBase.displayName = "IconLabel";

const IconLabel = memo(IconLabelBase);
IconLabel.displayName = "IconLabel";

export default IconLabel;
