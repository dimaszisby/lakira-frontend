import { cn } from "@/lib/cn";

export type SkeletonLoaderProps = {
  count?: number;
  label?: string;
  /** Applied to the group. */
  className?: string;
  /** Applied to every placeholder bar, e.g. a height. */
  itemClassName?: string;
};

export const SkeletonLoader = ({
  count = 3,
  label = "Loading content",
  className,
  itemClassName,
}: SkeletonLoaderProps) => (
  <div
    role="status"
    aria-live="polite"
    aria-label={label}
    className={cn("skeleton-group", className)}
  >
    {Array.from({ length: count }, (_, index) => (
      <div key={index} aria-hidden="true" className={cn("skeleton", itemClassName)} />
    ))}
  </div>
);
