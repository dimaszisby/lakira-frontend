import { cn } from "@/lib/cn";

type ListMode = "pages" | "scroll";

const OPTIONS: Array<{ label: string; value: ListMode; description: string }> = [
  {
    value: "pages",
    label: "Paginated",
    description: "Page-by-page table view",
  },
  {
    value: "scroll",
    label: "Infinite",
    description: "Card list with infinite loading",
  },
];

type Props = {
  value: ListMode;
  onChange: (value: ListMode) => void;
  className?: string;
};

const ListModeToggle = ({ value, onChange, className }: Props) => {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-surface2 p-1 text-sm font-medium shadow-sm",
        className,
      )}
      role="group"
      aria-label="Switch list display mode"
    >
      {OPTIONS.map(({ value: optValue, label, description }) => {
        const isActive = value === optValue;
        return (
          <button
            key={optValue}
            type="button"
            className={cn(
              "rounded-full px-3 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
              isActive
                ? "bg-white text-brand-primary shadow"
                : "text-ink-secondary hover:text-ink-emphasis",
            )}
            aria-pressed={isActive}
            aria-label={description}
            onClick={() => {
              if (optValue !== value) onChange(optValue);
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default ListModeToggle;
