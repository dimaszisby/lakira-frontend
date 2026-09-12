import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

type SpinnerSize = "sm" | "md" | "lg";

export type SpinnerProps = Omit<ComponentProps<"span">, "children"> & {
  size?: SpinnerSize;
};

/**
 * Decorative loading indicator. It is hidden from assistive technology, so the
 * element around it must announce the loading state (`role="status"`, `aria-busy`).
 */
export const Spinner = ({ size = "md", className, ...props }: SpinnerProps) => (
  <span aria-hidden="true" data-size={size} className={cn("spinner", className)} {...props} />
);
