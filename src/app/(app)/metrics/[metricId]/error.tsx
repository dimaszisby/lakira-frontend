"use client";

import { useEffect } from "react";

import Button from "@/ui/Button";

const MetricDetailError = ({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) => {
  useEffect(() => {
    console.error("Metric detail route error:", error);
  }, [error]);

  return (
    <section className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
      <h2 className="text-2xl font-semibold text-destructive">Unable to load metric</h2>
      <p className="text-ink-muted mt-2 text-sm">
        {error.message || "Please refresh and try again."}
      </p>
      <div className="mt-6 flex justify-center">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            reset();
          }}
        >
          Try again
        </Button>
      </div>
    </section>
  );
};

export default MetricDetailError;
