"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";

import type { MetricSettingsExtendedVM } from "@/features/metric-settings/view-models";
import type { MetricHeaderVM } from "@/features/metrics/view-models";

type MetricDetailContextValue = {
  metricId: string;
  header: MetricHeaderVM;
  settings: MetricSettingsExtendedVM | null;
};

const MetricDetailContext = createContext<MetricDetailContextValue | null>(null);

export const MetricDetailProvider = ({
  value,
  children,
}: {
  value: MetricDetailContextValue;
  children: ReactNode;
}) => {
  return <MetricDetailContext.Provider value={value}>{children}</MetricDetailContext.Provider>;
};

export const useMetricDetail = () => {
  const context = useContext(MetricDetailContext);
  if (!context) {
    throw new Error("useMetricDetail must be used within MetricDetailProvider");
  }
  return context;
};
