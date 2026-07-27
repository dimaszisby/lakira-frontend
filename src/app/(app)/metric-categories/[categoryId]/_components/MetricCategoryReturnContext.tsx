"use client";

import { createContext, useContext } from "react";

import type { MetricCategoryListSearchParams } from "@/features/metric-categories/listSearchParams";

const MetricCategoryReturnContext = createContext<MetricCategoryListSearchParams | null>(null);

export const MetricCategoryReturnProvider = ({
  value,
  children,
}: {
  value: MetricCategoryListSearchParams | null;
  children: React.ReactNode;
}) => {
  return (
    <MetricCategoryReturnContext.Provider value={value}>
      {children}
    </MetricCategoryReturnContext.Provider>
  );
};

export const useMetricCategoryReturnParams = () => {
  return useContext(MetricCategoryReturnContext);
};
