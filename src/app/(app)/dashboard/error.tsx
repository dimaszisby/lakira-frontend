"use client";

import { useEffect } from "react";

import Button from "@/ui/Button";

type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const DashboardError = ({ error, reset }: DashboardErrorProps) => {
  useEffect(() => {
    console.error("Dashboard route error:", error);
  }, [error]);

  return (
    <section className="border-destructive/20 bg-destructive/5 mx-auto max-w-2xl rounded-xl border p-8 text-center">
      <h2 className="text-destructive text-2xl font-semibold">Unable to load dashboard</h2>
      <p className="text-ink-muted mt-2 text-sm">
        {error.message || "Please try refreshing the page."}
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

export default DashboardError;
