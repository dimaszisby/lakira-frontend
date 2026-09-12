import type { ComponentType, ReactNode } from "react";

import { cn } from "@/lib/cn";

type IconWeight = "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
type IconLabelTone = "default" | "muted" | "success" | "warning" | "danger";
type IconLabelSize = "sm" | "md";

export type IconProps = {
  size?: number | string;
  weight?: IconWeight;
  className?: string;
};

export type IconLabelProps = {
  label: ReactNode;
  icon: ComponentType<IconProps>;
  size?: IconLabelSize;
  /**
   * Success and warning tints fail text contrast on light surfaces, so for those
   * tones only the icon is coloured and the label stays neutral.
   */
  tone?: IconLabelTone;
  className?: string;
};

export const IconLabel = ({
  icon: Icon,
  label,
  size = "md",
  tone = "muted",
  className,
}: IconLabelProps) => (
  <span data-size={size} data-tone={tone} className={cn("icon-label", className)}>
    <Icon weight="bold" aria-hidden />
    <span>{label}</span>
  </span>
);
