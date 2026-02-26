"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import type { MetricLogVM } from "@/features/metric-logs/view-models";

import MetricLogForm from "./LogForm";

type MetricLogFormDialogProps = {
  metricId: string;
  initialLog?: MetricLogVM | null;
};

const MetricLogFormDialog = ({ metricId, initialLog }: MetricLogFormDialogProps) => {
  const router = useRouter();

  const handleClose = useCallback(() => {
    router.back();
    setTimeout(() => {
      router.refresh();
    }, 0);
  }, [router]);

  return (
    <MetricLogForm
      metricId={metricId}
      initialLog={initialLog}
      onClose={handleClose}
    />
  );
};

export default MetricLogFormDialog;
