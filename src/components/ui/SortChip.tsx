import { CaretDown, CaretUp } from "phosphor-react";
import type { ComponentProps, ReactNode } from "react";

import type { SortOrder as SortDirection } from "@/generics/sort";
import { cn } from "@/lib/cn";

/** A sort direction, or `null` for "not sorted by this column". */
export type SortOrder = SortDirection | null;

export type SortChipProps = Omit<ComponentProps<"button">, "onClick" | "children"> & {
  label: string;
  sortOrder: SortOrder;
  onClick: () => void;
  /** Replaces the default label and direction icon. */
  children?: ReactNode;
};

const directionText = (sortOrder: SortDirection) =>
  sortOrder === "ASC" ? "ascending" : "descending";

export const SortChip = ({
  label,
  sortOrder,
  onClick,
  children,
  disabled = false,
  className,
  "aria-label": ariaLabel,
  ...props
}: SortChipProps) => {
  const isActive = sortOrder !== null;
  const accessibleName =
    ariaLabel ?? (isActive ? `${label} sorted ${directionText(sortOrder)}` : `${label} not sorted`);
  const DirectionIcon = sortOrder === "ASC" ? CaretUp : CaretDown;

  return (
    <button
      type="button"
      {...props}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isActive}
      aria-label={accessibleName}
      data-state={isActive ? "active" : "inactive"}
      className={cn("chip", className)}
    >
      {children ?? (
        <>
          <span>{label}</span>
          {isActive ? <DirectionIcon weight="bold" aria-hidden /> : null}
        </>
      )}
    </button>
  );
};
