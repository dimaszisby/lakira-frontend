import { cn } from "@/lib/cn";

import { Spinner } from "./Spinner";

export type FullScreenSpinnerProps = {
  label?: string;
  className?: string;
};

export const FullScreenSpinner = ({ label = "Loading...", className }: FullScreenSpinnerProps) => (
  <div
    role="status"
    aria-live="polite"
    aria-busy="true"
    className={cn("fullscreen-spinner", className)}
  >
    <Spinner size="lg" />
    <span className="fullscreen-spinner-label">{label}</span>
  </div>
);
