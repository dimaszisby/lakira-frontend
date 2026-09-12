import type { SegmentOption } from "./SegmentedControl";
import { SegmentedControl } from "./SegmentedControl";

export type ListMode = "pages" | "scroll";

const OPTIONS: SegmentOption<ListMode>[] = [
  { value: "pages", label: "Paginated", description: "Page-by-page table view" },
  { value: "scroll", label: "Infinite", description: "Card list with infinite loading" },
];

export type ListModeToggleProps = {
  value: ListMode;
  onChange: (value: ListMode) => void;
  className?: string;
  "aria-label"?: string;
};

/** Switches a list between paginated and infinite-scroll display. */
export const ListModeToggle = ({
  value,
  onChange,
  className,
  "aria-label": ariaLabel = "Switch list display mode",
}: ListModeToggleProps) => (
  <SegmentedControl<ListMode>
    options={OPTIONS}
    value={value}
    onChange={(next) => onChange(next)}
    variant="pill"
    size="sm"
    fullWidth={false}
    aria-label={ariaLabel}
    className={className}
  />
);
