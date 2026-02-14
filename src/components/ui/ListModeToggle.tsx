import type { KeyboardEvent } from "react";

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
  ariaLabel?: string;
};

const ListModeToggle = ({
  value,
  onChange,
  className,
  ariaLabel = "Switch list display mode",
}: Props) => {
  const activeIndex = OPTIONS.findIndex((option) => option.value === value);
  const safeActiveIndex = activeIndex >= 0 ? activeIndex : 0;

  const moveSelection = (event: KeyboardEvent<HTMLButtonElement>, toIndex: number) => {
    event.preventDefault();
    const nextOption = OPTIONS[toIndex];
    if (!nextOption) return;
    if (nextOption.value !== value) onChange(nextOption.value);

    const parent = event.currentTarget.parentElement;
    if (!parent) return;
    requestAnimationFrame(() => {
      const nextButton = parent.querySelector<HTMLButtonElement>(
        `button[data-list-mode="${nextOption.value}"]`,
      );
      nextButton?.focus();
    });
  };

  const handleOptionKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    optionIndex: number,
  ) => {
    if (event.key === "ArrowRight") {
      moveSelection(event, (optionIndex + 1) % OPTIONS.length);
      return;
    }

    if (event.key === "ArrowLeft") {
      moveSelection(event, (optionIndex - 1 + OPTIONS.length) % OPTIONS.length);
      return;
    }

    if (event.key === "Home") {
      moveSelection(event, 0);
      return;
    }

    if (event.key === "End") {
      moveSelection(event, OPTIONS.length - 1);
    }
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-surface2 p-1 text-sm font-medium shadow-sm",
        className,
      )}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {OPTIONS.map(({ value: optionValue, label, description }, optionIndex) => {
        const isActive = value === optionValue;
        return (
          <button
            key={optionValue}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={description}
            tabIndex={optionIndex === safeActiveIndex ? 0 : -1}
            data-list-mode={optionValue}
            className={cn(
              "rounded-full px-3 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "bg-surface text-brand-primary shadow-sm"
                : "text-ink-secondary hover:bg-surface hover:text-ink",
            )}
            onClick={() => {
              if (!isActive) onChange(optionValue);
            }}
            onKeyDown={(event) => handleOptionKeyDown(event, optionIndex)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default ListModeToggle;
