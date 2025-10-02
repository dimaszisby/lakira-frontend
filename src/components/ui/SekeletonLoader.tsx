import React from "react";

interface SkeletonLoaderProps {
  count?: number; // Number of skeleton items
  className?: string; // Custom styles for different layouts
}

/**
 * SkeletonLoader Component
 * Displays animated placeholder blocks for content loading.
 */
const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ count = 3, className = "" }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`h-6 w-full animate-pulse rounded-lg bg-gray-300 ${className}`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
};

export default SkeletonLoader;
