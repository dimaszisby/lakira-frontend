"use client";

import { RouteErrorPanel } from "@/ui/RouteErrorPanel";

type AppAreaErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

/**
 * Catches a render error on any signed-in page that has no boundary of its own. It renders inside
 * `(app)/layout.tsx`, so the sidebar and the navigation stay and the user can go elsewhere.
 * Without it the error reached `global-error.tsx`, which replaces the whole document.
 */
const AppAreaError = ({ error, retry }: AppAreaErrorProps) => (
  <RouteErrorPanel
    error={error}
    retry={retry}
    title="Unable to load this page"
    className="mx-auto mt-8 max-w-2xl"
  />
);

export default AppAreaError;
