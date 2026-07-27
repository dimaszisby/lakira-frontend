import { cn } from "@/lib/cn";

type FullScreenSpinnerProps = {
  label?: string;
  className?: string;
};

export const FullScreenSpinner = ({
  label = "Loading...",
  className,
}: FullScreenSpinnerProps) => {
  return (
    <div
      className={cn("fixed inset-0 z-[60] grid place-items-center bg-surface/70", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-3">
        <span
          aria-hidden="true"
          className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-ink-secondary border-r-transparent"
        />
        <span className="text-sm text-ink-secondary">{label}</span>
      </div>
    </div>
  );
};
