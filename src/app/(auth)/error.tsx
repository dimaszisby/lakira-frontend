"use client";

import { RouteErrorPanel } from "@/ui/RouteErrorPanel";

type AuthAreaErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

/**
 * Catches a render error on a sign-in or token page. It renders inside `(auth)/layout.tsx`, so
 * the header and the links to sign in and register stay.
 */
const AuthAreaError = ({ error, retry }: AuthAreaErrorProps) => (
  <RouteErrorPanel
    error={error}
    retry={retry}
    title="Unable to load this page"
    className="mx-auto max-w-2xl"
  />
);

export default AuthAreaError;
