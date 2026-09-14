import { Files } from "@phosphor-icons/react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type TitleElement = "h2" | "h3" | "h4";

export type EmptyDataIndicatorProps = {
  title?: string;
  description?: string;
  tooltip?: string;
  icon?: ReactNode;
  /** A next step, such as a "Create" button. */
  action?: ReactNode;
  /** Heading level for the title, so it fits the page outline. */
  titleAs?: TitleElement;
  className?: string;
};

export const EmptyDataIndicator = ({
  title = "No data available",
  description = "No items found for this view.",
  tooltip,
  icon,
  action,
  titleAs: Title = "h2",
  className,
}: EmptyDataIndicatorProps) => (
  <section aria-label="Empty state" className={cn("empty-state", className)}>
    <div className="empty-state-panel">
      <div className="empty-state-icon">{icon ?? <Files aria-hidden />}</div>
      <Title className="empty-state-title">{title}</Title>
      <p className="empty-state-description">{description}</p>
      {action ? <div className="empty-state-action">{action}</div> : null}
    </div>

    {tooltip ? (
      <p className="empty-state-tip" aria-live="polite">
        {tooltip}
      </p>
    ) : null}
  </section>
);
