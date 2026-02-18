import { cn } from "@/lib/cn";

type SkeletonLoaderProps = {
  count?: number;
  className?: string;
};

const SkeletonLoader = ({ count = 3, className }: SkeletonLoaderProps) => {
  return (
    <div className="space-y-4" role="status" aria-live="polite" aria-label="Loading content">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className={cn("h-6 w-full animate-pulse rounded-lg bg-surface2", className)}
          aria-hidden="true"
        />
      ))}
    </div>
  );
};

export default SkeletonLoader;
