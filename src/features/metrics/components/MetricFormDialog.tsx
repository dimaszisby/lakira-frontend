"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import type { MetricFormInitial } from "@/features/metrics";

import MetricForm from "./MetricForm";

type MetricFormDialogProps = {
  initialMetric: MetricFormInitial | null;
};

const MetricFormDialog = ({ initialMetric }: MetricFormDialogProps) => {
  const router = useRouter();

  const handleClose = useCallback(() => {
    router.back();

    // Ensure parent route data is refreshed after closing the modal route.
    setTimeout(() => {
      router.refresh();
    }, 0);
  }, [router]);

  return <MetricForm initialMetric={initialMetric} onClose={handleClose} />;
};

export default MetricFormDialog;
