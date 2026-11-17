"use client";

import { Info, X } from "@phosphor-icons/react";

import { Button } from "@/ui/Button";

// Shown when some cards chart the last period with logs instead of the selected range (#205).
const FallbackBanner = ({ count, onDismiss }: { count: number; onDismiss: () => void }) => {
  const subject = count === 1 ? "1 metric has" : `${count} metrics have`;
  const cards = count === 1 ? "its card shows" : "their cards show";

  return (
    // status-info-bg stays a light tint in both themes, so the text takes the emphasis colour,
    // which is dark in both (8.44:1), rather than the theme's own text colour.
    <div className="flex items-start gap-3 rounded-xl border border-status-info bg-status-info-bg p-3 text-body2 text-status-info-emphasis">
      <Info aria-hidden="true" className="mt-0.5 shrink-0" size={18} />
      <p className="flex-1">
        {subject} no logs in the selected range, so {cards} the last period with logs.
      </p>
      <Button variant="tertiary" size="sm" onClick={onDismiss} aria-label="Dismiss notice">
        <X aria-hidden="true" size={16} />
      </Button>
    </div>
  );
};

export default FallbackBanner;
