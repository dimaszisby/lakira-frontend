// src/features/metric-categories/view-models.ts
export type MetricCategoryVM = {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

// The UI shape is strictly non-nullable for rendering.
export type MetricCategoryUI = Readonly<{
  id?: string;
  name: string;
  color: `#${string}`; // hex-like strings
  icon: string;
}>;
