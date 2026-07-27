"use client";

import { createContext, useContext } from "react";

import type { MetricCategoryVM } from "@/features/metric-categories/view-models";

const MetricCategoryDetailContext = createContext<MetricCategoryVM | null>(null);

export const MetricCategoryDetailProvider = ({
  value,
  children,
}: {
  value: MetricCategoryVM;
  children: React.ReactNode;
}) => {
  return (
    <MetricCategoryDetailContext.Provider value={value}>
      {children}
    </MetricCategoryDetailContext.Provider>
  );
};

export const useMetricCategoryDetail = () => {
  const context = useContext(MetricCategoryDetailContext);
  if (!context) {
    throw new Error("useMetricCategoryDetail must be used within MetricCategoryDetailProvider");
  }
  return context;
};
