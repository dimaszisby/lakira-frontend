import { Files } from "phosphor-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface Props {
  title?: string;
  description?: string;
  tooltip?: string;
  icon?: ReactNode;
  className?: string;
}

const EmptyDataIndicator = ({
  title = "No data available",
  description = "No items found for this view.",
  tooltip,
  icon,
  className,
}: Props) => {
  return (
    <section className={cn("mt-8", className)} aria-label="Empty state">
      <div className="mx-auto flex max-w-md flex-col items-center justify-center space-y-6 text-center">
        <div className="flex min-h-[320px] w-full max-w-xs flex-col items-center justify-center space-y-4 rounded-2xl border border-border bg-surface p-8 shadow-sm">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-surface2 text-ink-secondary">
            {icon ?? <Files size={32} aria-hidden />}
          </div>
          <h2 className="text-center text-xl font-semibold text-ink">{title}</h2>
          <p className="text-center text-base text-ink-secondary">{description}</p>
        </div>

        {tooltip ? (
          <p
            className="flex items-center rounded-xl border border-status-info/30 bg-status-info/10 px-4 py-2 text-center text-sm text-status-info"
            aria-live="polite"
          >
            <span>{tooltip}</span>
          </p>
        ) : null}
      </div>
    </section>
  );
};

export default EmptyDataIndicator;
